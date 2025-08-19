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
  autoDeleteDays: 7
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

// Save activities (used by retention pruning)
async function saveActivities(list) {
  await writeJSON('activities', Array.isArray(list) ? list : []);
  return Array.isArray(list) ? list : [];
}

// Metrics (persistent dashboard counters)
const defaultMetrics = {
  lifetimeFiles: 0,         // total files processed historically
  lifetimeBytes: 0,         // total input bytes processed historically
  lifetimeConverted: 0,     // total files converted
  lifetimeCompressed: 0,    // total files compressed
  byDay: {}                 // { 'YYYY-MM-DD': { files, bytes, converted, compressed } }
};

async function getMetrics() {
  const m = await readJSON('metrics', defaultMetrics);
  // Ensure required fields and shapes
  return {
    ...defaultMetrics,
    ...(m || {}),
    byDay: { ...(m && m.byDay ? m.byDay : {}) }
  };
}

async function saveMetrics(metrics) {
  const toSave = {
    ...defaultMetrics,
    ...(metrics || {}),
    byDay: { ...((metrics || {}).byDay || {}) }
  };
  await writeJSON('metrics', toSave);
  return toSave;
}

function todayKey(date = new Date()) {
  return date.toISOString().split('T')[0];
}

async function recordFileProcessed({ size = 0, kind = 'processed', when = new Date() } = {}) {
  const m = await getMetrics();
  m.lifetimeFiles = (m.lifetimeFiles || 0) + 1;
  m.lifetimeBytes = (m.lifetimeBytes || 0) + (Number(size) || 0);
  if (kind === 'converted') m.lifetimeConverted = (m.lifetimeConverted || 0) + 1;
  if (kind === 'compressed') m.lifetimeCompressed = (m.lifetimeCompressed || 0) + 1;

  const key = todayKey(when);
  const day = m.byDay[key] || { files: 0, bytes: 0, converted: 0, compressed: 0 };
  day.files += 1;
  day.bytes += (Number(size) || 0);
  if (kind === 'converted') day.converted += 1;
  if (kind === 'compressed') day.compressed += 1;
  m.byDay[key] = day;

  // Optional: prune very old days to keep file small (keep last 90 days)
  try {
    // Keep only the last N days of daily metrics (N = settings.autoDeleteDays, default 7)
    const settings = await getSettings().catch(() => ({}));
    const keepDays = Number(settings && settings.autoDeleteDays) || 7;
    const now = new Date();
    const cutoff = new Date(now.getTime() - keepDays * 24 * 60 * 60 * 1000);
    for (const k of Object.keys(m.byDay)) {
      const d = new Date(k);
      if (d < cutoff) delete m.byDay[k];
    }
  } catch (_) {}

  await saveMetrics(m);
  try { realtime.emit('stats_metrics_updated', m); } catch (_) {}
  // Also signal that files listing likely changed (new output file produced)
  try { realtime.emit('files_updated', { reason: 'file_processed' }); } catch (_) {}
  return m;
}

// Prune helpers for retention policy
async function pruneActivities(days = 14) {
  try {
    const now = Date.now();
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    const list = await getActivities();
    const filtered = (list || []).filter(a => {
      const ts = a && a.timestamp ? new Date(a.timestamp).getTime() : 0;
      return ts >= cutoff;
    });
    if (filtered.length !== (list || []).length) {
      await saveActivities(filtered);
    }
    return { before: (list || []).length, after: filtered.length };
  } catch (e) {
    return { before: 0, after: 0 };
  }
}

async function pruneMetricsByDay(days = 14) {
  try {
    const m = await getMetrics();
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    let changed = false;
    for (const k of Object.keys(m.byDay || {})) {
      const d = new Date(k);
      if (d < cutoff) {
        delete m.byDay[k];
        changed = true;
      }
    }
    if (changed) await saveMetrics(m);
    return { changed };
  } catch (e) {
    return { changed: false };
  }
}

module.exports = {
  getUsers,
  saveUsers,
  getSettings,
  saveSettings,
  getActivities,
  addActivity,
  saveActivities,
  defaultSettings,
  // metrics
  getMetrics,
  saveMetrics,
  recordFileProcessed,
  defaultMetrics,
  pruneActivities,
  pruneMetricsByDay
};
