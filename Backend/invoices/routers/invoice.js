const express = require('express');
const router = express.Router();
const upload = require('../../utils/multer'); // Import the configured multer instance
const path = require('path');
const fs = require('fs');
const PerformaInvoice = require('../models/performaInvoice');
const authenticateToken = require('../../middleware/authorization');
const s3 = require('../../utils/s3bucket')
// const upload = multer({ storage: multer.memoryStorage() }); 

// router.post('/fileupload', multer.single('file'), authenticateToken, (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).send({ message: 'No file uploaded' });
//     }

//     // Construct the URL path
//     const fileUrl = `/invoices/uploads/${req.file.filename}`;

//     res.status(200).send({
//       message: 'File uploaded successfully',
//       file: req.file,
//       fileUrl: fileUrl
//     });
//   } catch (error) {
//     console.error('Error uploading file:', error);
//     res.status(500).send({ message: error.message });
//   }
// });


router.post('/fileupload', upload.single('file'), authenticateToken, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded' });
    }

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
  try {
    const fileName = path.basename(req.query.fileName);

    const filePath = path.join(__dirname, '../uploads', fileName);

    // Check if the file exists
    if (fs.existsSync(filePath)) {
      // Delete the file
      fs.unlink(filePath, async (err) => {
        if (err) {
          console.error('Error deleting file:', err);
          return res.status(500).send({ message: 'Error deleting file' });
        }

        // File deletion was successful, proceed with database operations
        const pi = await PerformaInvoice.findByPk(req.query.id);
        pi.url = '';
        await pi.save();

        // const piStatusArray = await PerformaInvoiceStatus.findAll({
        //   where: { id: req.query.id },
        // });

        // if (piStatusArray.length > 0) {
        //   for (const piStatus of piStatusArray) {
        //     await piStatus.destroy();
        //   }
        //   console.log('All records deleted.');
        // } else {
        //   console.log('No records found.');
        // }

        res.send(pi); // Send the response after the file is deleted and database operations are complete
      });
    } else {
      return res.status(404).send({ message: 'File not found' });
    }
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send(error.message);
  }
});



router.delete('/filedelete/:id', async (req, res) => {
  let id = req.params.id;
  try {
    const pi = await PerformaInvoice.findByPk(id);
    let filename = pi.url
    const directoryPath = path.join(__dirname, '../uploads'); // Replace 'uploads' with your folder name
    const filePath = path.join(directoryPath, filename);

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Delete the file
        fs.unlink(filePath, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Error deleting file' });
            }

            return res.status(200).json({ message: 'File deleted successfully' });
        });
    })
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).send({ message: error.message });
  }
});
module.exports = router;