/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const upload = require('../../utils/multer'); // Import the configured multer instance
const PerformaInvoice = require('../models/performaInvoice');
const authenticateToken = require('../../middleware/authorization');
const s3 = require('../../utils/s3bucket');
const sequelize = require('../../utils/db');
const xlsx = require('xlsx');
const ExcelJS = require('exceljs');
const ExcelLog = require('../models/excelLog');

router.post('/fileupload', upload.single('file'), authenticateToken, async (req, res) => {
  try {
    if (!req.file) {
      return res.send({ message: 'No file uploaded' });
    }
    const originalFileName = req.file.originalname;
    const fileType = originalFileName.split('.').pop(); // Extracts the file extension
    const sanitizedFileName = (req.body.name || originalFileName.replace(/[^a-zA-Z0-9]/g, '_')).concat(`.${fileType}`);


    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `invoices/${Date.now()}_${sanitizedFileName}`, 
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read' 
    };

    // Upload the file to S3
    const data = await s3.upload(params).promise();

    // Check if data.Location (fileUrl) exists
    const fileUrl = data.Location ? data.Location : '';

    // Replace only if fileUrl is valid
    const key = fileUrl ? fileUrl.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '') : null;

    res.send({
      message: 'File uploaded successfully',
      file: req.file,
      fileUrl: key // S3 URL of the uploaded file
    });
  } catch (error) {
    res.send(error.message)
  }
});

router.post('/bankslipupload', upload.single('file'), authenticateToken, async (req, res) => {
  try {
    if (!req.file) {
      return res.send('No file uploaded' );
    }
    // const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9]/g, '_');

    const fileType = req.file.originalname.split('.').pop();
    const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9]/g, '_').concat(`.${fileType}`);
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
    res.send(error.message );
  }
});

router.delete('/filedelete', authenticateToken, async (req, res) => {
  let id = req.query.id;
  let index = req.query.index;
  let fileKey;
  let t;

  try {
    t = await sequelize.transaction();

    let result = await PerformaInvoice.findByPk(id, { transaction: t });

    if (!result || !result.url || !result.url[index]) {
      return res.send('File or index not found' );
    }

    fileKey = result.url[index].url;
    result.url.splice(index, 1); 

    result.setDataValue('url', result.url);
    result.changed('url', true);

    await result.save({ transaction: t });

    await t.commit();

    result = await PerformaInvoice.findByPk(id);

    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey.replace('https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/', '')
    };

    await s3.deleteObject(deleteParams).promise();

    res.send({ message: 'File deleted successfully' });
  } catch (error) {
    if (t) await t.rollback();

    res.send( error.message );
  }
});

router.delete('/filedeletebyurl', authenticateToken, async (req, res) => {
    key = req.query.key;
    fileKey = key ? key.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '') : null;
    try {
      if (!fileKey) {
        return res.send('No file key provided');
      }

      // Set S3 delete parameters
      const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey
      };

      // Delete the file from S3
      await s3.deleteObject(deleteParams).promise();

      res.send({ message: 'File deleted successfully' });
    } catch (error) {
      res.send(error.message);
    }
});

router.delete('/bsdeletebyurl', authenticateToken, async (req, res) => {
  key = req.query.key;
  fileKey = key ? key.replace(`https://approval-management-data-s3.s3.ap-south-1.amazonaws.com/`, '') : null;
  try {
    if (!fileKey) {
      return res.send('No file key provided');
    }

    // Set S3 delete parameters
    const deleteParams = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileKey
    };

    // Delete the file from S3
    await s3.deleteObject(deleteParams).promise();

    res.send({ message: 'File deleted successfully' });
  } catch (error) {
    res.send(error.message);
  }
});

router.post('/excelupload', async (req, res) => {
  const jsonData = req.body;
  const piNo = jsonData.EntryNo;
  const currentDate = new Date().toISOString().split('T')[0];
  const fileName = `PaymentExcel/${currentDate}.xlsx`; 
  const bucketName = process.env.AWS_BUCKET_NAME;

  const dataToAppend = [Object.values(jsonData)];

  const paramsCheckFile = {
      Bucket: bucketName,
      Key: fileName
  };
  try {
      // Check if the file already exists in S3
      const existingFile = await s3.getObject(paramsCheckFile).promise();
      const existingWorkbook = xlsx.read(existingFile.Body, { type: 'buffer' });

      // Read and update the existing worksheet
      const sheetName = existingWorkbook.SheetNames[0];
      const worksheet = existingWorkbook.Sheets[sheetName];
      const existingData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

      const piNoExists = existingData.some(row => row.includes(piNo)); // Adjust this based on the structure of your Excel rows
      
      if (piNoExists) {
          return res.send({ message: 'The EntrNo already exists in the Excel file.' });
      }

      const updatedData = [...existingData, ...dataToAppend];
      
      const newWorksheet = xlsx.utils.aoa_to_sheet(updatedData);
      existingWorkbook.Sheets[sheetName] = newWorksheet;

      // Write updated workbook to buffer
      const updatedExcel = xlsx.write(existingWorkbook, { bookType: 'xlsx', type: 'buffer' });

      // Upload updated file to S3
      const paramsUpload = {
          Bucket: bucketName,
          Key: fileName,
          Body: updatedExcel,
          ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ACL: 'public-read'
      };

      await s3.upload(paramsUpload).promise();
      return res.status(200).send({ message: 'Excel file saved successfully.' });

  } catch (err) {
    
    if (err.code === 'NoSuchKey') {
        try {
            // Create a new workbook if the file doesn't exist
            const newWorkbook = xlsx.utils.book_new();
            const newWorksheet = xlsx.utils.aoa_to_sheet([Object.keys(jsonData), ...dataToAppend]); // Include headers
            xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, 'Sheet1');

            const newExcel = xlsx.write(newWorkbook, { bookType: 'xlsx', type: 'buffer' });

            // Upload the new file to S3
            const paramsUploadNew = {
                Bucket: bucketName,
                Key: fileName,
                Body: newExcel,
                ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                ACL: 'public-read'
            };

            await s3.upload(paramsUploadNew).promise();
            return res.status(200).send({ message: 'Excel file saved successfully.' });
        } catch (error) {
            return res.send(error.message);
        }
    } else {
        return res.send('An error occurred while uploading the file.');
    }
  }
});

// router.post('/mergeExcelFiles', async (req, res) => {
//     const { startDate, endDate } = req.body;
//     const bucketName = process.env.AWS_BUCKET_NAME;
//     const prefix = 'PaymentExcel/';

//     try {
//         const listObjects = await s3.listObjectsV2({ Bucket: bucketName, Prefix: prefix }).promise();
//         const filteredKeys = listObjects.Contents
//             .filter(obj => {
//                 const fileDate = new Date(obj.Key.split('/')[1].replace('.xlsx', ''));
//                 return fileDate >= new Date(startDate) && fileDate <= new Date(endDate);
//             })
//             .map(obj => obj.Key);

//         let mergedData = [];

//         for (const key of filteredKeys) {
//             const fileData = await s3.getObject({ Bucket: bucketName, Key: key }).promise();
//             const workbook = xlsx.read(fileData.Body, { type: 'buffer' });
//             const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//             const sheetData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
            
//             mergedData = mergedData.length ? mergedData.concat(sheetData.slice(1)) : sheetData;
//         }

//         const newWorkbook = xlsx.utils.book_new();
//         const newWorksheet = xlsx.utils.aoa_to_sheet(mergedData);
//         xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, 'MergedData');

//         const mergedExcel = xlsx.write(newWorkbook, { bookType: 'xlsx', type: 'buffer' });

//         const mergedFileName = `MergedExcel/${startDate}_to_${endDate}.xlsx`;
//         const uploadParams = {
//             Bucket: bucketName,
//             Key: mergedFileName,
//             Body: mergedExcel,
//             ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//             ACL: 'public-read'
//         };

//         await s3.upload(uploadParams).promise();

//         return res.status(200).send({ message: 'Excel files merged and saved successfully.' });
//     } catch (error) {
//         console.error('Error merging Excel files:', error);
//         return res.status(500).send('An error occurred while merging the Excel files.');
//     }
// });

router.post('/download-excel', async (req, res) => {
  const data = req.body.invoices;
  const {invoiceNo, addedBy, status, startDate, endDate} = req.body;
  try {
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('My Data');
    const currentDate = new Date().toISOString().split('T')[0];
    const uniqueIdentifier = Date.now();  
    const fileName = `ExcelReports/Proforma/${currentDate}_${uniqueIdentifier}.xlsx`; 
    const bucketName = process.env.AWS_BUCKET_NAME;

    worksheet.columns = [
      { header: 'PI NO', key: 'piNo', width: 10 },
      { header: 'PO NO', key: 'supplierPoNo', width: 10 },
      { header: 'Supplier', key: 'supplier', width: 20 },
      { header: 'Invoice NO', key: 'supplierSoNo', width: 10 },
      { header: 'Amount', key: 'supplierPrice', width: 10 },
      { header: 'Purpose', key: 'purpose', width: 8 },
      { header: 'Customer', key: 'customer', width: 20 },
      { header: 'CustomerSoNo', key: 'customerSoNo', width: 10 },
      { header: 'CustomerPoNo', key: 'customerPoNo', width: 10 },
      { header: 'Payment Mode', key: 'paymentMode', width: 10 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'AddedBy', key: 'addedBy', width: 15 },
      { header: 'Sales Person', key: 'salesPerson', width: 15 },
      { header: 'KAM', key: 'kamName', width: 15 },
      { header: 'AM', key: 'amName', width: 15 },
      { header: 'Accountant', key: 'accountant', width: 15 },
      { header: 'Created Date', key: 'createdDate', width: 8 },
      { header: 'Updated Date', key: 'updatedDate', width: 8 },
      { header: 'Attachments', key: 'url', width: 80 },
      { header: 'Wire Slip', key: 'bankSlip', width: 50 },
      { header: 'Notes', key: 'notes', width: 50 },
    ];

    data.forEach(item => {
      worksheet.addRow({
        piNo: item.piNo,
        supplierPoNo: item.supplierPoNo,
        supplier: item.suppliers.companyName,
        supplierSoNo: item.supplierSoNo,
        supplierPrice: `${item.poValue} ${item.supplierCurrency}`,
        purpose: item.purpose,
        customer: item.customers?.companyName,
        customerSoNo: item.customerSoNo,
        customerPoNo: item.customerPoNo,
        customerPrice: `${item.customerPrice} ${item.customerCurrency}`,
        paymentMode: item.paymentMode,
        status: item.status,
        addedBy: item.addedBy.name,
        salesPerson: item.salesPerson?.name,
        kamName: item.kam?.name,
        amName: item.am?.name,
        accountant: item.accountant?.name,
        createdDate: item.createdAt,
        updatedDate: item.updatedAt,
        url: item.url ? item.url.map(entry => entry.url).join(', ') : '',
        bankSlip: item.bankSlip,
        notes: item.notes
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const paramsUploadNew = {
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ACL: 'public-read'
    };

    const excelLog = new ExcelLog ({ fromDate: startDate, toDate: endDate, status, userId: addedBy, 
      downloadedDate: currentDate, fileName: fileName, invoiceNo, type: 'Proforma'  });
      await excelLog.save();
    const result = await s3.upload(paramsUploadNew).promise();

    res.send({ message: 'File uploaded successfully', name: fileName, excelLog: excelLog });
  } catch (error) {
    res.send(error.message);
  }
});


module.exports = router;