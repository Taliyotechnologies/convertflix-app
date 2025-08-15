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

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private (Admin)
router.get('/stats', auth, async (req, res) => {
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
router.get('/stream', auth, async (req, res) => {
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
    } catch (_) {}
  }, 10000);

  // Live activities
  const onActivity = (activity) => {
    send('activity', activity);
  };
  realtime.on('activity', onActivity);

  req.on('close', () => {
    clearInterval(heartbeat);
    clearInterval(periodic);
    try { realtime.off ? realtime.off('activity', onActivity) : realtime.removeListener('activity', onActivity); } catch (_) {}
    try { res.end(); } catch (_) {}
  });
});

// @route   GET /api/admin/files
// @desc    Get all files with details
// @access  Private (Admin)
router.get('/files', auth, async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    const out = [];
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;

    if (fs.existsSync(uploadsDir)) {
      const fileList = fs.readdirSync(uploadsDir);
      fileList.forEach((file, index) => {
        const filePath = path.join(uploadsDir, file);
        try {
          const st = fs.statSync(filePath);
          const ext = path.extname(file).toLowerCase();
          let type = 'other';
          if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.tiff'].includes(ext)) type = 'image';
          else if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'].includes(ext)) type = 'video';
          else if (['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'].includes(ext)) type = 'audio';
          else if (ext === '.pdf') type = 'pdf';
          else if (['.doc', '.docx', '.txt'].includes(ext)) type = 'document';

          const isProcessed = file.startsWith('converted-') || file.startsWith('compressed-');
          const status = isProcessed ? 'completed' : 'uploaded';

          const originalFormat = ext.replace('.', '');
          let convertedFormat = undefined;
          if (file.startsWith('converted-')) {
            convertedFormat = originalFormat;
          } else if (file.startsWith('compressed-')) {
            convertedFormat = originalFormat;
          }

          const fileRecord = {
            id: (index + 1).toString(),
            name: file,
            type,
            size: st.size,
            status,
            uploadedBy: 'anonymous',
            uploadedAt: st.mtime.toISOString(),
            convertedAt: isProcessed ? st.mtime.toISOString() : null,
            originalFormat,
            convertedFormat
          };
          out.push(fileRecord);
        } catch (_) {}
      });
    }

    const result = typeof limit === 'number' ? out.slice(0, limit) : out;
    res.json(result);
  } catch (error) {
    console.error('Get admin files error:', error);
    res.status(500).json({ error: 'Server error getting admin files' });
  }
});

// @route   GET /api/admin/activity
// @desc    Get activity logs
// @access  Private (Admin)
router.get('/activity', auth, async (req, res) => {
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
router.get('/users', auth, async (req, res) => {
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
      const docs = await User.find(query).limit(Number.isNaN(lim) ? 0 : lim).lean();
      const mapped = (docs || []).map(u => ({
        id: u._id.toString(),
        email: u.email,
        name: u.fullName || '',
        role: u.role || 'user',
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
        role: u.role || 'user',
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
router.get('/settings', auth, async (req, res) => {
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
router.put('/settings', auth, async (req, res) => {
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
router.delete('/files/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const uploadsDir = path.join(__dirname, '../uploads');
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const fileToDelete = files[parseInt(id) - 1]; // Convert ID to array index
      
      if (fileToDelete) {
        const filePath = path.join(uploadsDir, fileToDelete);
        fs.unlinkSync(filePath);
        res.json({ success: true, message: 'File deleted successfully' });
      } else {
        res.status(404).json({ error: 'File not found' });
      }
    } else {
      res.status(404).json({ error: 'Uploads directory not found' });
    }
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Server error deleting file' });
  }
});

module.exports = router;
