const express = require('express');
const router = express.Router();
const upload = require('../../utils/multer'); // Import the configured multer instance
const PerformaInvoice = require('../models/performaInvoice');
const authenticateToken = require('../../middleware/authorization');
const s3 = require('../../utils/s3bucket');
const sequelize = require('../../utils/db');
const xlsx = require('xlsx');

router.post('/fileupload', upload.single('file'), authenticateToken, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ message: 'No file uploaded' });
    }
    const sanitizedFileName = req.body.name || req.file.originalname.replace(/[^a-zA-Z0-9]/g, '_');

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

    res.status(200).send({
      message: 'File uploaded successfully',
      file: req.file,
      fileUrl: key // S3 URL of the uploaded file
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});
// router.post('/fileupload', upload.single('file'), authenticateToken, async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).send({ message: 'No file uploaded' });
//     }

//     const sanitizedFileName = req.body.name || req.file.originalname.replace(/[^a-zA-Z0-9]/g, '_');
//     const key = `invoices/${Date.now()}_${sanitizedFileName}`;

//     // Initialize multipart upload
//     const createParams = {
//       Bucket: process.env.AWS_BUCKET_NAME,
//       Key: key,
//       ContentType: req.file.mimetype,
//       ACL: 'public-read'
//     };
//     const multipartUpload = await s3.createMultipartUpload(createParams).promise();
//     const uploadId = multipartUpload.UploadId;
    
//     const partSize = 5 * 1024 * 1024; // 5MB per part
//     const parts = [];
//     let partNumber = 1;

//     // Split the file into parts and upload each part
//     for (let start = 0; start < req.file.buffer.length; start += partSize) {
//       const end = Math.min(start + partSize, req.file.buffer.length);
//       const partParams = {
//         Bucket: process.env.AWS_BUCKET_NAME,
//         Key: key,
//         PartNumber: partNumber,
//         UploadId: uploadId,
//         Body: req.file.buffer.slice(start, end),
//       };

//       const uploadPart = await s3.uploadPart(partParams).promise();
//       parts.push({ ETag: uploadPart.ETag, PartNumber: partNumber });
//       partNumber++;
//     }

//     // Complete multipart upload
//     const completeParams = {
//       Bucket: process.env.AWS_BUCKET_NAME,
//       Key: key,
//       UploadId: uploadId,
//       MultipartUpload: { Parts: parts },
//     };
//     const data = await s3.completeMultipartUpload(completeParams).promise();

//     const fileUrl = data.Location || '';
//     const fileKey = fileUrl.replace(`https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`, '');

//     res.status(200).send({
//       message: 'File uploaded successfully',
//       file: req.file,
//       fileUrl: fileKey,
//     });
//   } catch (error) {
//     res.send({ message: error.message });
//   }
// });

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
    res.send({ message: error.message });
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


      // Append new data
      const updatedData = [...existingData, ...dataToAppend];
      console.log(updatedData, "updatedupdated");
      
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
      console.log(`File updated successfully at ${paramsUpload.Key}`);
      
      return res.status(200).send({ message: 'Excel file saved successfully.' });

  } catch (err) {
    // Log the full error details for internal debugging
    console.error('Error while processing Excel upload:', err);
    
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
        } catch (uploadErr) {
            // Log the error details for internal use
            console.error('Error creating new file and uploading to S3:', uploadErr);
            return res.status(500).send('An error occurred while creating a new file.');
        }
    } else {
        // Log other unexpected errors
        console.error('Error checking or uploading to S3:', err);
        return res.status(500).send('An error occurred while uploading the file.');
    }
  }
});

router.post('/mergeExcelFiles', async (req, res) => {
    const { startDate, endDate } = req.body;
    const bucketName = process.env.AWS_BUCKET_NAME;
    const prefix = 'PaymentExcel/';

    try {
        const listObjects = await s3.listObjectsV2({ Bucket: bucketName, Prefix: prefix }).promise();
        const filteredKeys = listObjects.Contents
            .filter(obj => {
                const fileDate = new Date(obj.Key.split('/')[1].replace('.xlsx', ''));
                return fileDate >= new Date(startDate) && fileDate <= new Date(endDate);
            })
            .map(obj => obj.Key);

        let mergedData = [];

        for (const key of filteredKeys) {
            const fileData = await s3.getObject({ Bucket: bucketName, Key: key }).promise();
            const workbook = xlsx.read(fileData.Body, { type: 'buffer' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const sheetData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
            
            mergedData = mergedData.length ? mergedData.concat(sheetData.slice(1)) : sheetData;
        }

        const newWorkbook = xlsx.utils.book_new();
        const newWorksheet = xlsx.utils.aoa_to_sheet(mergedData);
        xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, 'MergedData');

        const mergedExcel = xlsx.write(newWorkbook, { bookType: 'xlsx', type: 'buffer' });

        const mergedFileName = `MergedExcel/${startDate}_to_${endDate}.xlsx`;
        const uploadParams = {
            Bucket: bucketName,
            Key: mergedFileName,
            Body: mergedExcel,
            ContentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ACL: 'public-read'
        };

        await s3.upload(uploadParams).promise();

        return res.status(200).send({ message: 'Excel files merged and saved successfully.' });
    } catch (error) {
        console.error('Error merging Excel files:', error);
        return res.status(500).send('An error occurred while merging the Excel files.');
    }
});


module.exports = router;