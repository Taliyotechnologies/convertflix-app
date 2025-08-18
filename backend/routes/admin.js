const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const { getUsers, getSettings, saveSettings, getActivities } = require('../utils/dataStore');
const realtime = require('../utils/realtime');
const { computeStats } = require('../utils/stats');
const { listFiles } = require('../utils/files');
const mongoose = require('mongoose');
const User = require('../models/User');
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
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/stats', auth, requireAdmin, async (req, res) => {
  try {
    const stats = await computeStats();
    res.json(stats);
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Server error getting admin stats' });
  }
});

// @route   GET /api/admin/stream
// @desc    SSE stream for realtime admin updates
// @access  Private (Admin)
router.get('/stream', auth, requireAdmin, async (req, res) => {
  // SSE headers
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  if (typeof res.flushHeaders === 'function') {
    try { res.flushHeaders(); } catch (_) {}
  }

  const send = (eventName, payload) => {
    try {
      res.write(`event: ${eventName}\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (_) {}
  };

  // Initial snapshots
  try {
    const [stats, activities, files] = await Promise.all([
      computeStats().catch(() => null),
      getActivities().catch(() => []),
      Promise.resolve(listFiles(500)).catch(() => [])
    ]);
    if (stats) send('stats', stats);
    if (Array.isArray(activities)) {
      const ordered = activities.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 50);
      send('activities', ordered);
    }
    if (Array.isArray(files)) send('files', files);
    // Initial latest users snapshot (top 50 newest)
    try {
      let latestUsers = [];
      if (useMongo()) {
        const docs = await User.find({}).sort({ createdAt: -1 }).limit(50).lean();
        latestUsers = (docs || []).map(u => ({
          id: u._id.toString(),
          email: u.email,
          name: u.fullName || '',
          role: normalizeRole(u.role),
          createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
          lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString() : new Date(0).toISOString(),
          status: u.status || 'active',
          avatar: u.avatar
        }));
      } else {
        const list = await getUsers();
        latestUsers = (list || [])
          .slice()
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 50)
          .map(u => ({
            id: u.id,
            email: u.email,
            name: u.name || u.fullName || '',
            role: normalizeRole(u.role),
            createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
            lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString() : new Date(0).toISOString(),
            status: u.status || 'active',
            avatar: u.avatar
          }));
      }
      send('users', latestUsers);
    } catch (_) {}
  } catch (_) {}

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch (_) {}
  }, 20000);

  // Periodic updates
  const periodic = setInterval(async () => {
    try {
      const s = await computeStats();
      send('stats', s);
      send('files', listFiles(500));
      // Periodically refresh latest users as a fallback
      try {
        let latest = [];
        if (useMongo()) {
          const docs = await User.find({}).sort({ createdAt: -1 }).limit(50).lean();
          latest = (docs || []).map(u => ({
            id: u._id.toString(),
            email: u.email,
            name: u.fullName || '',
            role: normalizeRole(u.role),
            createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
            lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString() : new Date(0).toISOString(),
            status: u.status || 'active',
            avatar: u.avatar
          }));
        } else {
          const list = await getUsers();
          latest = (list || [])
            .slice()
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 50)
            .map(u => ({
              id: u.id,
              email: u.email,
              name: u.name || u.fullName || '',
              role: normalizeRole(u.role),
              createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
              lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString() : new Date(0).toISOString(),
              status: u.status || 'active',
              avatar: u.avatar
            }));
        }
        send('users', latest);
      } catch (_) {}
    } catch (_) {}
  }, 10000);

  // Live activities
  const onActivity = (activity) => {
    send('activity', activity);
  };
  realtime.on('activity', onActivity);

  // Live metrics -> recompute and send stats
  const onMetrics = async () => {
    try {
      const s = await computeStats();
      send('stats', s);
    } catch (_) {}
  };
  realtime.on('stats_metrics_updated', onMetrics);

  // Live files -> send updated list
  const onFilesUpdated = () => {
    try { send('files', listFiles(500)); } catch (_) {}
  };
  realtime.on('files_updated', onFilesUpdated);

  // Live users -> send latest list
  const onUsersUpdated = async () => {
    try {
      let latest = [];
      if (useMongo()) {
        const docs = await User.find({}).sort({ createdAt: -1 }).limit(50).lean();
        latest = (docs || []).map(u => ({
          id: u._id.toString(),
          email: u.email,
          name: u.fullName || '',
          role: normalizeRole(u.role),
          createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
          lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString() : new Date(0).toISOString(),
          status: u.status || 'active',
          avatar: u.avatar
        }));
      } else {
        const list = await getUsers();
        latest = (list || [])
          .slice()
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          .slice(0, 50)
          .map(u => ({
            id: u.id,
            email: u.email,
            name: u.name || u.fullName || '',
            role: normalizeRole(u.role),
            createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
            lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString() : new Date(0).toISOString(),
            status: u.status || 'active',
            avatar: u.avatar
          }));
      }
      send('users', latest);
    } catch (_) {}
  };
  realtime.on('users_updated', onUsersUpdated);

  req.on('close', () => {
    clearInterval(heartbeat);
    clearInterval(periodic);
    try { realtime.off ? realtime.off('activity', onActivity) : realtime.removeListener('activity', onActivity); } catch (_) {}
    try { realtime.off ? realtime.off('stats_metrics_updated', onMetrics) : realtime.removeListener('stats_metrics_updated', onMetrics); } catch (_) {}
    try { realtime.off ? realtime.off('files_updated', onFilesUpdated) : realtime.removeListener('files_updated', onFilesUpdated); } catch (_) {}
    try { realtime.off ? realtime.off('users_updated', onUsersUpdated) : realtime.removeListener('users_updated', onUsersUpdated); } catch (_) {}
    try { res.end(); } catch (_) {}
  });
});

// @route   GET /api/admin/files
// @desc    Get all files with details
// @access  Private (Admin)
router.get('/files', auth, requireAdmin, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const files = listFiles(limit);
    res.json(files);
  } catch (error) {
    console.error('Get admin files error:', error);
    res.status(500).json({ error: 'Server error getting admin files' });
  }
});

// @route   GET /api/admin/activity
// @desc    Get activity logs
// @access  Private (Admin)
router.get('/activity', auth, requireAdmin, async (req, res) => {
  try {
    const { limit = 20, since, severity } = req.query;
    let activities = await getActivities();

    if (since) {
      const sinceTs = new Date(since).getTime();
      if (!Number.isNaN(sinceTs)) {
        activities = activities.filter(a => new Date(a.timestamp).getTime() > sinceTs);
      }
    }
    if (severity) {
      activities = activities.filter(a => (a.severity || 'info') === severity);
    }

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const lim = parseInt(limit);
    const limited = Number.isNaN(lim) ? activities : activities.slice(0, lim);
    res.json(limited);
  } catch (error) {
    console.error('Get admin activity error:', error);
    res.status(500).json({ error: 'Server error getting admin activity' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/users', auth, requireAdmin, async (req, res) => {
  try {
    const { status, q, limit = 50 } = req.query;

    if (useMongo()) {
      const query = {};
      if (status) query.status = status;
      if (q) {
        const rx = new RegExp(q.toString(), 'i');
        query.$or = [{ fullName: rx }, { email: rx }];
      }
      const lim = parseInt(limit);
      const docs = await User.find(query).sort({ createdAt: -1 }).limit(Number.isNaN(lim) ? 0 : lim).lean();
      const mapped = (docs || []).map(u => ({
        id: u._id.toString(),
        email: u.email,
        name: u.fullName || '',
        role: normalizeRole(u.role),
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
        lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString() : new Date(0).toISOString(),
        status: u.status || 'active',
        avatar: u.avatar
      }));
      return res.json(mapped);
    } else {
      const list = await getUsers();
      let filtered = (list || []).map(u => ({
        id: u.id,
        email: u.email,
        name: u.name || u.fullName || '',
        role: normalizeRole(u.role),
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
        lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString() : new Date(0).toISOString(),
        status: u.status || 'active',
        avatar: u.avatar
      }));

      if (status) filtered = filtered.filter(u => (u.status || 'active') === status);
      if (q) {
        const ql = q.toString().toLowerCase();
        filtered = filtered.filter(u =>
          (u.name || '').toLowerCase().includes(ql) ||
          (u.email || '').toLowerCase().includes(ql)
        );
      }

      // Sort by newest first
      filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      const lim = parseInt(limit);
      const result = Number.isNaN(lim) ? filtered : filtered.slice(0, lim);
      res.json(result);
    }
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ error: 'Server error getting admin users' });
  }
});

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
    const { siteName, maxFileSize, allowedFormats, maintenanceMode, emailNotifications, autoDeleteDays } = req.body || {};
    const updated = await saveSettings({ siteName, maxFileSize, allowedFormats, maintenanceMode, emailNotifications, autoDeleteDays });
    res.json(updated);
  } catch (error) {
    console.error('Update admin settings error:', error);
    res.status(500).json({ error: 'Server error updating admin settings' });
  }
});

// @route   DELETE /api/admin/files/:id
// @desc    Delete a file
// @access  Private (Admin)
router.delete('/files/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const idx = parseInt(id) - 1;
    if (Number.isNaN(idx) || idx < 0) return res.status(400).json({ error: 'Invalid file id' });

    const files = listFiles(10000); // filtered to last 1 day
    const rec = files[idx];
    if (!rec) return res.status(404).json({ error: 'File not found' });

    const filePath = path.join(__dirname, '../uploads', rec.name);
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to delete file' });
    }

    try { realtime.emit('files_updated', { deleted: [rec.name] }); } catch (_) {}
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Server error deleting file' });
  }
});

module.exports = router;
