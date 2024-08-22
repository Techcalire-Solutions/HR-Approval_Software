const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const formatDateTime = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../invoices/uploads'));
  },
  filename: (req, file, cb) => {
    const dateTime = formatDateTime();
    const uniqueSuffix = uuidv4(); // Generate a UUID for uniqueness
    const fileExtension = path.extname(file.originalname);
    const newFilename = `${dateTime}_${uniqueSuffix}${fileExtension}`;
    cb(null, newFilename);
  }
});

const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const mimetype = fileTypes.test(file.mimetype);
  const extname = fileTypes.test(path.extname(file.originalname));

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('File format is not supported'));
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // 10 MB in bytes
  fileFilter: fileFilter
});


module.exports = upload;
