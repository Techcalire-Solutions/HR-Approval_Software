const express = require('express');
const router = express.Router();
const {Op, fn, col, where} = require('sequelize');
const multer = require('../../utils/multer'); // Import the configured multer instance
const path = require('path');
const fs = require('fs');
const PerformaInvoice = require('../models/performaInvoice');
const authenticateToken = require('../../middleware/authorization');
const PerformaInvoiceStatus = require('../models/invoiceStatus');

router.post('/fileupload', multer.single('file'), authenticateToken, (req, res) => {
  try {
    console.log(req.body);
    
    console.log('File uploaded:', req.file);

    if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded' });
    }

    // Construct the URL path
    const fileUrl = `/invoices/uploads/${req.file.filename}`;

    res.status(200).send({
      message: 'File uploaded successfully',
      file: req.file,
      fileUrl: fileUrl
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send({ message: error.message });
  }
});

router.delete('/filedelete', authenticateToken, async (req, res) => {
  try {
    console.log(req.query);
    const fileName = path.basename(req.query.fileName);

    console.log(fileName);
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


const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
};

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