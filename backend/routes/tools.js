const express = require('express');
const router = express.Router();
const { uploadImage, uploadVideo, uploadAudio, uploadPDF, uploadAny } = require('../middleware/upload');
const { addActivity, recordFileProcessed } = require('../utils/dataStore');
// Concurrency limiter and memory-conscious global configs
const { createLimiter } = require('../utils/limiter');
const MAX_CONCURRENT_JOBS = Number(process.env.MAX_CONCURRENT_JOBS || process.env.TOOLS_MAX_CONCURRENCY || 2);
const runJob = createLimiter(MAX_CONCURRENT_JOBS);

// Sharp global cache/concurrency tuning (reduce memory)
let SHARP_OK = false;
try {
  const sharp = require('sharp');
  const sc = Number(process.env.SHARP_CONCURRENCY || 1);
  if (typeof sharp.cache === 'function') sharp.cache({ files: 0, items: 0, memory: 0 });
  if (typeof sharp.concurrency === 'function') sharp.concurrency(sc > 0 ? sc : 1);
  SHARP_OK = true;
} catch (_) {}

// FFmpeg thread cap (lower CPU/memory footprint)
const FFMPEG_THREADS = Number(process.env.FFMPEG_THREADS || 1);

// Units and caps
const MB = 1024 * 1024;
const MAX_IMAGE_PIXELS = Number(process.env.MAX_IMAGE_PIXELS || 24000000); // 24 MP default
const MAX_PDF_PDFLIB_MB = Number(process.env.MAX_PDF_PDFLIB_MB || 20); // skip pdf-lib above this size
// Speed preset for tools: 'turbo' | 'fast' | 'balanced' | 'quality' (default: 'fast')
const SPEED = (process.env.TOOLS_SPEED_PRESET || process.env.SPEED_PRESET || 'fast').toLowerCase();
// Allow per-request override via query/header; fallback to env default
const SPEED_DEFAULT = SPEED;
function getSpeed(req) {
  const q = (req && req.query && req.query.speed) ? String(req.query.speed).toLowerCase() : '';
  const h = (req && req.headers && (req.headers['x-tools-speed'] || req.headers['x-speed-preset']))
    ? String(req.headers['x-tools-speed'] || req.headers['x-speed-preset']).toLowerCase()
    : '';
  const s = q || h || SPEED_DEFAULT;
  if (s === 'ultrafast') return 'turbo';
  return ['turbo', 'fast', 'balanced', 'quality'].includes(s) ? s : SPEED_DEFAULT;
}

// Lightweight memory snapshot helper (values in MB)
function memSnapshot() {
  try {
    const m = process.memoryUsage();
    return {
      rssMB: Math.round((m.rss || 0) / MB),
      heapUsedMB: Math.round((m.heapUsed || 0) / MB),
      heapTotalMB: Math.round((m.heapTotal || 0) / MB),
      extMB: Math.round((m.external || 0) / MB),
      abMB: Math.round((m.arrayBuffers || 0) / MB)
    };
  } catch (_) {
    return { rssMB: 0, heapUsedMB: 0, heapTotalMB: 0, extMB: 0, abMB: 0 };
  }
}

// @route   POST /api/tools/compress-image
// @desc    Compress image file
// @access  Public
// Helpful 405 handlers for incorrect HTTP methods to tool endpoints
router.get('/compress-image', (req, res) => {
  res.status(405).json({
    error: 'Method Not Allowed',
    hint: 'Use POST multipart/form-data with field "file" to /api/tools/compress-image'
  });
});
router.get('/compress-video', (req, res) => {
  res.status(405).json({
    error: 'Method Not Allowed',
    hint: 'Use POST multipart/form-data with field "file" to /api/tools/compress-video'
  });
});
router.get('/compress-audio', (req, res) => {
  res.status(405).json({
    error: 'Method Not Allowed',
    hint: 'Use POST multipart/form-data with field "file" to /api/tools/compress-audio'
  });
});
router.get('/compress-pdf', (req, res) => {
  res.status(405).json({
    error: 'Method Not Allowed',
    hint: 'Use POST multipart/form-data with field "file" to /api/tools/compress-pdf'
  });
});
router.get('/convert-image', (req, res) => {
  res.status(405).json({
    error: 'Method Not Allowed',
    hint: 'Use POST multipart/form-data with field "file" and form field "targetFormat" to /api/tools/convert-image'
  });
});
router.get('/convert-video', (req, res) => {
  res.status(405).json({
    error: 'Method Not Allowed',
    hint: 'Use POST multipart/form-data with field "file" and form field "targetFormat" to /api/tools/convert-video'
  });
});
router.get('/convert-audio', (req, res) => {
  res.status(405).json({
    error: 'Method Not Allowed',
    hint: 'Use POST multipart/form-data with field "file" and form field "targetFormat" to /api/tools/convert-audio'
  });
});
router.get('/convert-pdf', (req, res) => {
  res.status(405).json({
    error: 'Method Not Allowed',
    hint: 'Use POST multipart/form-data with field "file" and form field "targetFormat" to /api/tools/convert-pdf'
  });
});

router.post('/compress-image', uploadImage, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    await runJob(async () => {
      // Process image compression using Sharp
      const sharp = require('sharp');
      const path = require('path');
      const fs = require('fs');
      const speed = getSpeed(req);
      const startedAt = Date.now();
      const memStart = memSnapshot();

      const inputPath = req.file.path;
      const outputDir = path.dirname(inputPath);
      const baseName = path.parse(req.file.filename).name;
      const ext = path.extname(req.file.originalname).toLowerCase();
      const outputOriginalFmt = path.join(outputDir, `compressed-${req.file.filename}`);
      const outputWebp = path.join(outputDir, `compressed-${baseName}.webp`);
      const outputAvif = path.join(outputDir, `compressed-${baseName}.avif`);

      // Compute resize options if pixel count too large
      let resizeOptions = null;
      try {
        const meta = await sharp(inputPath, { sequentialRead: true }).metadata();
        const pixels = (meta.width || 0) * (meta.height || 0);
        if (pixels && pixels > MAX_IMAGE_PIXELS) {
          const scale = Math.sqrt(MAX_IMAGE_PIXELS / pixels);
          const newWidth = Math.max(1, Math.floor((meta.width || 0) * scale));
          const newHeight = Math.max(1, Math.floor((meta.height || 0) * scale));
          resizeOptions = { width: newWidth, height: newHeight, fit: 'inside', withoutEnlargement: true };
        }
      } catch (_) {}

      const baseSharp = () => {
        const s = sharp(inputPath, { sequentialRead: true });
        return resizeOptions ? s.resize(resizeOptions) : s;
      };

      // Generate candidates. In FAST/BALANCED, do a single fast pass; in QUALITY, try multiple and pick smallest.
      const generateCandidates = async () => {
        const candidates = [];
        const originalSize = fs.statSync(inputPath).size;
        if (speed !== 'quality') {
          // FAST/BALANCED: single-pass, low-effort encodes
          try {
            const p1 = baseSharp();
            if (ext === '.jpg' || ext === '.jpeg') {
              await p1.jpeg({ quality: speed === 'turbo' ? 55 : 65, mozjpeg: false, progressive: false, chromaSubsampling: '4:2:0' }).toFile(outputOriginalFmt);
              candidates.push(outputOriginalFmt);
            } else if (ext === '.png') {
              await p1.png({ compressionLevel: speed === 'turbo' ? 1 : 3, palette: true }).toFile(outputOriginalFmt);
              candidates.push(outputOriginalFmt);
            } else if (ext === '.webp') {
              await p1.webp({ quality: speed === 'turbo' ? 68 : 70, effort: 0 }).toFile(outputOriginalFmt);
              candidates.push(outputOriginalFmt);
            } else if (ext === '.avif') {
              await p1.avif({ quality: speed === 'turbo' ? 35 : 40, effort: 1 }).toFile(outputOriginalFmt);
              candidates.push(outputOriginalFmt);
            } else {
              await p1.jpeg({ quality: 65, mozjpeg: false, progressive: false }).toFile(outputOriginalFmt);
              candidates.push(outputOriginalFmt);
            }
          } catch (_) {}
          // Also try a fast WebP candidate and pick it only if smaller than original
          try {
            await baseSharp().webp({ quality: speed === 'turbo' ? 70 : 72, effort: 0 }).toFile(outputWebp);
            candidates.push(outputWebp);
          } catch (_) {}
        } else {
          // QUALITY: try multiple candidates and pick the smallest (reduced encoding effort for speed)
          try {
            const p1 = baseSharp();
            if (ext === '.jpg' || ext === '.jpeg') {
              await p1.jpeg({ quality: 55, mozjpeg: false, progressive: false }).toFile(outputOriginalFmt);
            } else if (ext === '.png') {
              await p1.png({ compressionLevel: 7, palette: true }).toFile(outputOriginalFmt);
            } else if (ext === '.webp') {
              await p1.webp({ quality: 70 }).toFile(outputOriginalFmt);
            } else if (ext === '.avif') {
              await p1.avif({ quality: 35, effort: 2 }).toFile(outputOriginalFmt);
            } else {
              await p1.jpeg({ quality: 60, mozjpeg: false, progressive: false }).toFile(outputOriginalFmt);
            }
            candidates.push(outputOriginalFmt);
          } catch (_) {}
          try {
            await baseSharp().webp({ quality: 75 }).toFile(outputWebp);
            candidates.push(outputWebp);
          } catch (_) {}
          try {
            await baseSharp().avif({ quality: 35, effort: 2 }).toFile(outputAvif);
            candidates.push(outputAvif);
          } catch (_) {}
        }

        // Choose the smallest candidate that is actually smaller than the original
        let chosen = null;
        let chosenSize = Number.MAX_SAFE_INTEGER;
        for (const p of candidates) {
          if (!fs.existsSync(p)) continue;
          const s = fs.statSync(p).size;
          if (s < originalSize && s < chosenSize) {
            chosen = p; chosenSize = s;
          }
        }
        return { chosen, originalSize };
      };

      const { chosen, originalSize } = await generateCandidates();
      const finalPath = chosen || inputPath;

      // Get file sizes
      const compressedSize = fs.statSync(finalPath).size;
      const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

      // Clean up depending on whether a smaller file was produced
      if (finalPath !== inputPath) {
        try {
          fs.unlinkSync(inputPath);
        } catch (err) {
          if (err && (err.code === 'EBUSY' || err.code === 'EPERM')) {
            setTimeout(() => {
              try { fs.unlinkSync(inputPath); } catch (_) {}
            }, 500);
          }
        }
      }
      // Remove other candidate files except the final one
      [outputOriginalFmt, outputWebp, outputAvif].forEach(p => {
        if (p !== finalPath) {
          try { fs.unlinkSync(p); } catch (_) {}
        }
      });

      const memEnd = memSnapshot();
      const elapsedMs = Date.now() - startedAt;

      try {
        await recordFileProcessed({ size: originalSize, kind: 'compressed' });
      } catch (_) {}
      try {
        await addActivity({
          type: 'image_compress',
          message: `Image compressed: ${path.basename(finalPath)} savings ${compressionRatio}%`,
          severity: 'info',
          userId: (req.user && req.user.userId) ? req.user.userId : 'anonymous',
          meta: { originalSize, compressedSize, memStart, memEnd, elapsedMs }
        });
      } catch (_) {}

      res.json({
        success: true,
        message: 'Image compressed successfully',
        originalSize,
        compressedSize,
        savings: compressionRatio,
        downloadUrl: `/uploads/${path.basename(finalPath)}`
      });
    });
  } catch (error) {
    console.error('Image compression error:', error);
    res.status(500).json({ error: 'Error compressing image' });
  }
});

// @route   POST /api/tools/compress-video
// @desc    Compress video file
// @access  Public
router.post('/compress-video', uploadVideo, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }
    await runJob(async () => {
      // Process video compression using FFmpeg
      const ffmpeg = require('fluent-ffmpeg');
      const ffmpegPath = require('ffmpeg-static');
      if (ffmpegPath) {
        ffmpeg.setFfmpegPath(ffmpegPath);
      }
      // Try to set ffprobe if available, but do not fail if missing
      try {
        const ffprobeStatic = require('ffprobe-static');
        if (ffprobeStatic?.path) {
          ffmpeg.setFfprobePath(ffprobeStatic.path);
        }
      } catch (_) {}
      const path = require('path');
      const fs = require('fs');
      const speed = getSpeed(req);
      const startedAt = Date.now();
      const memStart = memSnapshot();

      const inputPath = req.file.path;
      const outputPath = path.join(path.dirname(inputPath), `compressed-${req.file.filename}`);

      // Get original file size
      const originalSize = fs.statSync(inputPath).size;
      // Choose preset/CRF for speed vs quality
      const preset = speed === 'quality' ? 'slow' : (speed === 'balanced' ? 'fast' : (speed === 'fast' ? 'veryfast' : 'ultrafast'));
      const crf = speed === 'quality' ? 20 : (speed === 'balanced' ? 22 : (speed === 'fast' ? 24 : 28));

      // Compress video with single-pass CRF encode
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .outputOptions([
            '-threads', String(FFMPEG_THREADS),
            '-preset', preset,
            '-crf', String(crf),
            '-b:a', '96k',
            '-movflags', '+faststart',
            '-pix_fmt', 'yuv420p'
          ])
          .on('end', resolve)
          .on('error', reject)
          .save(outputPath);
      });

      // Safety: if not smaller, quick retry with higher CRF
      let compressedSize = fs.statSync(outputPath).size;
      if (compressedSize >= originalSize) {
        const retryPath = path.join(path.dirname(inputPath), `compressed2-${req.file.filename}`);
        await new Promise((resolve, reject) => {
          ffmpeg(outputPath)
            .outputOptions([
              '-threads', String(FFMPEG_THREADS),
              '-preset', speed === 'turbo' ? 'ultrafast' : 'veryfast',
              '-crf', '30',
              '-b:a', '96k',
              '-movflags', '+faststart',
              '-pix_fmt', 'yuv420p'
            ])
            .on('end', resolve)
            .on('error', reject)
            .save(retryPath);
        });
        try { fs.unlinkSync(outputPath); } catch (_) {}
        fs.renameSync(retryPath, outputPath);
      }
      const finalSize = fs.statSync(outputPath).size;
      let useOriginal = false;
      let deliveredPath = outputPath;
      let deliveredSize = finalSize;
      if (finalSize >= originalSize) {
        // If no savings, keep original file
        try { fs.unlinkSync(outputPath); } catch (_) {}
        deliveredPath = inputPath;
        deliveredSize = originalSize;
        useOriginal = true;
      }
      let compressionRatio = ((originalSize - deliveredSize) / originalSize * 100).toFixed(2);

      // Clean up original file only if we are delivering the compressed output (handle Windows EBUSY/EPERM gracefully)
      if (deliveredPath !== inputPath) {
        try {
          fs.unlinkSync(inputPath);
        } catch (err) {
          if (err && (err.code === 'EBUSY' || err.code === 'EPERM')) {
            setTimeout(() => {
              try { fs.unlinkSync(inputPath); } catch (_) {}
            }, 500);
          }
        }
      }

      const memEnd = memSnapshot();
      const elapsedMs = Date.now() - startedAt;

      try {
        await recordFileProcessed({ size: originalSize, kind: 'compressed' });
      } catch (_) {}
      try {
        await addActivity({
          type: 'video_compress',
          message: `Video compressed: ${path.basename(deliveredPath)} savings ${compressionRatio}%`,
          severity: 'info',
          userId: (req.user && req.user.userId) ? req.user.userId : 'anonymous',
          meta: { originalSize, compressedSize: deliveredSize, memStart, memEnd, elapsedMs }
        });
      } catch (_) {}

      res.json({
        success: true,
        message: 'Video compressed successfully',
        originalSize,
        compressedSize: deliveredSize,
        savings: compressionRatio,
        downloadUrl: `/uploads/${path.basename(deliveredPath)}`
      });
    });
  } catch (error) {
    console.error('Video compression error:', error);
    res.status(500).json({ error: 'Error compressing video' });
  }
});

// @route   POST /api/tools/compress-audio
// @desc    Compress audio file
// @access  Public
router.post('/compress-audio', uploadAudio, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }
    await runJob(async () => {
      // Process audio compression using FFmpeg
      const ffmpeg = require('fluent-ffmpeg');
      const ffmpegPath = require('ffmpeg-static');
      if (ffmpegPath) {
        ffmpeg.setFfmpegPath(ffmpegPath);
      }
      const path = require('path');
      const fs = require('fs');
      const speed = getSpeed(req);
      const startedAt = Date.now();
      const memStart = memSnapshot();

      const inputPath = req.file.path;
      const baseName = path.parse(req.file.filename).name;
      // Use AAC in M4A container for broad compatibility (avoids libmp3lame availability issues)
      const outputPath = path.join(path.dirname(inputPath), `compressed-${baseName}.m4a`);

      // Get original file size
      const originalSize = fs.statSync(inputPath).size;

      // Compress audio
      const targetAudioBitrate = speed === 'quality' ? '192k' : (speed === 'balanced' ? '160k' : (speed === 'fast' ? '128k' : (speed === 'turbo' ? '96k' : '96k')));
      await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
          .noVideo()
          .audioCodec('aac')
          .audioBitrate(targetAudioBitrate)
          .outputOptions(['-threads', String(FFMPEG_THREADS), '-movflags', '+faststart'])
          .on('end', resolve)
          .on('error', reject)
          .save(outputPath);
      });

      // Get compressed file size and ensure no size increase
      let compressedSize = fs.statSync(outputPath).size;
      let finalPath = outputPath;
      if (compressedSize >= originalSize) {
        try { fs.unlinkSync(outputPath); } catch (_) {}
        finalPath = inputPath;
        compressedSize = originalSize;
      }
      const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

      // Clean up original file only if a smaller compressed file is used (handle Windows EBUSY/EPERM gracefully)
      if (finalPath !== inputPath) {
        try {
          fs.unlinkSync(inputPath);
        } catch (err) {
          if (err && (err.code === 'EBUSY' || err.code === 'EPERM')) {
            setTimeout(() => {
              try { fs.unlinkSync(inputPath); } catch (_) {}
            }, 500);
          }
        }
      }

      const memEnd = memSnapshot();
      const elapsedMs = Date.now() - startedAt;

      try {
        await recordFileProcessed({ size: originalSize, kind: 'compressed' });
      } catch (_) {}
      try {
        await addActivity({
          type: 'audio_compress',
          message: `Audio compressed: ${path.basename(finalPath)} savings ${compressionRatio}%`,
          severity: 'info',
          userId: (req.user && req.user.userId) ? req.user.userId : 'anonymous',
          meta: { originalSize, compressedSize, memStart, memEnd, elapsedMs }
        });
      } catch (_) {}

      res.json({
        success: true,
        message: 'Audio compressed successfully',
        originalSize,
        compressedSize,
        savings: compressionRatio,
        downloadUrl: `/uploads/${path.basename(finalPath)}`
      });
    });
  } catch (error) {
    console.error('Audio compression error:', error);
    res.status(500).json({ error: 'Error compressing audio' });
  }
});

// @route   POST /api/tools/convert-audio
// @desc    Convert audio format
// @access  Public
router.post('/convert-audio', uploadAudio, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    const { targetFormat } = req.body;
    if (!targetFormat || !['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(targetFormat)) {
      return res.status(400).json({ error: 'Invalid target format' });
    }

    // Process audio conversion using FFmpeg (convert only; prioritize quality)
    const ffmpeg = require('fluent-ffmpeg');
    const ffmpegPath = require('ffmpeg-static');
    if (ffmpegPath) {
      ffmpeg.setFfmpegPath(ffmpegPath);
    }
    // TODO: implement audio conversion; placeholder response for now
    return res.status(501).json({ success: false, message: 'Audio conversion is coming soon!' });
  } catch (error) {
    console.error('Audio conversion error:', error);
    res.status(500).json({ error: 'Error converting audio' });
  }
});

// @route   POST /api/tools/compress-pdf
// @desc    Compress PDF file
// @access  Public
router.post('/compress-pdf', uploadPDF, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    await runJob(async () => {
      // Process PDF compression using pdf-lib first, then Ghostscript fallback for more savings/better compatibility
      const { PDFDocument } = require('pdf-lib');
      const fs = require('fs');
      const path = require('path');
      const speed = getSpeed(req);
      const startedAt = Date.now();
      const memStart = memSnapshot();

      const inputPath = req.file.path;
      let workingPath = inputPath; // path of current best output
      const outputPath = path.join(path.dirname(inputPath), `compressed-${req.file.filename}`);

      const originalSize = fs.statSync(inputPath).size;
      let compressedSize = originalSize;

      // Step 1: pdf-lib lightweight save (metadata/object streams)
      let pdfLibOk = false;
      try {
        if (originalSize <= MAX_PDF_PDFLIB_MB * MB) {
          const pdfBytes = fs.readFileSync(inputPath);
          const pdfDoc = await PDFDocument.load(pdfBytes);
          const saved = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
          fs.writeFileSync(outputPath, saved);
          workingPath = outputPath;
          compressedSize = fs.statSync(workingPath).size;
          pdfLibOk = true;
        } else {
          // Skip pdf-lib for large PDFs to avoid high memory usage
          pdfLibOk = false;
          workingPath = inputPath;
          compressedSize = originalSize;
        }
      } catch (_) {
        // ignore and try GS
        pdfLibOk = false;
        workingPath = inputPath;
        compressedSize = originalSize;
      }

      // Helper to run Ghostscript; tries multiple exe names; returns best output or null
      const runGhostscript = async (inPath, preset, colorRes = 110) => {
        return new Promise((resolve) => {
          try {
            const { spawn } = require('child_process');
            const exeCandidates = ['gswin64c', 'gswin32c', 'gs'];
            const outFile = path.join(path.dirname(inPath), `gs-${preset.replace('/', '')}-${path.basename(req.file.filename)}`);
            const args = [
              '-sDEVICE=pdfwrite',
              '-dCompatibilityLevel=1.4',
              `-dPDFSETTINGS=${preset}`,
              '-dDetectDuplicateImages=true',
              '-dCompressFonts=true',
              '-dSubsetFonts=true',
              '-dDownsampleColorImages=true',
              '-dColorImageDownsampleType=/Bicubic',
              `-dColorImageResolution=${colorRes}`,
              '-dDownsampleGrayImages=true',
              '-dGrayImageDownsampleType=/Bicubic',
              `-dGrayImageResolution=${colorRes}`,
              '-dDownsampleMonoImages=true',
              '-dMonoImageResolution=180',
              '-dNOPAUSE', '-dQUIET', '-dBATCH',
              `-sOutputFile=${outFile}`,
              inPath
            ];
            let i = 0;
            const tryExe = () => {
              if (i >= exeCandidates.length) return resolve(null);
              const exe = exeCandidates[i++];
              const p = spawn(exe, args, { stdio: 'ignore' });
              p.on('error', () => tryExe());
              p.on('exit', (code) => {
                if (code === 0 && fs.existsSync(outFile)) {
                  try { resolve({ path: outFile, size: fs.statSync(outFile).size }); } catch { resolve(null); }
                } else { tryExe(); }
              });
            };
            tryExe();
          } catch { resolve(null); }
        });
      };

      // Step 2: If pdf-lib failed or savings below threshold, try GS (threshold depends on SPEED)
      const currentSavings = ((originalSize - compressedSize) / originalSize) * 100;
      const gsThreshold = speed === 'quality' ? 30 : (speed === 'balanced' ? 25 : (speed === 'fast' ? 18 : 10));
      // Skip Ghostscript entirely for 'turbo' to maximize speed
      if (speed !== 'turbo' && (!pdfLibOk || currentSavings < gsThreshold)) {
        const gs1 = await runGhostscript(workingPath, '/ebook', 110);
        let best = gs1 && gs1.size < compressedSize ? gs1 : null;
        if (speed === 'quality') {
          if (!best || ((originalSize - best.size) / originalSize) * 100 < gsThreshold) {
            const gs2 = await runGhostscript(workingPath, '/screen', 96);
            if (gs2 && (!best || gs2.size < best.size)) best = gs2;
          }
        }
        if (best && best.size < compressedSize) {
          try { if (workingPath !== inputPath) fs.unlinkSync(workingPath); } catch (_) {}
          workingPath = best.path;
          compressedSize = best.size;
        }
      }

      // If the compressed result is not smaller, keep the original file
      if (compressedSize >= originalSize) {
        workingPath = inputPath;
        compressedSize = originalSize;
      }

      // Clean original upload only if we produced a smaller file
      if (workingPath !== inputPath) {
        try { fs.unlinkSync(inputPath); } catch (_) {}
      }

      const savingsPercent = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
      const memEnd = memSnapshot();
      const elapsedMs = Date.now() - startedAt;
      try { await recordFileProcessed({ size: originalSize, kind: 'compressed' }); } catch (_) {}
      try {
        await addActivity({
          type: 'pdf_compress',
          message: `PDF compressed: ${path.basename(workingPath)} savings ${savingsPercent}%`,
          severity: 'info',
          userId: (req.user && req.user.userId) ? req.user.userId : 'anonymous',
          meta: { originalSize, compressedSize, memStart, memEnd, elapsedMs }
        });
      } catch (_) {}

      res.json({
        success: true,
        message: 'PDF compressed successfully',
        originalSize,
        compressedSize,
        savings: savingsPercent,
        downloadUrl: `/uploads/${path.basename(workingPath)}`
      });
    });
  } catch (error) {
    console.error('PDF compression error:', error);
    res.status(500).json({ error: 'Error compressing PDF' });
  }
});

// @route   POST /api/tools/convert-image
// @desc    Convert image format
// @access  Public
router.post('/convert-image', uploadImage, async (req, res) => {
  try {
    // Not implemented yet: clean up uploaded file and return 501
    if (req.file && req.file.path) {
      try { require('fs').unlinkSync(req.file.path); } catch (_) {}
    }
    return res.status(501).json({ success: false, message: 'Image conversion is coming soon!' });
  } catch (error) {
    console.error('Image conversion error:', error);
    res.status(500).json({ error: 'Error converting image' });
  }
});

// @route   POST /api/tools/convert-video
// @desc    Convert video format
// @access  Public
router.post('/convert-video', uploadVideo, async (req, res) => {
  try {
    // Not implemented yet: clean up uploaded file and return 501
    if (req.file && req.file.path) {
      const fs = require('fs');
      try { fs.unlinkSync(req.file.path); } catch (_) {}
    }
    return res.status(501).json({ success: false, message: 'Video conversion is coming soon!' });
  } catch (error) {
    console.error('Video conversion error:', error);
    res.status(500).json({ error: 'Error converting video' });
  }
});


// @route   POST /api/tools/convert-pdf
// @desc    Convert PDF to images (Coming Soon)
// @access  Public
router.post('/convert-pdf', uploadPDF, async (req, res) => {
  try {
    // Clean up uploaded file since we're not processing it
    if (req.file) {
      const fs = require('fs');
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        // Ignore cleanup errors
      }
    }

    // Return Coming Soon response
    res.status(503).json({ 
      success: false,
      message: 'PDF to Image conversion is coming soon!',
      error: 'This feature is currently under development. Please check back later.',
      comingSoon: true
    });
  } catch (error) {
    console.error('PDF conversion coming soon error:', error);
    res.status(503).json({ 
      success: false,
      error: 'PDF to Image conversion is coming soon!',
      comingSoon: true
    });
  }
});

module.exports = router;
