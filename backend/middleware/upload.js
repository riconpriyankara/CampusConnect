const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage configuration with dynamic folder routing
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = 'general';
    const url = req.originalUrl || '';
    
    if (url.includes('/auth') || url.includes('/profile') || url.includes('/users')) {
      folder = 'profiles';
    } else if (url.includes('/books')) {
      folder = 'books';
    } else if (url.includes('/events')) {
      folder = 'banners';
    } else if (url.includes('/notes')) {
      folder = 'notes';
    }

    let dir = path.join(__dirname, `../uploads/${folder}`);
    
    // Ensure directory exists, fallback to /tmp if read-only filesystem
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (err) {
      dir = '/tmp';
    }
    
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File validator filter
const fileFilter = (req, file, cb) => {
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (jpg, png, gif, webp) and PDFs are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15 MB file size limit
  },
});

module.exports = upload;
