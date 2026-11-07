const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const dir = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(dir, { recursive: true });

const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png' };

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    cb(null, crypto.randomBytes(16).toString('hex') + EXT[file.mimetype]);
  },
});

const fileFilter = (req, file, cb) => {
  if (EXT[file.mimetype]) cb(null, true);
  else cb(new Error('INVALID_IMAGE'));
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});