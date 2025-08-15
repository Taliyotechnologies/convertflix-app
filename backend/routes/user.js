const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, (req, res) => {
  try {
    // In a real app, you'd fetch user from database using req.user.userId
    const user = {
      id: req.user.userId,
      email: req.user.email,
      fullName: 'Demo User',
      createdAt: new Date('2024-01-01'),
      lastLogin: new Date(),
      totalFiles: 0,
      totalStorage: 0
    };

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error getting profile' });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, (req, res) => {
  try {
    const { fullName } = req.body;

    if (!fullName || fullName.trim().length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters long' });
    }

    // In a real app, you'd update user in database
    const updatedUser = {
      id: req.user.userId,
      email: req.user.email,
      fullName: fullName.trim(),
      updatedAt: new Date()
    };

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// @route   GET /api/user/files
// @desc    Get user's file history
// @access  Private
router.get('/files', auth, (req, res) => {
  try {
    // In a real app, you'd fetch files from database
    const files = [
      {
        id: '1',
        originalName: 'sample-image.jpg',
        processedName: 'compressed-sample-image.jpg',
        type: 'compression',
        fileType: 'image',
        originalSize: 2048576,
        processedSize: 1024288,
        compressionRatio: 50.0,
        status: 'completed',
        createdAt: new Date('2024-01-15'),
        downloadUrl: '/uploads/compressed-sample-image.jpg'
      },
      {
        id: '2',
        originalName: 'document.pdf',
        processedName: 'compressed-document.pdf',
        type: 'compression',
        fileType: 'pdf',
        originalSize: 5120000,
        processedSize: 4096000,
        compressionRatio: 20.0,
        status: 'completed',
        createdAt: new Date('2024-01-14'),
        downloadUrl: '/uploads/compressed-document.pdf'
      }
    ];

    res.json({
      success: true,
      files,
      total: files.length
    });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Server error getting files' });
  }
});

// @route   DELETE /api/user/files/:id
// @desc    Delete a file from user's history
// @access  Private
router.delete('/files/:id', auth, (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    // In a real app, you'd delete file from database and storage
    // For now, just return success
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Server error deleting file' });
  }
});

// @route   GET /api/user/stats
// @desc    Get user's usage statistics
// @access  Private
router.get('/stats', auth, (req, res) => {
  try {
    // In a real app, you'd calculate stats from database
    const stats = {
      totalFiles: 2,
      totalStorage: 7168000, // 7.16 MB
      compressionSavings: 2048576, // 2.05 MB
      averageCompressionRatio: 35.0,
      filesThisMonth: 2,
      storageThisMonth: 7168000,
      topFileTypes: ['image', 'pdf'],
      lastActivity: new Date('2024-01-15')
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error getting stats' });
  }
});

module.exports = router;

