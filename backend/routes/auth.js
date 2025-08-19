const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth');
const { getUsers, saveUsers, getResetTokens, saveResetTokens } = require('../utils/dataStore');
const mongoose = require('mongoose');
const User = require('../models/User');
const realtime = require('../utils/realtime');
const useMongo = () => {
  try { return mongoose.connection && mongoose.connection.readyState === 1; } catch (_) { return false; }
};

// Normalize role to consistent values
function normalizeRole(r) {
  try {
    const base = String(r || '')
      .trim()
      .toLowerCase()
      .replace(/\s+|_/g, '-');
    const collapsed = base.replace(/-/g, '');
    if (base === 'admin' || collapsed === 'admin') return 'admin';
    if (base === 'sub-admin' || collapsed === 'subadmin') return 'sub-admin';
    return 'user';
  } catch (_) {
    return 'user';
  }
}

// Email configuration: use SMTP if provided, else log to console
function createTransporter() {
  try {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 0) || undefined;
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const service = process.env.SMTP_SERVICE; // optional (e.g., 'gmail')
    if ((!host && !service) || !user || !pass) return null;
    const options = service
      ? { service, auth: { user, pass } }
      : { host, port, secure, auth: { user, pass } };
    return nodemailer.createTransport(options);
  } catch (_) {
    return null;
  }
}

const transporter = createTransporter();

async function sendEmail(to, subject, html) {
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@convertflix.com',
        to,
        subject,
        html,
      });
      return;
    } catch (e) {
      console.error('Email send error, falling back to console:', e && e.message ? e.message : e);
    }
  }
  console.log('Email (log fallback):');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Content:', html);
}

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // Validate input
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let createdUserId, createdUserEmail, createdUserFullName, createdUserRole;

    if (useMongo()) {
      const existing = await User.findOne({ email: (email || '').toLowerCase() }).lean();
      if (existing) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }
      const doc = await User.create({
        fullName,
        email: (email || '').toLowerCase(),
        password: hashedPassword,
        role: normalizeRole(role),
        status: 'active',
        lastLogin: new Date(),
      });
      createdUserId = doc._id.toString();
      createdUserEmail = doc.email;
      createdUserFullName = doc.fullName;
      createdUserRole = normalizeRole(doc.role);
    } else {
      // JSON fallback
      const list = await getUsers();
      const exists = (list || []).some(u => (u.email || '').toLowerCase() === (email || '').toLowerCase());
      if (exists) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }
      const user = {
        id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
        fullName,
        name: fullName,
        email,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        role: normalizeRole(role),
        status: 'active'
      };
      await saveUsers([...(list || []), user]);
      createdUserId = user.id;
      createdUserEmail = user.email;
      createdUserFullName = user.fullName;
      createdUserRole = normalizeRole(user.role);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: createdUserId, email: createdUserEmail },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '7d' }
    );

    // Notify admin dashboards
    try { realtime.emit('users_updated', { created: createdUserId }); } catch (_) {}
    // Also refresh stats so Active Users updates immediately
    try { realtime.emit('stats_metrics_updated', { reason: 'user_signup' }); } catch (_) {}

    res.status(201).json({
      success: true,
      token,
      user: {
        id: createdUserId,
        fullName: createdUserFullName,
        email: createdUserEmail,
        role: normalizeRole(createdUserRole)
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Find user (Mongo first, then JSON fallback)
    let dbUser = null;
    if (useMongo()) {
      dbUser = await User.findOne({ email: (email || '').toLowerCase() });
    } else {
      const list = await getUsers();
      dbUser = (list || []).find(u => (u.email || '').toLowerCase() === (email || '').toLowerCase());
    }
    if (!dbUser) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const hashed = dbUser.password || '';
    const isMatch = await bcrypt.compare(password, hashed);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update lastLogin for Mongo path (best-effort)
    if (useMongo() && dbUser && dbUser._id) {
      try { await User.updateOne({ _id: dbUser._id }, { $set: { lastLogin: new Date() } }); } catch (_) {}
    } else {
      // JSON storage: persist lastLogin so active users reflects recent logins
      try {
        const list = await getUsers();
        const idx = (list || []).findIndex(u => (u.email || '').toLowerCase() === (email || '').toLowerCase());
        if (idx >= 0) {
          const updated = { ...list[idx], lastLogin: new Date().toISOString() };
          const next = [...list];
          next[idx] = updated;
          await saveUsers(next);
        }
      } catch (_) {}
    }
    // Refresh stats immediately (updates activeUsers on the dashboard)
    try { realtime.emit('stats_metrics_updated', { reason: 'user_login' }); } catch (_) {}

    const userId = dbUser._id ? dbUser._id.toString() : dbUser.id;
    const token = jwt.sign(
      { userId, email: dbUser.email },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: userId,
        fullName: dbUser.fullName || dbUser.name || '',
        email: dbUser.email,
        role: normalizeRole(dbUser.role)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    if (useMongo()) {
      const doc = await User.findById(req.user.userId).lean();
      if (!doc) return res.status(404).json({ error: 'User not found' });
      res.json({
        success: true,
        user: {
          id: doc._id.toString(),
          email: doc.email,
          fullName: doc.fullName || '',
          role: normalizeRole(doc.role)
        }
      });
    } else {
      const list = await getUsers();
      const user = (list || []).find(u => u.id === req.user.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName || user.name || '',
          role: normalizeRole(user.role)
        }
      });
    }
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error getting profile' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists (but don't reveal result); only proceed if exists
    let exists = false;
    if (useMongo()) {
      const doc = await User.findOne({ email: (email || '').toLowerCase() }).lean();
      exists = !!doc;
    } else {
      const list = await getUsers();
      exists = (list || []).some(u => (u.email || '').toLowerCase() === (email || '').toLowerCase());
    }

    if (exists) {
      // Generate reset token and persist
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      const tokens = await getResetTokens();
      tokens[resetToken] = { email, expiry: resetTokenExpiry.toISOString() };
      await saveResetTokens(tokens);

      // Build reset URL targeting the Admin Panel
      const appBase = process.env.ADMIN_PANEL_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${appBase.replace(/\/$/, '')}/reset-password?token=${resetToken}`;

      // Send email
      const html = `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your ConvertFlix account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 16px 0;">
          Reset Password
        </a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The ConvertFlix Team</p>
      `;
      await sendEmail(email, 'Password Reset Request - ConvertFlix', html);
    }

    // Always return generic response
    res.json({ success: true, message: 'If an account exists, a reset email has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error during password reset request' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    // Check if token exists and is valid (from persistent store)
    const tokens = await getResetTokens();
    const resetData = tokens[token];
    if (!resetData || new Date() > new Date(resetData.expiry)) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (useMongo()) {
      const doc = await User.findOne({ email: (resetData.email || '').toLowerCase() });
      if (!doc) return res.status(400).json({ error: 'User not found' });
      doc.password = hashedPassword;
      await doc.save();
    } else {
      const list = await getUsers();
      const idx = (list || []).findIndex(u => (u.email || '').toLowerCase() === (resetData.email || '').toLowerCase());
      if (idx < 0) return res.status(400).json({ error: 'User not found' });
      const updated = { ...list[idx], password: hashedPassword };
      const next = [...list];
      next[idx] = updated;
      await saveUsers(next);
    }

    // Remove used token from store
    try {
      delete tokens[token];
      await saveResetTokens(tokens);
    } catch (_) {}

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error during password reset' });
  }
});

// @route   POST /api/auth/google
// @desc    Google OAuth login/signup
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { googleToken, email, fullName, avatar } = req.body;

    if (!googleToken || !email || !fullName) {
      return res.status(400).json({ error: 'Google token, email, and name are required' });
    }

    // In a real app, verify the Google token
    // For demo purposes, we'll trust the provided data

    if (useMongo()) {
      let doc = await User.findOne({ email: (email || '').toLowerCase() });
      if (!doc) {
        doc = await User.create({
          fullName,
          email: (email || '').toLowerCase(),
          password: '',
          role: 'user',
          avatar,
          googleId: true,
          status: 'active',
          lastLogin: new Date(),
        });
        try { realtime.emit('users_updated', { created: doc._id.toString() }); } catch (_) {}
        try { realtime.emit('stats_metrics_updated', { reason: 'google_signup' }); } catch (_) {}
      } else {
        try { await User.updateOne({ _id: doc._id }, { $set: { lastLogin: new Date(), avatar } }); } catch (_) {}
        try { realtime.emit('stats_metrics_updated', { reason: 'google_login' }); } catch (_) {}
      }

      const token = jwt.sign(
        { userId: doc._id.toString(), email: doc.email },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
        { expiresIn: '7d' }
      );
      return res.json({
        success: true,
        token,
        user: {
          id: doc._id.toString(),
          fullName: doc.fullName,
          email: doc.email,
          role: normalizeRole(doc.role),
          avatar: doc.avatar
        }
      });
    } else {
      const list = await getUsers();
      let user = (list || []).find(u => (u.email || '').toLowerCase() === (email || '').toLowerCase());
      if (!user) {
        user = {
          id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
          fullName,
          name: fullName,
          email,
          password: '',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          role: 'user',
          avatar,
          googleId: true,
          status: 'active'
        };
        await saveUsers([...(list || []), user]);
        try { realtime.emit('users_updated', { created: user.id }); } catch (_) {}
        try { realtime.emit('stats_metrics_updated', { reason: 'google_signup_json' }); } catch (_) {}
      } else {
        // Existing JSON user: update lastLogin and avatar to reflect activity
        try {
          const idx = (list || []).findIndex(u => (u.email || '').toLowerCase() === (email || '').toLowerCase());
          if (idx >= 0) {
            const updated = { ...list[idx], lastLogin: new Date().toISOString(), avatar };
            const next = [...list];
            next[idx] = updated;
            await saveUsers(next);
          }
        } catch (_) {}
        try { realtime.emit('stats_metrics_updated', { reason: 'google_login_json' }); } catch (_) {}
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
        { expiresIn: '7d' }
      );
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: normalizeRole(user.role),
          avatar: user.avatar
        }
      });
    }
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Server error during Google authentication' });
  }
});

// Initialize demo users (JSON fallback only)
const initializeDemoUsers = async () => {
  if (useMongo()) return;
  const demoUsers = [
    {
      email: 'demo@example.com',
      fullName: 'Demo User',
      password: 'password123',
      role: 'user'
    },
    {
      email: 'admin@convertflix.com',
      fullName: 'Admin User',
      password: 'admin123',
      role: 'admin'
    }
  ];

  const list = await getUsers();
  const next = [...(list || [])];
  // Seed/update admin from environment variables if provided
  const envEmail = (process.env.INIT_ADMIN_EMAIL || '').toLowerCase().trim();
  const envPassword = process.env.INIT_ADMIN_PASSWORD;
  const envName = process.env.INIT_ADMIN_NAME || 'Admin User';
  if (envEmail && envPassword) {
    const idx = next.findIndex(u => (u.email || '').toLowerCase() === envEmail);
    if (idx === -1) {
      const hashedEnv = await bcrypt.hash(envPassword, 10);
      next.push({
        id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
        fullName: envName,
        name: envName,
        email: envEmail,
        password: hashedEnv,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        role: 'admin',
        status: 'active'
      });
      console.log(`✅ Seeded env admin (JSON): ${envEmail}`);
    } else {
      const user = { ...next[idx] };
      let updated = false;
      if ((user.role || 'user') !== 'admin') { user.role = 'admin'; updated = true; }
      if (envName && (user.fullName !== envName || user.name !== envName)) { user.fullName = envName; user.name = envName; updated = true; }
      try {
        const match = await bcrypt.compare(envPassword, user.password || '');
        if (!match) {
          user.password = await bcrypt.hash(envPassword, 10);
          updated = true;
        }
      } catch (_) {
        user.password = await bcrypt.hash(envPassword, 10);
        updated = true;
      }
      if (updated) {
        next[idx] = user;
        console.log(`🔁 Updated env admin (JSON): ${envEmail}`);
      } else {
        console.log(`ℹ️ Env admin already up to date (JSON): ${envEmail}`);
      }
    }
  }

  for (const demoUser of demoUsers) {
    const exists = next.some(u => (u.email || '').toLowerCase() === demoUser.email.toLowerCase());
    if (!exists) {
      const hashedPassword = await bcrypt.hash(demoUser.password, 10);
      next.push({
        id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
        fullName: demoUser.fullName,
        name: demoUser.fullName,
        email: demoUser.email,
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        role: demoUser.role,
        status: 'active'
      });
    }
  }
  await saveUsers(next);
};

// Initialize demo users on startup (only for JSON storage)
initializeDemoUsers();

module.exports = router;

