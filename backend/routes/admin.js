const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getUsers, getSettings, saveSettings, getContacts, updateContact } = require('../utils/dataStore');
const mongoose = require('mongoose');
const User = require('../models/User');
const { computeStats } = require('../utils/stats');
const FileRecord = require('../models/FileRecord');
const { listFiles } = require('../utils/files');
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
// @desc    List files (Mongo-backed if available). Default range: last 30 days.
// @access  Private (Admin)
router.get('/files', auth, requireAdmin, async (req, res) => {
  try {
    const range = String(req.query.range || '30d').toLowerCase(); // '7d' | '30d' | 'all'
    const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 1000);
    const fromParam = req.query.from ? new Date(String(req.query.from)) : null;
    const toParam = req.query.to ? new Date(String(req.query.to)) : null;

    let from = fromParam && !isNaN(fromParam) ? fromParam : null;
    let to = toParam && !isNaN(toParam) ? toParam : null;
    if (!from && range !== 'all') {
      const days = range === '7d' ? 7 : 30;
      from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }
    if (!to) to = new Date();

    const q = {};
    if (from || to) {
      q.uploadedAt = {};
      if (from) q.uploadedAt.$gte = from;
      if (to) q.uploadedAt.$lte = to;
    }

    if (useMongo()) {
      const docs = await FileRecord.find(q).sort({ uploadedAt: -1 }).limit(limit).lean();
      const list = (docs || []).map(d => ({
        id: String(d._id || d.id),
        name: d.name,
        type: d.type,
        size: d.size,
        status: d.status,
        uploadedBy: d.uploadedBy || 'anonymous',
        uploadedAt: new Date(d.uploadedAt).toISOString(),
        convertedAt: d.convertedAt ? new Date(d.convertedAt).toISOString() : undefined,
        originalFormat: d.originalFormat,
        convertedFormat: d.convertedFormat,
        compressionRatio: typeof d.compressionRatio === 'number' ? d.compressionRatio : undefined,
      }));
      return res.json(list);
    }

    // Fallback: list recent files from uploads dir and filter by date
    const maxAgeDays = range === '7d' ? 7 : (range === 'all' ? 3650 : 30);
    let list = listFiles(limit * 5, maxAgeDays) // get more then filter precisely
      .map(r => ({
        ...r,
        uploadedAt: new Date(r.uploadedAt).toISOString(),
        convertedAt: r.convertedAt ? new Date(r.convertedAt).toISOString() : undefined,
      }));
    if (from || to) {
      const fromTs = from ? from.getTime() : 0;
      const toTs = to ? to.getTime() : Date.now();
      list = list.filter(r => {
        const t = new Date(r.uploadedAt).getTime();
        return t >= fromTs && t <= toTs;
      });
    }
    list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    return res.json(list.slice(0, limit));
  } catch (e) {
    console.error('Get files error:', e);
    res.status(500).json({ error: 'Server error getting files' });
  }
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

// @route   POST /api/admin/files/seed-mock
// @desc    Seed mock files into MongoDB (only if using Mongo). No-op if already seeded unless force=true
// @access  Private (Admin)
router.post('/files/seed-mock', auth, requireAdmin, async (req, res) => {
  try {
    if (!useMongo()) return res.status(400).json({ error: 'MongoDB not enabled' });
    const force = String(req.query.force || 'false').toLowerCase() === 'true';
    const count = Math.min(Math.max(Number(req.query.count || 8), 1), 100);
    const existing = await FileRecord.estimatedDocumentCount();
    if (existing > 0 && !force) return res.json({ inserted: 0, message: 'Already seeded' });

    const types = ['video', 'pdf', 'audio', 'image', 'document'];
    const names = [
      'Product Demo.mp4', 'Quarterly Report.pdf', 'Interview Audio.wav', 'Brand Photo.png',
      'Invoice Q2.pdf', 'Team Meeting.mp3', 'Launch Teaser.webm', 'Design Draft.docx'
    ];
    const out = [];
    for (let i = 0; i < count; i++) {
      const daysAgo = Math.floor(Math.random() * 30); // within 30 days
      const uploadedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 86400000);
      const type = types[Math.floor(Math.random() * types.length)];
      const name = names[i % names.length];
      const size = Math.floor(5_000_000 + Math.random() * 150_000_000);
      const statusPool = ['completed', 'processing', 'failed'];
      const status = statusPool[Math.floor(Math.random() * statusPool.length)];
      const originalFormat = (name.split('.').pop() || 'bin').toLowerCase();
      const completed = status === 'completed';
      const convertedAt = completed ? new Date(uploadedAt.getTime() + Math.random() * 3_600_000) : undefined;
      const compressionRatio = completed ? (0.35 + Math.random() * 0.35) : undefined; // 35%..70%
      out.push({
        name,
        type,
        size,
        status,
        uploadedBy: 'seed@convertflix.io',
        uploadedAt,
        convertedAt,
        originalFormat,
        convertedFormat: completed ? originalFormat : undefined,
        compressionRatio,
      });
    }
    const inserted = await FileRecord.insertMany(out, { ordered: false });
    res.json({ inserted: inserted.length });
  } catch (e) {
    console.error('Seed mock files error:', e);
    res.status(500).json({ error: 'Failed seeding mock files' });
  }
});

// @route   GET /api/admin/contacts
// @desc    List contact messages (most recent first)
// @access  Private (Admin)
router.get('/contacts', auth, requireAdmin, async (req, res) => {
  try {
    const list = await getContacts();
    // Ensure newest first
    const sorted = (list || []).slice().sort((a, b) => {
      try {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } catch (_) {
        return 0;
      }
    });
    res.json(sorted);
  } catch (e) {
    console.error('Get contacts error:', e);
    res.status(500).json({ error: 'Server error getting contacts' });
  }
});

// @route   PUT /api/admin/contacts/:id
// @desc    Update a contact message (status/read/resolved/subject/message)
// @access  Private (Admin)
router.put('/contacts/:id', auth, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const { status, read, resolved, subject, message } = req.body || {};
    const updated = await updateContact(id, { status, read, resolved, subject, message });
    res.json(updated);
  } catch (e) {
    const msg = (e && e.message) ? e.message : 'Failed to update contact';
    const code = msg.includes('not found') ? 404 : 500;
    res.status(code).json({ error: msg });
  }
});

module.exports = router;
