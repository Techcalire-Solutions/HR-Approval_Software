const express = require('express');
const router = express.Router();
const upload = require('../../utils/multer'); // Import the configured multer instance
const path = require('path');
const fs = require('fs');
const PerformaInvoice = require('../models/performaInvoice');
const authenticateToken = require('../../middleware/authorization');
const s3 = require('../../utils/s3bucket');
const { log } = require('console');

router.post('/fileupload', upload.single('file'), authenticateToken, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded' });
    }
    console.log(req.file);
    
    // Sanitize the original file name by removing special characters and spaces
    const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9]/g, '_');

    // Create S3 upload parameters
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `invoices/${Date.now()}_${sanitizedFileName}`, // File path with sanitized name
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read' // Optional: make file publicly accessible
    };

    // Upload the file to S3
    const data = await s3.upload(params).promise();

    // Check if data.Location (fileUrl) exists
    const fileUrl = data.Location ? data.Location : '';

    // Replace only if fileUrl is valid
    const key = fileUrl ? fileUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '') : null;

    res.status(200).send({
      message: 'File uploaded successfully',
      file: req.file,
      fileUrl: key // S3 URL of the uploaded file
    });
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    res.status(500).send({ message: error.message });
  }
});

router.post('/bankslipupload', upload.single('file'), authenticateToken, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded' });
    }

    // Create S3 upload parameters
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key:`bankslips/${Date.now()}_${req.file.originalname}` , // File path with a unique name
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read' // Optional: make file publicly accessible
    };

    // Upload the file to S3
    const data = await s3.upload(params).promise();

    // The uploaded file URL
    const fileUrl = data.Location;

    res.status(200).send({
      message: 'File uploaded successfully',
      file: req.file,
      fileUrl: fileUrl // S3 URL of the uploaded file
    });
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    res.status(500).send({ message: error.message });
  }
});

router.delete('/filedelete', authenticateToken, async (req, res) => {
  let id = req.query.id;
  try {
    try {
        let result = await PerformaInvoice.findByPk(id);
        fileKey = result.url  ;
        result.url   = '';
        await result.save();
    } catch (error) {
      res.send(error.message)
    }
    let key;
    if (!fileKey) {
      key = req.query.key;
      
      fileKey = key ? key.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '') : null;
    }

    // Set S3 delete parameters
    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey
    };

    // Delete the file from S3
    await s3.deleteObject(deleteParams).promise();

    res.status(200).send({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    res.status(500).send({ message: error.message });
  }
});

router.delete('/filedeletebyurl', authenticateToken, async (req, res) => {
    key = req.query.key;
    fileKey = key ? key.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '') : null;
    try {
      if (!fileKey) {
        return res.send({ message: 'No file key provided' });
      }

      // Set S3 delete parameters
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey
      };

      // Delete the file from S3
      await s3.deleteObject(deleteParams).promise();

      res.status(200).send({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      res.status(500).send({ message: error.message });
    }
});

module.exports = router;