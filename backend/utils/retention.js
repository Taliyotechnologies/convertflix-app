const fs = require('fs');
const path = require('path');
const realtime = require('./realtime');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

function msFromDays(days) {
  return days * 24 * 60 * 60 * 1000;
}

async function cleanupOldUploads(days = 1) {
  const now = Date.now();
  const threshold = now - msFromDays(days);
  const deleted = [];

  try {
    if (!fs.existsSync(UPLOADS_DIR)) return { count: 0, deleted };
    const files = fs.readdirSync(UPLOADS_DIR);
    for (const file of files) {
      const p = path.join(UPLOADS_DIR, file);
      let st;
      try {
        st = fs.statSync(p);
      } catch (_) {
        continue;
      }
      const mtime = new Date(st.mtime).getTime();
      if (mtime < threshold) {
        try {
          fs.unlinkSync(p);
          deleted.push(file);
        } catch (_) {}
      }
    }
  } catch (err) {
    console.error('Retention cleanup error:', err);
  }

  if (deleted.length > 0) {
    try { realtime.emit('files_updated', { deleted }); } catch (_) {}
  }
  return { count: deleted.length, deleted };
}

module.exports = { cleanupOldUploads };
