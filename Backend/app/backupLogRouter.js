/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authorization');
const BackUpLog = require('./backupLog');

router.get('/find', authenticateToken, async (req, res) => {
    try {
      const leaveTypes = await BackUpLog.findAll();
      res.status(200).send(leaveTypes);
    } catch (error) {
      res.send(error.message);
    }
});



module.exports = router;