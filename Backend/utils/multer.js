/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const multer = require('multer');
const path = require('path');

const fileFilter = (req, file, cb) => {
  const fileTypes = /jpeg|jpg|png|pdf|txt|text\/plain/; 

  const mimetype = fileTypes.test(file.mimetype);
  
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase()); 

  if (mimetype && extname) {
    return cb(null, true); 
  }
  return cb(new Error('File format is not supported'));
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10000000 }, // 10 MB in bytes
  fileFilter: fileFilter
});


module.exports = upload;
