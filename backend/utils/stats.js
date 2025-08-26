const fs = require('fs');
const path = require('path');
const { getUsers, getMetrics, getActivities, getVisitors, getSettings } = require('./dataStore');
const mongoose = require('mongoose');
const User = require('../models/User');
const useMongo = () => {
  try { return mongoose.connection && mongoose.connection.readyState === 1; } catch (_) { return false; }
};

async function computeStats() {
  // Initialize analytics objects
  const deviceTypeVisits = {};
  const countryVisits = {};
  const deviceTypeDevices = {};
  const countryDevices = {};
  
  // Persistent metrics for lifetime stats
  const metrics = await getMetrics();
  const lifetimeFiles = Number(metrics.lifetimeFiles || 0);
  const lifetimeBytes = Number(metrics.lifetimeBytes || 0);
  const lifetimeConverted = Number(metrics.lifetimeConverted || 0);
  const lifetimeCompressed = Number(metrics.lifetimeCompressed || 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const today = metrics.byDay && metrics.byDay[todayStr] ? metrics.byDay[todayStr] : { files: 0 };

  const totalFiles = lifetimeFiles;
  const totalStorage = lifetimeBytes;
  const filesProcessedToday = Number(today.files || 0);
  const numerator = lifetimeConverted + lifetimeCompressed;
  const conversionRate = lifetimeFiles > 0 ? (numerator / lifetimeFiles) * 100 : 0;
  const averageFileSize = lifetimeFiles > 0 ? Math.round(lifetimeBytes / lifetimeFiles) : 0;

  const users = await getUsers();
  let totalUsers = 0;
  let activeUsers = 0;
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  if (useMongo()) {
    try {
      totalUsers = await User.countDocuments({});
      const since = new Date(now - sevenDaysMs);
      activeUsers = await User.countDocuments({ lastLogin: { $gte: since } });
    } catch (_) {
      totalUsers = Array.isArray(users) ? users.length : 0;
      activeUsers = (users || []).filter(u => {
        const ts = u.lastLogin ? new Date(u.lastLogin).getTime() : 0;
        return ts && now - ts <= sevenDaysMs;
      }).length;
    }
  } else {
    totalUsers = Array.isArray(users) ? users.length : 0;
    activeUsers = (users || []).filter(u => {
      const ts = u.lastLogin ? new Date(u.lastLogin).getTime() : 0;
      return ts && now - ts <= sevenDaysMs;
    }).length;
  }

  // Helper to classify device from UA when missing
  function classifyDevice(ua = '') {
    try {
      const s = String(ua || '').toLowerCase();
      const isTablet = /tablet|ipad|playbook|silk|kindle|sm\-t|nexus 7|nexus 10/.test(s);
      const isMobile = /mobi|iphone|ipod|android(?!.*tablet)|phone/.test(s);
      if (isTablet) return 'tablet';
      if (isMobile) return 'phone';
      return 'laptop';
    } catch (_) { return 'laptop'; }
  }

  // Unique visits computed from activities (unique ip+ua across retained history)
  let totalVisits = 0;
  try {
    const activities = await getActivities();
    // Determine retention window (in days) from settings; default to 7
    let retentionDays = 7;
    try {
      const settings = await getSettings().catch(() => ({}));
      retentionDays = Number(settings && settings.autoDeleteDays) || 7;
    } catch (_) {}
    const cutoffMs = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const uniq = new Set();
    for (const a of (activities || [])) {
      if (!a || a.type !== 'site_visit') continue;
      // Respect retention window regardless of prune schedule
      const ts = a && a.timestamp ? new Date(a.timestamp).getTime() : 0;
      if (!ts || ts < cutoffMs) continue;
      const key = `${a.ip || ''}|${a.ua || ''}`;
      uniq.add(key);
      const dt = (a.deviceType || '').toString().trim() || classifyDevice(a.ua || '');
      deviceTypeVisits[dt] = (deviceTypeVisits[dt] || 0) + 1;
      const cc = (a.country || '').toString().trim().toUpperCase();
      if (cc) countryVisits[cc] = (countryVisits[cc] || 0) + 1;
    }
    totalVisits = uniq.size;
  } catch (_) {
    totalVisits = 0;
  }

  // Device and country breakdown from unique devices (visitors store)
  let uniqueDevices = 0;
  let newDevicesToday = 0;
  try {
    const visitors = await getVisitors();
    const ids = Object.keys(visitors || {});
    uniqueDevices = ids.length;
    const todayStr = new Date().toISOString().slice(0, 10);
    for (const id of ids) {
      const v = visitors[id] || {};
      const dt = (v.lastDeviceType || '').toString().trim() || classifyDevice(v.ua || '');
      deviceTypeDevices[dt] = (deviceTypeDevices[dt] || 0) + 1;
      const cc = (v.country || '').toString().trim().toUpperCase();
      if (cc) countryDevices[cc] = (countryDevices[cc] || 0) + 1;
      try {
        if ((v.firstSeen || '').slice(0, 10) === todayStr) newDevicesToday++;
      } catch (_) {}
    }
  } catch (_) {}

  // Current process memory snapshot (MB)
  const toMB = (v) => Math.round((v || 0) / (1024 * 1024));
  let mem = { rssMB: 0, heapUsedMB: 0, heapTotalMB: 0, extMB: 0, abMB: 0 };
  try {
    const mu = typeof process !== 'undefined' && typeof process.memoryUsage === 'function' ? process.memoryUsage() : {};
    mem = {
      rssMB: toMB(mu.rss),
      heapUsedMB: toMB(mu.heapUsed),
      heapTotalMB: toMB(mu.heapTotal),
      extMB: toMB(mu.external),
      abMB: toMB(mu.arrayBuffers)
    };
  } catch (_) {}

  return {
    totalUsers,
    totalFiles,
    totalStorage,
    filesProcessedToday,
    conversionRate: Math.round(conversionRate * 100) / 100,
    averageFileSize,
    activeUsers,
    totalVisits,
    // visit analytics (activities)
    deviceTypeVisits,
    countryVisits,
    // device analytics (unique devices)
    uniqueDevices,
    deviceTypeDevices,
    countryDevices,
    newDevicesToday,
    mem,
  };
}

module.exports = { computeStats };
