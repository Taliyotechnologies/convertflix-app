const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists and use absolute path
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch (_) {}

// Helpers for limits from env (in MB)
const MB = 1024 * 1024;
function envInt(name, def) {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : def;
}
const LIMITS = {
  image: envInt('MAX_IMAGE_SIZE_MB', 50) * MB,   // default 50MB
  video: envInt('MAX_VIDEO_SIZE_MB', 500) * MB,  // default 500MB
  audio: envInt('MAX_AUDIO_SIZE_MB', 200) * MB,  // default 200MB
  pdf: envInt('MAX_PDF_SIZE_MB', 100) * MB,      // default 100MB
  any: envInt('MAX_ANY_SIZE_MB', 100) * MB,      // default 100MB
};

// Configure storage for different file types
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allow all files for now - you can add specific filters later
  cb(null, true);
};

// Image file filter
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/avif',
    'image/x-icon',
    'image/svg+xml'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Create multer instances for different file types
const uploadImage = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: LIMITS.image }
}).single('file');

const uploadVideo = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: LIMITS.video }
}).single('file');

const uploadAudio = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: LIMITS.audio }
}).single('file');

const uploadPDF = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: LIMITS.pdf }
}).single('file');

const uploadAny = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: LIMITS.any }
}).single('file');

module.exports = {
  uploadImage,
  uploadVideo,
  uploadAudio,
  uploadPDF,
  uploadAny
};
