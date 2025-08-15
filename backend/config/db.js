const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { getUsers } = require('../utils/dataStore');
const User = require('../models/User');

mongoose.set('strictQuery', true);

async function migrateJsonUsersIfEmpty() {
  try {
    const count = await User.estimatedDocumentCount();
    if (count > 0) return;

    // Try migrating existing JSON users first
    const jsonUsers = await getUsers().catch(() => []);
    if (Array.isArray(jsonUsers) && jsonUsers.length > 0) {
      const docs = jsonUsers.map(u => ({
        fullName: u.fullName || u.name || '',
        email: (u.email || '').toLowerCase(),
        password: u.password || '',
        role: u.role || 'user',
        status: u.status || 'active',
        avatar: u.avatar,
        createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
        lastLogin: u.lastLogin ? new Date(u.lastLogin) : null,
        googleId: !!u.googleId,
      }));
      if (docs.length > 0) {
        await User.insertMany(docs, { ordered: false }).catch(() => {});
        return;
      }
    }

    // Seed demo users if still empty
    const demoUsers = [
      { fullName: 'Demo User', email: 'demo@example.com', password: 'password123', role: 'user' },
      { fullName: 'Admin User', email: 'admin@convertflix.com', password: 'admin123', role: 'admin' },
    ];
    for (const du of demoUsers) {
      const exists = await User.findOne({ email: du.email.toLowerCase() }).lean();
      if (!exists) {
        const hashed = await bcrypt.hash(du.password, 10);
        await User.create({
          fullName: du.fullName,
          email: du.email.toLowerCase(),
          password: hashed,
          role: du.role,
          status: 'active',
        });
      }
    }
  } catch (e) {
    console.error('Mongo migration/seed error:', e.message || e);
  }
}

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('ℹ️  MONGODB_URI not set. Running with JSON file storage.');
    return null;
  }
  try {
    await mongoose.connect(uri, {
      // Options can be provided if needed
    });
    console.log('✅ MongoDB connected');
    await migrateJsonUsersIfEmpty();
    return mongoose.connection;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message || err);
    console.log('Falling back to JSON file storage.');
    return null;
  }
}

module.exports = { connectDB };
