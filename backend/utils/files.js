const fs = require('fs');
const path = require('path');

function detectType(ext) {
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.bmp', '.tiff'].includes(ext)) return 'image';
  if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'].includes(ext)) return 'video';
  if (['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'].includes(ext)) return 'audio';
  if (ext === '.pdf') return 'pdf';
  if (['.doc', '.docx', '.txt'].includes(ext)) return 'document';
  return 'document';
}

function listFiles(limit) {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  const out = [];
  if (fs.existsSync(uploadsDir)) {
    const fileList = fs.readdirSync(uploadsDir);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    let idx = 0;
    fileList.forEach((file) => {
      const filePath = path.join(uploadsDir, file);
      try {
        const st = fs.statSync(filePath);
        const ageMs = now - new Date(st.mtime).getTime();
        if (ageMs > oneDayMs) {
          return; // skip files older than 1 day
        }
        const ext = path.extname(file).toLowerCase();
        const type = detectType(ext);

        const isProcessed = file.startsWith('converted-') || file.startsWith('compressed-');
        const status = isProcessed ? 'completed' : 'processing';

        const originalFormat = ext.replace('.', '');
        let convertedFormat = undefined;
        if (file.startsWith('converted-')) {
          convertedFormat = originalFormat;
        } else if (file.startsWith('compressed-')) {
          convertedFormat = originalFormat;
        }

        const record = {
          id: (idx + 1).toString(),
          name: file,
          type,
          size: st.size,
          status,
          uploadedBy: 'anonymous',
          uploadedAt: st.mtime.toISOString(),
          convertedAt: isProcessed ? st.mtime.toISOString() : null,
          originalFormat,
          convertedFormat,
        };
        out.push(record);
        idx++;
      } catch (_) {}
    });
  }
  return typeof limit === 'number' ? out.slice(0, limit) : out;
}

module.exports = { listFiles };
