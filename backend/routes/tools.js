const express = require('express');
const router = express.Router();
const { uploadImage, uploadVideo, uploadAudio, uploadPDF, uploadAny } = require('../middleware/upload');
const { addActivity } = require('../utils/dataStore');

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

    // Process image compression using Sharp
    const sharp = require('sharp');
    const path = require('path');
    const fs = require('fs');

    const inputPath = req.file.path;
    const outputDir = path.dirname(inputPath);
    const baseName = path.parse(req.file.filename).name;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const outputOriginalFmt = path.join(outputDir, `compressed-${req.file.filename}`);
    const outputWebp = path.join(outputDir, `compressed-${baseName}.webp`);
    const outputAvif = path.join(outputDir, `compressed-${baseName}.avif`);
    
    // Generate multiple candidates and pick the smallest
    const generateCandidates = async () => {
      const candidates = [];
      const originalSize = fs.statSync(inputPath).size;

      // Same-format compression
      try {
        const p1 = sharp(inputPath);
        if (ext === '.jpg' || ext === '.jpeg') {
          await p1.jpeg({ quality: 55, mozjpeg: true, progressive: true }).toFile(outputOriginalFmt);
        } else if (ext === '.png') {
          await p1.png({ compressionLevel: 9, palette: true, effort: 10 }).toFile(outputOriginalFmt);
        } else if (ext === '.webp') {
          await p1.webp({ quality: 60 }).toFile(outputOriginalFmt);
        } else if (ext === '.avif') {
          await p1.avif({ quality: 35 }).toFile(outputOriginalFmt);
        } else {
          await p1.jpeg({ quality: 60, mozjpeg: true, progressive: true }).toFile(outputOriginalFmt);
        }
        candidates.push(outputOriginalFmt);
      } catch (_) {}

      // WebP candidate (good general-purpose lossy)
      try {
        await sharp(inputPath).webp({ quality: 75 }).toFile(outputWebp);
        candidates.push(outputWebp);
      } catch (_) {}

      // AVIF candidate (stronger compression)
      try {
        await sharp(inputPath).avif({ quality: 35, effort: 4 }).toFile(outputAvif);
        candidates.push(outputAvif);
      } catch (_) {}

      // Choose smallest; prefer candidates smaller than original; fall back to smallest overall
      let chosen = null;
      let chosenSize = Number.MAX_SAFE_INTEGER;
      for (const p of candidates) {
        if (!fs.existsSync(p)) continue;
        const s = fs.statSync(p).size;
        const isSmallerThanOriginal = s < originalSize;
        if (isSmallerThanOriginal && s < chosenSize) {
          chosen = p; chosenSize = s;
        }
      }
      if (!chosen) {
        for (const p of candidates) {
          if (!fs.existsSync(p)) continue;
          const s = fs.statSync(p).size;
          if (s < chosenSize) { chosen = p; chosenSize = s; }
        }
      }
      return { chosen, originalSize };
    };

    const { chosen, originalSize } = await generateCandidates();
    const finalPath = chosen || outputOriginalFmt;

    // Get file sizes
    const compressedSize = fs.statSync(finalPath).size;
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

    // Clean up original file (handle Windows EBUSY/EPERM gracefully)
    try {
      fs.unlinkSync(inputPath);
    } catch (err) {
      if (err && (err.code === 'EBUSY' || err.code === 'EPERM')) {
        setTimeout(() => {
          try { fs.unlinkSync(inputPath); } catch (_) {}
        }, 500);
      }
    }
    // Remove other candidate files except the final one
    [outputOriginalFmt, outputWebp, outputAvif].forEach(p => {
      if (p !== finalPath) {
        try { fs.unlinkSync(p); } catch (_) {}
      }
    });

    try {
      await addActivity({
        type: 'image_compress',
        message: `Image compressed: ${path.basename(finalPath)} savings ${compressionRatio}%`,
        severity: 'info',
        userId: (req.user && req.user.userId) ? req.user.userId : 'anonymous',
        meta: { originalSize, compressedSize }
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

    const inputPath = req.file.path;
    const outputPath = path.join(path.dirname(inputPath), `compressed-${req.file.filename}`);

    // Get original file size
    const originalSize = fs.statSync(inputPath).size;

    // Probe original bitrate to ensure compressed file is smaller
    const metadata = await new Promise((resolve) => {
      try {
        ffmpeg.ffprobe(inputPath, (err, data) => {
          if (err) return resolve(null);
          resolve(data);
        });
      } catch (_) {
        resolve(null);
      }
    });

    const durationSec = metadata?.format?.duration || 0;
    const formatBitRate = metadata?.format?.bit_rate ? parseInt(metadata.format.bit_rate, 10) : 0;
    const audioStream = Array.isArray(metadata?.streams) ? metadata.streams.find(s => s.codec_type === 'audio') : undefined;
    const videoStream = Array.isArray(metadata?.streams) ? metadata.streams.find(s => s.codec_type === 'video') : undefined;
    const audioBitRateOrig = audioStream?.bit_rate ? parseInt(audioStream.bit_rate, 10) : 128000;
    const videoBitRateOrig = videoStream?.bit_rate ? parseInt(videoStream.bit_rate, 10) : 0;
    let totalBitRateOrig = formatBitRate || (durationSec > 0 ? Math.floor((originalSize * 8) / Math.max(1, durationSec)) : (videoBitRateOrig + audioBitRateOrig));
    if (!totalBitRateOrig || Number.isNaN(totalBitRateOrig)) {
      totalBitRateOrig = 2000000; // 2 Mbps conservative default
    }

    // Target: at least ~25% smaller combined bitrate
    const targetTotalBitRate = Math.max(400000, Math.floor(totalBitRateOrig * 0.75));
    // Audio target between 64k and 128k, not above original
    let targetAudioBitRate = Math.max(64000, Math.min(128000, Math.floor(audioBitRateOrig * 0.75)));
    if (audioBitRateOrig && targetAudioBitRate >= audioBitRateOrig) {
      targetAudioBitRate = Math.max(64000, Math.floor(audioBitRateOrig * 0.9));
    }
    // Video target is remaining; ensure not above original and not too low
    let targetVideoBitRate = Math.max(300000, targetTotalBitRate - targetAudioBitRate);
    const videoOrigFallback = videoBitRateOrig || (totalBitRateOrig - audioBitRateOrig);
    if (videoOrigFallback && targetVideoBitRate >= videoOrigFallback) {
      targetVideoBitRate = Math.max(300000, Math.floor(videoOrigFallback * 0.85));
    }

    // Compress video
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-preset', 'slow',
          '-b:v', `${Math.floor(targetVideoBitRate / 1000)}k`,
          '-maxrate', `${Math.floor(targetVideoBitRate * 1.1 / 1000)}k`,
          '-bufsize', `${Math.floor(targetVideoBitRate * 2 / 1000)}k`,
          '-b:a', `${Math.floor(targetAudioBitRate / 1000)}k`,
          '-movflags', '+faststart',
          '-pix_fmt', 'yuv420p'
        ])
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });

    // Get compressed file size
    const compressedSize = fs.statSync(outputPath).size;
  let compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

  // Safety: if not smaller, try a second pass with stronger settings
  if (compressedSize >= originalSize) {
    const retryPath = path.join(path.dirname(inputPath), `compressed2-${req.file.filename}`);
    await new Promise((resolve, reject) => {
      const ffmpeg = require('fluent-ffmpeg');
      const ffmpegPath = require('ffmpeg-static');
      if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
      ffmpeg(outputPath)
        .outputOptions([
          '-preset', 'veryslow',
          '-crf', '28'
        ])
        .on('end', resolve)
        .on('error', reject)
        .save(retryPath);
    });
    try {
      fs.unlinkSync(outputPath);
    } catch (_) {}
    fs.renameSync(retryPath, outputPath);
  }
  const finalSize = fs.statSync(outputPath).size;
  compressionRatio = ((originalSize - finalSize) / originalSize * 100).toFixed(2);

    // Clean up original file (handle Windows EBUSY/EPERM gracefully)
    try {
      fs.unlinkSync(inputPath);
    } catch (err) {
      if (err && (err.code === 'EBUSY' || err.code === 'EPERM')) {
        setTimeout(() => {
          try { fs.unlinkSync(inputPath); } catch (_) {}
        }, 500);
      }
    }

  try {
      await addActivity({
        type: 'video_compress',
        message: `Video compressed: ${path.basename(outputPath)} savings ${compressionRatio}%`,
        severity: 'info',
        userId: (req.user && req.user.userId) ? req.user.userId : 'anonymous',
        meta: { originalSize, compressedSize: finalSize }
      });
    } catch (_) {}

  res.json({
      success: true,
      message: 'Video compressed successfully',
      originalSize,
    compressedSize: finalSize,
    savings: compressionRatio,
      downloadUrl: `/uploads/${path.basename(outputPath)}`
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

    // Process audio compression using FFmpeg
    const ffmpeg = require('fluent-ffmpeg');
    const ffmpegPath = require('ffmpeg-static');
    if (ffmpegPath) {
      ffmpeg.setFfmpegPath(ffmpegPath);
    }
    const path = require('path');
    const fs = require('fs');

    const inputPath = req.file.path;
    const baseName = path.parse(req.file.filename).name;
    // Use AAC in M4A container for broad compatibility (avoids libmp3lame availability issues)
    const outputPath = path.join(path.dirname(inputPath), `compressed-${baseName}.m4a`);

    // Get original file size
    const originalSize = fs.statSync(inputPath).size;

    // Compress audio
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .audioCodec('aac')
        .audioBitrate('128k')
        .outputOptions(['-movflags', '+faststart'])
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });

    // Get compressed file size
    const compressedSize = fs.statSync(outputPath).size;
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);

    // Clean up original file (handle Windows EBUSY/EPERM gracefully)
    try {
      fs.unlinkSync(inputPath);
    } catch (err) {
      if (err && (err.code === 'EBUSY' || err.code === 'EPERM')) {
        setTimeout(() => {
          try { fs.unlinkSync(inputPath); } catch (_) {}
        }, 500);
      }
    }

    try {
      await addActivity({
        type: 'audio_compress',
        message: `Audio compressed: ${path.basename(outputPath)} savings ${compressionRatio}%`,
        severity: 'info',
        userId: (req.user && req.user.userId) ? req.user.userId : 'anonymous',
        meta: { originalSize, compressedSize }
      });
    } catch (_) {}

    res.json({
      success: true,
      message: 'Audio compressed successfully',
      originalSize,
      compressedSize,
      savings: compressionRatio,
      downloadUrl: `/uploads/${path.basename(outputPath)}`
    });
  } catch (error) {
    console.error('Audio compression error:', error);
    res.status(500).json({ error: 'Error compressing audio' });
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

    // Process PDF compression using pdf-lib first, then Ghostscript fallback for more savings/better compatibility
    const { PDFDocument } = require('pdf-lib');
    const fs = require('fs');
    const path = require('path');

    const inputPath = req.file.path;
    let workingPath = inputPath; // path of current best output
    const outputPath = path.join(path.dirname(inputPath), `compressed-${req.file.filename}`);

    const originalSize = fs.statSync(inputPath).size;
    let compressedSize = originalSize;

    // Step 1: pdf-lib lightweight save (metadata/object streams)
    let pdfLibOk = false;
    try {
      const pdfBytes = fs.readFileSync(inputPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const saved = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
      fs.writeFileSync(outputPath, saved);
      workingPath = outputPath;
      compressedSize = fs.statSync(workingPath).size;
      pdfLibOk = true;
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

    // Step 2: If pdf-lib failed or savings < 30%, try GS '/ebook'; if still low, try '/screen'
    const currentSavings = ((originalSize - compressedSize) / originalSize) * 100;
    if (!pdfLibOk || currentSavings < 30) {
      const gs1 = await runGhostscript(workingPath, '/ebook', 110);
      let best = gs1 && gs1.size < compressedSize ? gs1 : null;
      if (!best || ((originalSize - best.size) / originalSize) * 100 < 30) {
        const gs2 = await runGhostscript(workingPath, '/screen', 96);
        if (gs2 && (!best || gs2.size < best.size)) best = gs2;
      }
      if (best && best.size < compressedSize) {
        try { if (workingPath !== inputPath) fs.unlinkSync(workingPath); } catch (_) {}
        workingPath = best.path;
        compressedSize = best.size;
      }
    }

    // Clean original upload
    try { fs.unlinkSync(inputPath); } catch (_) {}

    const savingsPercent = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
    try {
      await addActivity({
        type: 'pdf_compress',
        message: `PDF compressed: ${path.basename(workingPath)} savings ${savingsPercent}%`,
        severity: 'info',
        userId: (req.user && req.user.userId) ? req.user.userId : 'anonymous',
        meta: { originalSize, compressedSize }
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
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const { targetFormat } = req.body;
    const requested = (targetFormat || '').toLowerCase();
    const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'avif', 'ico'];
    if (!allowed.includes(requested)) {
      return res.status(400).json({ error: 'Invalid target format' });
    }
    const sharpFormat = requested === 'jpg' ? 'jpeg' : requested;

    // Process image conversion using Sharp (preserve quality/metadata; no extra compression)
    const sharp = require('sharp');
    const path = require('path');
    const fs = require('fs');

    const inputPath = req.file.path;
    const outputPath = path.join(path.dirname(inputPath), `converted-${path.parse(req.file.filename).name}.${requested}`);

    // Convert image with maximum quality to preserve original quality (no compression)
    const image = sharp(inputPath).withMetadata();
    if (sharpFormat === 'jpeg') {
      await image.jpeg({ quality: 100, progressive: true }).toFile(outputPath);
    } else if (sharpFormat === 'png') {
      await image.png({ compressionLevel: 0 }).toFile(outputPath);
    } else if (sharpFormat === 'webp') {
      await image.webp({ quality: 100 }).toFile(outputPath);
    } else if (sharpFormat === 'gif') {
      await image.gif().toFile(outputPath);
    } else if (sharpFormat === 'bmp') {
      await image.bmp().toFile(outputPath);
    } else if (sharpFormat === 'tiff') {
      await image.tiff({ quality: 100 }).toFile(outputPath);
    } else if (sharpFormat === 'avif') {
      await image.avif({ quality: 100 }).toFile(outputPath);
    } else if (sharpFormat === 'ico') {
      // ICO format - create multiple sizes for favicon
      await image.resize(32, 32).png().toFile(outputPath);
    } else {
      await image.toFormat(sharpFormat).toFile(outputPath);
    }

  // Get file sizes
  const originalSize = fs.statSync(inputPath).size;
  const convertedSize = fs.statSync(outputPath).size;
  const savings = ((originalSize - convertedSize) / originalSize * 100).toFixed(2);

  // Clean up original file (handle Windows EBUSY/EPERM gracefully)
  try {
    fs.unlinkSync(inputPath);
  } catch (err) {
    if (err && (err.code === 'EBUSY' || err.code === 'EPERM')) {
      setTimeout(() => {
        try { fs.unlinkSync(inputPath); } catch (_) {}
      }, 500);
    }
  }

    try {
      await addActivity({
        type: 'image_convert',
        message: `Image converted to ${requested.toUpperCase()}: ${path.basename(outputPath)}`,
        severity: 'info',
        userId: (req.user && req.user.userId) ? req.user.userId : 'anonymous',
        meta: { originalSize, convertedSize }
      });
    } catch (_) {}

    res.json({
      success: true,
      message: `Image converted to ${targetFormat.toUpperCase()} successfully`,
      originalSize,
      convertedSize,
      compressedSize: convertedSize,
      savings: '0.00', // No compression during conversion
      downloadUrl: `/uploads/${path.basename(outputPath)}`,
      targetFormat: requested,
      outputFilename: path.basename(outputPath)
    });
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
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const { targetFormat } = req.body;
    if (!targetFormat || !['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(targetFormat)) {
      return res.status(400).json({ error: 'Invalid target format' });
    }

    // Process video conversion using FFmpeg (convert only; avoid extra compression if possible)
    const ffmpeg = require('fluent-ffmpeg');
    const ffmpegPath = require('ffmpeg-static');
    if (ffmpegPath) {
      ffmpeg.setFfmpegPath(ffmpegPath);
    }
    const path = require('path');
    const fs = require('fs');

    const inputPath = req.file.path;
    const outputPath = path.join(path.dirname(inputPath), `converted-${path.parse(req.file.filename).name}.${targetFormat}`);

    // Try stream copy first (container remux). If it fails, re-encode with visually lossless settings
    const tryCopy = () => new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions(['-c', 'copy'])
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });
    const tryReencode = () => new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-preset', 'slow',
          '-crf', '18',
          '-movflags', '+faststart'
        ])
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });
    try {
      await tryCopy();
    } catch (_) {
      await tryReencode();
    }

  // Get file sizes
  const originalSize = fs.statSync(inputPath).size;
  const convertedSize = fs.statSync(outputPath).size;
  const savings = ((originalSize - convertedSize) / originalSize * 100).toFixed(2);

  // Clean up original file (handle Windows EBUSY/EPERM gracefully)
  try {
    fs.unlinkSync(inputPath);
  } catch (err) {
    if (err && (err.code === 'EBUSY' || err.code === 'EPERM')) {
      setTimeout(() => {
        try { fs.unlinkSync(inputPath); } catch (_) {}
      }, 500);
    }
  }

    try {
      await addActivity({
        type: 'video_convert',
        message: `Video converted to ${targetFormat.toUpperCase()}: ${path.basename(outputPath)}`,
        severity: 'info',
        userId: (req.user && req.user.userId) ? req.user.userId : 'anonymous',
        meta: { originalSize, convertedSize }
      });
    } catch (_) {}

  res.json({
      success: true,
      message: `Video converted to ${targetFormat.toUpperCase()} successfully`,
    originalSize,
    convertedSize,
    compressedSize: convertedSize,
    savings,
    downloadUrl: `/uploads/${path.basename(outputPath)}`
    });
  } catch (error) {
    console.error('Video conversion error:', error);
    res.status(500).json({ error: 'Error converting video' });
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
    const path = require('path');
    const fs = require('fs');

    const inputPath = req.file.path;
    const outputPath = path.join(path.dirname(inputPath), `converted-${path.parse(req.file.filename).name}.${targetFormat}`);

    // Choose codec based on target format
    const run = (codecArgs) => new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions(codecArgs)
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });

    const ext = targetFormat.toLowerCase();
    let codecArgs = [];
    if (ext === 'mp3') {
      // Prefer libmp3lame if available; otherwise return error instructing alternative
      codecArgs = ['-c:a', 'libmp3lame', '-q:a', '0'];
      try {
        await run(codecArgs);
      } catch (e) {
        return res.status(400).json({ error: 'MP3 encoding not supported on this server build. Try AAC or OGG.' });
      }
    } else if (ext === 'wav') {
      codecArgs = ['-c:a', 'pcm_s16le'];
      await run(codecArgs);
    } else if (ext === 'flac') {
      codecArgs = ['-c:a', 'flac'];
      await run(codecArgs);
    } else if (ext === 'aac' || ext === 'm4a') {
      codecArgs = ['-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart'];
      await run(codecArgs);
    } else if (ext === 'ogg' || ext === 'oga') {
      codecArgs = ['-c:a', 'libopus', '-b:a', '160k'];
      await run(codecArgs);
    } else {
      return res.status(400).json({ error: 'Unsupported target audio format' });
    }

  // Get file sizes
  const originalSize = fs.statSync(inputPath).size;
  const convertedSize = fs.statSync(outputPath).size;
  const savings = ((originalSize - convertedSize) / originalSize * 100).toFixed(2);

  // Clean up original file (handle Windows EBUSY/EPERM gracefully)
  try {
    fs.unlinkSync(inputPath);
  } catch (err) {
    if (err && (err.code === 'EBUSY' || err.code === 'EPERM')) {
      setTimeout(() => {
        try { fs.unlinkSync(inputPath); } catch (_) {}
      }, 500);
    }
  }

    try {
      await addActivity({
        type: 'audio_convert',
        message: `Audio converted to ${targetFormat.toUpperCase()}: ${path.basename(outputPath)}`,
        severity: 'info',
        userId: (req.user && req.user.userId) ? req.user.userId : 'anonymous',
        meta: { originalSize, convertedSize }
      });
    } catch (_) {}

    res.json({
      success: true,
      message: `Audio converted to ${targetFormat.toUpperCase()} successfully`,
    originalSize,
    convertedSize,
    compressedSize: convertedSize,
    savings,
    downloadUrl: `/uploads/${path.basename(outputPath)}`
    });
  } catch (error) {
    console.error('Audio conversion error:', error);
    res.status(500).json({ error: 'Error converting audio' });
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
