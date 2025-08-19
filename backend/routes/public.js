const express = require('express');
const router = express.Router();
const { getSettings } = require('../utils/dataStore');

// @route   GET /api/public/status
// @desc    Public status endpoint exposing maintenance mode (no auth)
// @access  Public
router.get('/status', async (req, res) => {
  try {
    const settings = await getSettings().catch(() => ({}));
    const maintenanceMode = !!(settings && settings.maintenanceMode);
    const siteName = (settings && settings.siteName) || 'ConvertFlix';

    // Prevent caching so toggles reflect immediately
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.json({ maintenanceMode, siteName });
  } catch (error) {
    console.error('Public status error:', error);
    res.status(500).json({ error: 'Server error getting public status' });
  }
});

module.exports = router;
