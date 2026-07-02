const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure temp folder exists
const tempDir = 'uploads/temp';
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

// Accept almost all common file types (images, documents, video, audio, archives, etc.)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/plain',
    'text/csv',
    // Video
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 
    'video/x-matroska', 'video/mpeg',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3',
    // Archives
    'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
    // Ebooks
    'application/epub+zip',
    // Other
    'application/octet-stream' // fallback
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // For safety, still reject unknown types (optional – you can allow all)
    cb(new Error('Unsupported file type'), false);
  }
};

// Multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB max (enough for most videos and PDFs)
  }
});

module.exports = upload;