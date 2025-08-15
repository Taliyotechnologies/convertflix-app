const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const auth = require('../middleware/auth');
const { getUsers, saveUsers } = require('../utils/dataStore');

async function requireAdmin(req, res, next) {
  try {
    const list = await getUsers();
    const me = (list || []).find(u => u.id === req.user?.userId);
    if (!me || (me.role || 'user') !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
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
    const list = await getUsers();
    if ((list || []).some(u => (u.email || '').toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8),
      name,
      fullName: name,
      email,
      password: hashed,
      role: role === 'admin' ? 'admin' : 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: null,
    };
    await saveUsers([...(list || []), user]);
    const { password: _, ...safe } = user;
    res.status(201).json(safe);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error creating user' });
  }
});

// DELETE /api/users/:id - delete user (admin only)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const list = await getUsers();
    const idx = (list || []).findIndex(u => u.id === id);
    if (idx < 0) return res.status(404).json({ error: 'User not found' });
    const next = [...list];
    next.splice(idx, 1);
    await saveUsers(next);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

// POST /api/users/:id/reset-password - reset password (admin only)
router.post('/:id/reset-password', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const list = await getUsers();
    const idx = (list || []).findIndex(u => u.id === id);
    if (idx < 0) return res.status(404).json({ error: 'User not found' });
    const temp = 'Temp' + Math.random().toString(36).slice(2, 10);
    const hashed = await bcrypt.hash(temp, 10);
    const updated = { ...list[idx], password: hashed };
    const next = [...list];
    next[idx] = updated;
    await saveUsers(next);
    // For security, we don't return the password; in real app, send email.
    res.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error resetting password' });
  }
});

module.exports = router;
