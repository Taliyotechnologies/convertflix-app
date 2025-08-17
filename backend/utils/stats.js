const fs = require('fs');
const path = require('path');
const { getUsers, getMetrics } = require('./dataStore');
const mongoose = require('mongoose');
const User = require('../models/User');
const useMongo = () => {
  try { return mongoose.connection && mongoose.connection.readyState === 1; } catch (_) { return false; }
};

async function computeStats() {
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
  const revenue = 0;

  return {
    totalUsers,
    totalFiles,
    totalStorage,
    filesProcessedToday,
    conversionRate: Math.round(conversionRate * 100) / 100,
    averageFileSize,
    activeUsers,
    revenue,
  };
}

module.exports = { computeStats };
