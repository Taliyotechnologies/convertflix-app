const fs = require('fs');
const path = require('path');
const { getUsers } = require('./dataStore');
const mongoose = require('mongoose');
const User = require('../models/User');
const useMongo = () => {
  try { return mongoose.connection && mongoose.connection.readyState === 1; } catch (_) { return false; }
};

async function computeStats() {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  let totalFiles = 0;
  let totalStorage = 0;
  let filesProcessedToday = 0;
  let conversionRate = 0;
  let averageFileSize = 0;

  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    totalFiles = files.length;

    let totalSize = 0;
    let convertedFiles = 0;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    files.forEach(file => {
      const filePath = path.join(uploadsDir, file);
      try {
        const st = fs.statSync(filePath);
        totalSize += st.size;
        if (file.startsWith('converted-') || file.startsWith('compressed-')) {
          convertedFiles++;
        }
        const fileDate = new Date(st.mtime).toISOString().split('T')[0];
        if (fileDate === todayStr) filesProcessedToday++;
      } catch (_) {}
    });

    totalStorage = totalSize;
    conversionRate = totalFiles > 0 ? (convertedFiles / totalFiles) * 100 : 0;
    averageFileSize = totalFiles > 0 ? Math.round(totalSize / totalFiles) : 0;
  }

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
