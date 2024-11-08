/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require("express");
const router = express.Router();
const ExcelLog = require('../models/excelLog');
const s3 = require('../../utils/s3bucket');

router.get("/find", async (req, res) => {
  try {
    const el = await ExcelLog.findAll({ 
      where: {type: "Proforma"},
      order: [['id', 'DESC']],
    });
    res.send(el);
  } catch (error) {
    res.send({ error: error.message });
  }
})

router.get("/findexpenses", async (req, res) => {
  try {
    const el = await ExcelLog.findAll({ 
      where: {type: "Expense"},
      order: [['id', 'DESC']],
    });
    res.send(el);
  } catch (error) {
    res.send({ error: error.message });
  }
})
  router.delete('/delete-excel/:id', async (req, res) => {
    const bucketName = process.env.AWS_BUCKET_NAME;
  
    try {
      const log = await ExcelLog.findByPk(req.params.id);
      
      if (!log) {
        return res.send('Log entry not found');
      }
      
      const fileName = log.fileName;
  
      const paramsDelete = {
        Bucket: bucketName,
        Key: fileName,
      };
      await s3.deleteObject(paramsDelete).promise();
  
      await log.destroy();
  
      res.send({ message: 'File and log entry deleted successfully', name: fileName });
    } catch (error) {
      res.send({ message: 'Failed to delete file or log entry', error: error.message });
    }
  });
  
  
  

module.exports = router;