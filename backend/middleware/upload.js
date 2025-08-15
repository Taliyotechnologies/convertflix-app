const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists and use absolute path
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
try { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); } catch (_) {}

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
  fileFilter: imageFileFilter
}).single('file');

const uploadVideo = multer({
  storage: storage,
  fileFilter: fileFilter
}).single('file');

const uploadAudio = multer({
  storage: storage,
  fileFilter: fileFilter
}).single('file');

const uploadPDF = multer({
  storage: storage,
  fileFilter: fileFilter
}).single('file');

const uploadAny = multer({
  storage: storage,
  fileFilter: fileFilter
}).single('file');

module.exports = {
  uploadImage,
  uploadVideo,
  uploadAudio,
  uploadPDF,
  uploadAny
};
