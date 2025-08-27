const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getUsers, getSettings, saveSettings } = require('../utils/dataStore');
const mongoose = require('mongoose');
const User = require('../models/User');
const { computeStats } = require('../utils/stats');
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

// Only allow 'admin' and 'sub-admin' to access admin routes
async function requireAdmin(req, res, next) {
  try {
    if (useMongo()) {
      const me = await User.findById(req.user?.userId).lean();
      const roleNorm = normalizeRole(me && me.role);
      if (!me || !['admin', 'sub-admin'].includes(roleNorm)) {
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
    console.error('Admin check error (admin.js):', e);
    res.status(500).json({ error: 'Server error' });
  }
}

// @route   GET /api/admin/stats
// @desc    Get dashboard stats
// @access  Private (Admin)
router.get('/stats', auth, requireAdmin, async (req, res) => {
  try {
    const stats = await computeStats();
    res.json(stats);
  } catch (e) {
    console.error('Get admin stats error:', e);
    res.status(500).json({ error: 'Server error getting admin stats' });
  }
});

// @route   GET /api/admin/stream
// @desc    SSE removed (no admin pages rely on it)
// @access  Private (Admin)
router.get('/stream', auth, requireAdmin, async (req, res) => {
  return res.status(410).json({ error: 'SSE removed' });
});

// @route   GET /api/admin/files
// @desc    Removed (Files page removed)
// @access  Private (Admin)
router.get('/files', auth, requireAdmin, async (req, res) => {
  return res.status(410).json({ error: 'Files API removed' });
});

// Activity endpoint removed (Analytics page removed)

// Users listing endpoint removed (Users page removed)

// @route   GET /api/admin/settings
// @desc    Get admin settings
// @access  Private (Admin)
router.get('/settings', auth, requireAdmin, async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (error) {
    console.error('Get admin settings error:', error);
    res.status(500).json({ error: 'Server error getting admin settings' });
  }
});

// @route   PUT /api/admin/settings
// @desc    Update admin settings
// @access  Private (Admin)
router.put('/settings', auth, requireAdmin, async (req, res) => {
  try {
    const { siteName, maxFileSize, allowedFormats, maintenanceMode, emailNotifications, adminNotifications, autoDeleteDays } = req.body || {};
    const updated = await saveSettings({ siteName, maxFileSize, allowedFormats, maintenanceMode, emailNotifications, adminNotifications, autoDeleteDays });
    res.json(updated);
  } catch (error) {
    console.error('Update admin settings error:', error);
    res.status(500).json({ error: 'Server error updating admin settings' });
  }
});

// @route   DELETE /api/admin/files/:id
// @desc    Removed (Files page removed)
// @access  Private (Admin)
router.delete('/files/:id', auth, requireAdmin, async (req, res) => {
  return res.status(410).json({ error: 'Files API removed' });
});

// Contacts endpoints removed (Contacts page removed)

module.exports = router;
