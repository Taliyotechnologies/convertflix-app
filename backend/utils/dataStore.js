const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const realtime = require('./realtime');

const DATA_DIR = path.join(__dirname, '..', 'data');

async function ensureDir() {
  try {
    await fsp.mkdir(DATA_DIR, { recursive: true });
  } catch (_) {}
}

function filePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

async function readJSON(name, fallback) {
  await ensureDir();
  const p = filePath(name);
  try {
    const raw = await fsp.readFile(p, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    if (e && (e.code === 'ENOENT' || e.code === 'EINVAL' || e.code === 'EISDIR')) {
      return fallback;
    }
    throw e;
  }
}

async function writeJSON(name, data) {
  await ensureDir();
  const p = filePath(name);
  const tmp = p + '.tmp';
  await fsp.writeFile(tmp, JSON.stringify(data, null, 2), 'utf-8');
  await fsp.rename(tmp, p);
}

// Users
async function getUsers() {
  const users = await readJSON('users', []);
  return Array.isArray(users) ? users : [];
}

async function saveUsers(users) {
  await writeJSON('users', users || []);
}

// Settings
const defaultSettings = {
  siteName: 'ConvertFlix',
  maxFileSize: 104857600,
  allowedFormats: ['jpg', 'png', 'gif', 'webp', 'mp4', 'avi', 'mov', 'mp3', 'wav', 'pdf', 'docx'],
  maintenanceMode: false,
  emailNotifications: true,
  autoDeleteDays: 30
};

async function getSettings() {
  const settings = await readJSON('settings', defaultSettings);
  return { ...defaultSettings, ...(settings || {}) };
}

async function saveSettings(settings) {
  const merged = { ...defaultSettings, ...(settings || {}) };
  await writeJSON('settings', merged);
  return merged;
}

// Activities
async function getActivities() {
  const list = await readJSON('activities', []);
  return Array.isArray(list) ? list : [];
}

async function addActivity(activity) {
  // Accept extra fields for internal use; ensure base fields exist
  const base = {
    id: activity.id || String(Date.now()) + '-' + Math.random().toString(36).slice(2, 8),
    type: activity.type || 'file_upload',
    message: activity.message || '',
    timestamp: activity.timestamp || new Date().toISOString(),
    userId: activity.userId || '',
    severity: activity.severity || 'info'
  };
  const extended = { ...activity, ...base };
  const list = await getActivities();
  list.push(extended);
  await writeJSON('activities', list);
  try { realtime.emit('activity', extended); } catch (_) {}
  return extended;
}

module.exports = {
  getUsers,
  saveUsers,
  getSettings,
  saveSettings,
  getActivities,
  addActivity,
  defaultSettings
};
