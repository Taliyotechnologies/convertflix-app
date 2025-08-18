const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const auth = require('../middleware/auth');
const { getUsers, saveUsers } = require('../utils/dataStore');
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

async function requireAdmin(req, res, next) {
  try {
    if (useMongo()) {
      const doc = await User.findById(req.user?.userId).lean();
      const roleNorm = normalizeRole(doc && doc.role);
      if (!doc || !['admin', 'sub-admin'].includes(roleNorm)) {
        return res.status(403).json({ error: 'Admin access required' });
      }
    } else {
      const list = await getUsers();
      const me = (list || []).find(u => u.id === req.user?.userId);
      const roleNorm = normalizeRole(me && me.role);
      if (!me || !['admin', 'sub-admin'].includes(roleNorm)) {
        return res.status(403).json({ error: 'Admin access required' });
      }
    }
    next();
  } catch (e) {
    console.error('Admin check error:', e);
    res.status(500).json({ error: 'Server error' });
  }
}

// POST /api/users - create user (admin only)
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role } = req.body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }
    // Normalize role to accept variants like "Sub Admin", "subadmin", "sub_admin", "Sub-Admin"
    const finalRole = normalizeRole(role);
    if (process.env.NODE_ENV !== 'production') {
      try { console.log('[users:create] incoming role=', role, 'finalRole=', finalRole, 'mongo=', useMongo()); } catch (_) {}
    }
    const hashed = await bcrypt.hash(password, 10);
    if (useMongo()) {
      const existing = await User.findOne({ email: (email || '').toLowerCase() }).lean();
      if (existing) return res.status(400).json({ error: 'User already exists with this email' });
      const doc = await User.create({
        fullName: name,
        email: (email || '').toLowerCase(),
        password: hashed,
        role: finalRole,
        status: 'active',
      });
      const safe = {
        id: doc._id.toString(),
        name: doc.fullName,
        fullName: doc.fullName,
        email: doc.email,
        role: doc.role,
        status: doc.status,
        createdAt: doc.createdAt,
        lastLogin: doc.lastLogin || null,
      };
      try { realtime.emit('users_updated', { created: safe.id }); } catch (_) {}
      res.status(201).json(safe);
    } else {
      const list = await getUsers();
      if ((list || []).some(u => (u.email || '').toLowerCase() === (email || '').toLowerCase())) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }
      const user = {
        id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
        name,
        fullName: name,
        email,
        password: hashed,
        role: finalRole,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastLogin: null,
      };
      await saveUsers([...(list || []), user]);
      const { password: _, ...safe } = user;
      try { realtime.emit('users_updated', { created: safe.id }); } catch (_) {}
      res.status(201).json(safe);
    }
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error creating user' });
  }
});

// DELETE /api/users/:id - delete user (admin only)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (useMongo()) {
      const result = await User.deleteOne({ _id: id });
      if (result.deletedCount === 0) return res.status(404).json({ error: 'User not found' });
      try { realtime.emit('users_updated', { deleted: id }); } catch (_) {}
      res.json({ success: true });
    } else {
      const list = await getUsers();
      const idx = (list || []).findIndex(u => u.id === id);
      if (idx < 0) return res.status(404).json({ error: 'User not found' });
      const next = [...list];
      next.splice(idx, 1);
      await saveUsers(next);
      try { realtime.emit('users_updated', { deleted: id }); } catch (_) {}
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

// POST /api/users/:id/reset-password - reset password (admin only)
router.post('/:id/reset-password', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const temp = 'Temp' + Math.random().toString(36).slice(2, 10);
    const hashed = await bcrypt.hash(temp, 10);
    if (useMongo()) {
      const doc = await User.findById(id);
      if (!doc) return res.status(404).json({ error: 'User not found' });
      doc.password = hashed;
      await doc.save();
      // Return one-time temporary password so admin can deliver it to the user
      res.json({ success: true, tempPassword: temp });
    } else {
      const list = await getUsers();
      const idx = (list || []).findIndex(u => u.id === id);
      if (idx < 0) return res.status(404).json({ error: 'User not found' });
      const updated = { ...list[idx], password: hashed };
      const next = [...list];
      next[idx] = updated;
      await saveUsers(next);
      // Return one-time temporary password so admin can deliver it to the user
      res.json({ success: true, tempPassword: temp });
    }
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error resetting password' });
  }
});

module.exports = router;
