const express = require('express');
const router = express.Router();
const { getSettings, addActivity, getVisitors, saveVisitors } = require('../utils/dataStore');
let geoip; try { geoip = require('geoip-lite'); } catch (_) { geoip = null; }

function classifyDevice(ua = '') {
  try {
    const s = String(ua || '').toLowerCase();
    const isTablet = /tablet|ipad|playbook|silk|kindle|sm\-t|nexus 7|nexus 10/.test(s);
    const isMobile = /mobi|iphone|ipod|android(?!.*tablet)|phone/.test(s);
    if (isTablet) return 'tablet';
    if (isMobile) return 'phone';
    return 'laptop'; // treat desktop/laptop together
  } catch (_) {
    return 'laptop';
  }
}

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
    const { path: pathVisited, referrer, userAgent, source, deviceId: deviceIdRaw, deviceType: deviceTypeHint } = req.body || {};
    const ua = userAgent || req.headers['user-agent'] || '';
    const ip = (req.headers['x-forwarded-for'] || '')
      .toString()
      .split(',')[0]
      .trim() || req.socket?.remoteAddress || req.ip || '';
    const deviceType = deviceTypeHint || classifyDevice(ua);
    let deviceId = '';
    try {
      deviceId = String(deviceIdRaw || '').slice(0, 128);
    } catch (_) { deviceId = ''; }

    let country = '';
    try {
      if (geoip && ip) {
        const look = geoip.lookup(ip);
        if (look && look.country) country = look.country;
      }
    } catch (_) { country = ''; }

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
      source: source || 'frontend',
      deviceType,
      country
    });

    // Track deviceId uniqueness and emit a new-device activity on first sight
    if (deviceId) {
      try {
        const visitors = await getVisitors();
        const nowIso = new Date().toISOString();
        const entry = visitors[deviceId];
        if (!entry) {
          visitors[deviceId] = {
            firstSeen: nowIso,
            lastSeen: nowIso,
            visits: 1,
            ua,
            country: country || '',
            lastIp: ip || '',
            lastDeviceType: deviceType || ''
          };
          await saveVisitors(visitors);
          await addActivity({
            type: 'new_device',
            message: `New device visit (${deviceType || 'unknown'})${country ? ` from ${country}` : ''}`,
            severity: 'info',
            ua,
            ip,
            path: p,
            country: country || '',
            deviceType
          });
        } else {
          visitors[deviceId] = {
            ...entry,
            lastSeen: nowIso,
            visits: (entry.visits || 0) + 1,
            ua,
            country: country || entry.country || '',
            lastIp: ip || entry.lastIp || '',
            lastDeviceType: deviceType || entry.lastDeviceType || ''
          };
          await saveVisitors(visitors);
        }
      } catch (e) {
        // non-fatal
      }
    }

    // Do not return sensitive data
    res.json({ success: true });
  } catch (error) {
    console.error('Track visit error:', error);
    res.status(500).json({ error: 'Failed to track visit' });
  }
});

module.exports = router;
