const express = require('express');
const router = express.Router();
const upload = require('../../utils/multer'); // Import the configured multer instance
const path = require('path');
const fs = require('fs');
const PerformaInvoice = require('../models/performaInvoice');
const authenticateToken = require('../../middleware/authorization');
const s3 = require('../../utils/s3bucket');
const { log } = require('console');
const sequelize = require('../../utils/db');
const { Parser } = require('json2csv')
const ExcelJS = require('exceljs');

router.post('/fileupload', upload.single('file'), authenticateToken, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded' });
    }
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
    res.status(500).send({ message: error.message });
  }
});

router.post('/bankslipupload', upload.single('file'), authenticateToken, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded' });
    }
    const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9]/g, '_');

    // Create S3 upload parameters
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key:`bankslips/${Date.now()}_${sanitizedFileName}` , // File path with a unique name
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
  console.log(req.query);
  
  let id = req.query.id;
  let index = req.query.index;
  let fileKey;
  let t;

  try {
    t = await sequelize.transaction();

    let result = await PerformaInvoice.findByPk(id, { transaction: t });

    if (!result || !result.url || !result.url[index]) {
      return res.status(404).send({ message: 'File or index not found' });
    }

    // Get the fileKey from the URL array
    fileKey = result.url[index].url;
    console.log("Deleting file:", fileKey);

    // Remove the file from the URL array based on the index
    result.url.splice(index, 1); 
    console.log("URL list after removal:", result.url);

    // Explicitly mark the URL field as changed and force the update
    result.setDataValue('url', result.url);
    result.changed('url', true); // Ensure Sequelize recognizes the field as changed

    // Save the changes
    await result.save({ transaction: t });

    // Commit the transaction to persist the changes
    await t.commit();

    // Fetch the latest version to check if it's updated
    result = await PerformaInvoice.findByPk(id);
    console.log("Updated URL list after reload:", result.url);

    // Set S3 delete parameters
    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey.replace('https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/', '')
    };

    // Delete the file from S3
    await s3.deleteObject(deleteParams).promise();

    res.send({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file from S3 or database:', error);

    // Rollback the transaction if it was created and an error occurs
    if (t) await t.rollback();

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

// router.post('/excelupload', async (req, res) => {
//   const jsonData = req.body; // Assuming incoming data is JSON
//   console.log(jsonData);

//   const currentDate = new Date().toISOString().split('T')[0];
//   const fileName = `PaymentExcel/${currentDate}.csv`;
//   const bucketName = process.env.AWS_BUCKET_NAME;

//   // Define the CSV fields based on the keys of the incoming JSON
//   const fields = Object.keys(jsonData);
//   const opts = { fields };
//   const parser = new Parser(opts);

//   let csv;
//   try {
//       csv = parser.parse(jsonData); // Convert JSON array to CSV
//   } catch (err) {
//       console.error('Error converting JSON to CSV:', err);
//       return res.status(500).send('Error converting JSON to CSV');
//   }

//   // Check if the file exists in S3
//   const paramsCheckFile = {
//       Bucket: bucketName,
//       Key: fileName
//   };

//   try {
//       const headData = await s3.headObject(paramsCheckFile).promise(); // Check if file exists
//       console.log('File exists in S3. Appending new row...');

//       // Download the existing CSV file
//       const existingFile = await s3.getObject(paramsCheckFile).promise();
//       const existingCSV = existingFile.Body.toString('utf-8');

//       // Append the new CSV row
//       const updatedCSV = existingCSV + '\n' + csv.split('\n')[1]; // Adding just the data row, skipping the headers

//       // Re-upload the updated CSV to S3
//       const paramsUpload = {
//           Bucket: bucketName,
//           Key: fileName,
//           Body: updatedCSV,
//           ContentType: 'text/csv',
//           ACL: 'public-read'
//       };

//       await s3.upload(paramsUpload).promise();
//       console.log(`File updated successfully at ${paramsUpload.Key}`);
//       return res.send(`File updated successfully at ${paramsUpload.Key}`);

//   } catch (err) {
//       if (err.code === 'NotFound') {
//           // If file doesn't exist, create a new one
//           console.log('File does not exist in S3. Creating a new file...');

//           const paramsUploadNew = {
//               Bucket: bucketName,
//               Key: fileName,
//               Body: csv,
//               ContentType: 'text/csv',
//               ACL: 'public-read'
//           };

//           await s3.upload(paramsUploadNew).promise();
//           console.log(`New file created successfully at ${paramsUploadNew.Key}`);
//           return res.send(`New file created successfully at ${paramsUploadNew.Key}`);
//       } else {
//           console.error('Error checking or uploading to S3:', err);
//           return res.status(500).send('Error checking or uploading to S3');
//       }
//   }
// });

router.post('/excelupload', async (req, res) => {
  let jsonData = req.body;
  console.log(jsonData);

  const currentDate = new Date().toISOString().split('T')[0];
  const fileName = `PaymentExcel/${currentDate}.xlsx`;
  const bucketName = process.env.AWS_BUCKET_NAME;

  // Initialize a new workbook
  const workbook = new ExcelJS.Workbook();
  let worksheet;

  // Function to set up worksheet columns
  const setUpWorksheet = () => {
    worksheet.columns = [
      { header: 'EntryNo', key: 'entryNo', width: 10 },
      { header: 'Purpose', key: 'purpose', width: 10 },
      { header: 'SupplierName', key: 'supplierName', width: 30 },
      { header: 'SupplierPONo', key: 'supplierPONo', width: 15 },
      { header: 'SupplierSONo', key: 'supplierSoNo', width: 15 },
      { header: 'SupplierPrice', key: 'supplierPrice', width: 15 },
      { header: 'CustomerPoNo', key: 'customerPoNo', width: 15 },
      { header: 'CustomerSoNo', key: 'customerSoNo', width: 15 },
      { header: 'CustomerName', key: 'customerName', width: 30 },
      { header: 'SellingPrice', key: 'sellingPrice', width: 15 },
      { header: 'SalesPerson', key: 'salesPerson', width: 20 },
      { header: 'KAM', key: 'kam', width: 20 },
      { header: 'ManagerName', key: 'managerName', width: 20 },
      { header: 'AccountantName', key: 'accountantName', width: 20 },
      { header: 'AddedBy', key: 'addedBy', width: 20 },
      { header: 'BankSlip', key: 'bankSlip', width: 50 },
      { header: 'URL', key: 'url', width: 50 },
      { header: 'CreatedAt', key: 'createdAt', width: 20 }
    ];
  };

  if (!Array.isArray(jsonData)) {
    // If it's a single object, convert it to an array
    jsonData = [jsonData];
  }
  console.log(jsonData);

  // Check if the file exists in S3
  const paramsCheckFile = {
    Bucket: bucketName,
    Key: fileName
  };

  try {
    // Attempt to fetch the file from S3
    const fileData = await s3.getObject(paramsCheckFile).promise();
    console.log('File exists in S3. Loading data to append...');

    // Load existing workbook from S3 data
    await workbook.xlsx.load(fileData.Body);
    worksheet = workbook.getWorksheet('Payment Data');

    if (!worksheet) {
      worksheet = workbook.addWorksheet('Payment Data');
      setUpWorksheet();
    }

  } catch (err) {
    if (err.code === 'NoSuchKey') {
      // If file doesn't exist, create a new workbook and worksheet
      console.log('File does not exist in S3. Creating a new file...');
      worksheet = workbook.addWorksheet('Payment Data');
      setUpWorksheet();
    } else {
      console.error('Error fetching file from S3:', err);
      return res.status(500).send('Error fetching file from S3');
    }
  }

  // Add the row data and set hyperlinks for the URL field
  jsonData.forEach((item) => {
    const rowData = {
      entryNo: item.EntryNo,
      purpose: item.Purpose,
      supplierName: item.SupplierName,
      supplierPONo: item.SupplierPONo,
      supplierSoNo: item.SupplierSONo,
      supplierPrice: item.SupplierPrice,
      customerPoNo: item.CustomerPoNo,
      customerSoNo: item.CustomerSoNo,
      customerName: item.CustomerName,
      sellingPrice: item.SellingPrice,
      salesPerson: item.SalesPerson,
      kam: item.KAM,
      managerName: item.ManagerName,
      accountantName: item.AccountantName,
      addedBy: item.AddedBy,
      bankSlip: item.BankSlip,
      createdAt: item.CreatedAt,
    };

    // For the URL field, set the hyperlink
    if (item.url && Array.isArray(item.url)) {
      const hyperlinks = item.url.map(urlObj => ({
        text: 'Click here',
        hyperlink: `https://your-domain.com/${urlObj.url}` // Adjust to your actual domain
      })).join(', '); // Combine all hyperlinks into a string

      rowData.url = hyperlinks;
    }

    worksheet.addRow(rowData);
  });

  // Create the Excel file buffer
  const excelBuffer = await workbook.xlsx.writeBuffer();

  // Upload the updated file to S3
  const paramsUpload = {
    Bucket: bucketName,
    Key: fileName,
    Body: excelBuffer,
    ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ACL: 'public-read'
  };

  try {
    await s3.upload(paramsUpload).promise();
    console.log(`File updated successfully at ${paramsUpload.Key}`);
    return res.send(`File updated successfully at ${paramsUpload.Key}`);
  } catch (err) {
    console.error('Error uploading updated file to S3:', err);
    return res.status(500).send('Error uploading updated file to S3');
  }
});


module.exports = router;