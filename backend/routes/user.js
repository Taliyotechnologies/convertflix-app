const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const User = require('../models/User');
const FileRecord = require('../models/FileRecord');
const { listFiles } = require('../utils/files');
const { getUsers, saveUsers, getMetrics } = require('../utils/dataStore');
const useMongo = () => {
  try { return mongoose.connection && mongoose.connection.readyState === 1; } catch (_) { return false; }
};
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

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    if (useMongo()) {
      let doc = await User.findById(req.user.userId).lean();
      if (!doc && req.user?.email) {
        doc = await User.findOne({ email: (req.user.email || '').toLowerCase() }).lean();
      }
      if (!doc) return res.status(404).json({ error: 'User not found' });
      const user = {
        id: String(doc._id || doc.id),
        email: doc.email,
        fullName: doc.fullName || '',
        role: normalizeRole(doc.role),
        createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
        lastLogin: doc.lastLogin ? new Date(doc.lastLogin).toISOString() : undefined,
        avatar: doc.avatar
      };
      return res.json({ success: true, user });
    }
    // JSON fallback
    const list = await getUsers();
    let me = (list || []).find(u => u.id === req.user.userId) || (list || []).find(u => (u.email || '').toLowerCase() === (req.user.email || '').toLowerCase());
    if (!me) {
      me = {
        id: req.user.userId,
        email: req.user.email,
        fullName: '',
        role: 'user',
        createdAt: new Date().toISOString(),
        lastLogin: null
      };
    }
    const user = {
      id: me.id,
      email: me.email,
      fullName: me.fullName || me.name || '',
      role: normalizeRole(me.role),
      createdAt: me.createdAt,
      lastLogin: me.lastLogin || undefined,
      avatar: me.avatar
    };
    return res.json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error getting profile' });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { fullName } = req.body || {};
    if (!fullName || String(fullName).trim().length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters long' });
    }

    if (useMongo()) {
      let doc = await User.findById(req.user.userId);
      if (!doc && req.user?.email) {
        doc = await User.findOne({ email: (req.user.email || '').toLowerCase() });
      }
      if (!doc) return res.status(404).json({ error: 'User not found' });
      doc.fullName = String(fullName).trim();
      await doc.save();
      const user = {
        id: doc._id.toString(),
        email: doc.email,
        fullName: doc.fullName,
        role: normalizeRole(doc.role),
        avatar: doc.avatar,
        updatedAt: new Date().toISOString()
      };
      return res.json({ success: true, message: 'Profile updated successfully', user });
    }

    // JSON fallback
    const list = await getUsers();
    const idx = (list || []).findIndex(u => u.id === req.user.userId || (u.email || '').toLowerCase() === (req.user.email || '').toLowerCase());
    let me;
    if (idx >= 0) {
      me = { ...list[idx], fullName: String(fullName).trim(), name: String(fullName).trim(), updatedAt: new Date().toISOString() };
      const next = [...list];
      next[idx] = me;
      await saveUsers(next);
    } else {
      me = {
        id: req.user.userId,
        email: req.user.email,
        fullName: String(fullName).trim(),
        name: String(fullName).trim(),
        role: 'user',
        createdAt: new Date().toISOString(),
        lastLogin: null,
        status: 'active',
        updatedAt: new Date().toISOString()
      };
      await saveUsers([...(list || []), me]);
    }
    const user = {
      id: me.id,
      email: me.email,
      fullName: me.fullName,
      role: normalizeRole(me.role),
      avatar: me.avatar,
      updatedAt: me.updatedAt
    };
    return res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// @route   GET /api/user/files
// @desc    Get user's file history
// @access  Private
router.get('/files', auth, async (req, res) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const userId = req.user.userId;
    const email = String(req.user.email || '');

    if (useMongo()) {
      const docs = await FileRecord.find({ $or: [{ uploadedBy: userId }, { uploadedBy: email }] })
        .sort({ uploadedAt: -1 })
        .limit(limit)
        .lean();
      const files = (docs || []).map(d => ({
        id: String(d._id || d.id),
        name: d.name,
        type: d.type,
        size: d.size,
        status: d.status,
        uploadedBy: d.uploadedBy || 'anonymous',
        uploadedAt: d.uploadedAt ? new Date(d.uploadedAt).toISOString() : undefined,
        convertedAt: d.convertedAt ? new Date(d.convertedAt).toISOString() : undefined,
        originalFormat: d.originalFormat,
        convertedFormat: d.convertedFormat,
        downloadUrl: `/uploads/${d.name}`,
        compressionRatio: typeof d.compressionRatio === 'number' ? d.compressionRatio : undefined,
      }));
      return res.json({ success: true, files, total: files.length });
    }

    // Fallback: list recent files from uploads dir (not user-specific)
    const fsList = listFiles(limit, 30).map(r => ({
      ...r,
      uploadedAt: new Date(r.uploadedAt).toISOString(),
      convertedAt: r.convertedAt ? new Date(r.convertedAt).toISOString() : undefined,
      downloadUrl: `/uploads/${r.name}`,
    }));
    return res.json({ success: true, files: fsList, total: fsList.length });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Server error getting files' });
  }
});

// @route   DELETE /api/user/files/:id
// @desc    Delete a file from user's history
// @access  Private
router.delete('/files/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'File ID is required' });

    if (useMongo()) {
      const doc = await FileRecord.findById(id).lean();
      if (!doc) return res.status(404).json({ error: 'File not found' });
      const ownerOk = (doc.uploadedBy === req.user.userId) || (doc.uploadedBy === req.user.email);
      if (!ownerOk) return res.status(403).json({ error: 'Not allowed to delete this file' });

      try { await FileRecord.deleteOne({ _id: id }); } catch (_) {}

      // Best-effort physical file deletion
      try {
        if (doc.name) {
          const uploadsDir = path.join(__dirname, '..', 'uploads');
          const p = path.join(uploadsDir, doc.name);
          fs.unlink(p, (e) => {
            if (e && !['ENOENT', 'EPERM', 'EBUSY'].includes(e.code)) {
              console.warn('File unlink error:', e && e.message ? e.message : e);
            }
          });
        }
      } catch (_) {}

      return res.json({ success: true, message: 'File deleted successfully' });
    }

    // Fallback: best-effort delete by name if provided
    const maybeName = id;
    if (maybeName && maybeName.includes('.')) {
      try {
        const uploadsDir = path.join(__dirname, '..', 'uploads');
        const p = path.join(uploadsDir, maybeName);
        fs.unlink(p, () => {});
      } catch (_) {}
    }
    return res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Server error deleting file' });
  }
});

// @route   GET /api/user/stats
// @desc    Get user's usage statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const email = String(req.user.email || '');

    if (useMongo()) {
      const docs = await FileRecord.find({ $or: [{ uploadedBy: userId }, { uploadedBy: email }] })
        .select('size compressionRatio type uploadedAt')
        .lean();
      let totalFiles = 0;
      let totalStorage = 0;
      let ratioSum = 0;
      let ratioCount = 0;
      let savings = 0;
      for (const d of (docs || [])) {
        totalFiles += 1;
        const size = Number(d.size) || 0;
        totalStorage += size;
        const r = typeof d.compressionRatio === 'number' ? Number(d.compressionRatio) : NaN;
        if (r > 0 && r <= 1) {
          ratioSum += r;
          ratioCount += 1;
          const original = size / r;
          const saved = original - size;
          if (isFinite(saved) && saved > 0) savings += saved;
        }
      }
      const stats = {
        totalFiles,
        totalStorage,
        compressionSavings: Math.round(savings),
        averageCompressionRatio: ratioCount > 0 ? (ratioSum / ratioCount) : 0,
      };
      return res.json({ success: true, stats });
    }

    // JSON fallback: global counters only
    const m = await getMetrics();
    const stats = {
      totalFiles: Number(m.lifetimeFiles || 0),
      totalStorage: Number(m.lifetimeBytes || 0),
      compressionSavings: 0,
      averageCompressionRatio: 0,
    };
    return res.json({ success: true, stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error getting stats' });
  }
});

module.exports = router;

