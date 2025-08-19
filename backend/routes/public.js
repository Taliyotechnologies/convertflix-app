const express = require('express');
const router = express.Router();
const { getSettings, addActivity } = require('../utils/dataStore');

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

// @route   POST /api/public/visit
// @desc    Track a website visit (emits admin activity when notifications enabled)
// @access  Public
router.post('/visit', async (req, res) => {
  try {
    const { path: pathVisited, referrer, userAgent, source } = req.body || {};
    const ua = userAgent || req.headers['user-agent'] || '';
    const ip = (req.headers['x-forwarded-for'] || '')
      .toString()
      .split(',')[0]
      .trim() || req.socket?.remoteAddress || req.ip || '';

    const p = pathVisited || '/';
    const msg = `Site visit ${p}${referrer ? ` from ${referrer}` : ''}`;

    // Log activity; emission to SSE is controlled by adminNotifications setting
    await addActivity({
      type: 'site_visit',
      message: msg,
      severity: 'info',
      path: p,
      referrer: referrer || '',
      ua,
      ip,
      source: source || 'frontend'
    });

    // Do not return sensitive data
    res.json({ success: true });
  } catch (error) {
    console.error('Track visit error:', error);
    res.status(500).json({ error: 'Failed to track visit' });
  }
});

module.exports = router;
