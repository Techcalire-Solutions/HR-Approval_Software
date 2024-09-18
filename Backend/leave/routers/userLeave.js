const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const UserLeave = require('../models/userLeave');
const User = require('../../users/models/user');
const { Op } = require('sequelize');
const cron = require('node-cron');
const moment = require('moment');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { userId, leaveTypeId, noOfDays, takenLeaves, leaveBalance } = req.body;

    const userLeave = new UserLeave({
      userId,
      leaveTypeId,
      noOfDays,
      takenLeaves,
      leaveBalance,
    });

    await userLeave.save();
    res.send(userLeave);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});


router.get('/', authenticateToken, async (req, res) => {
  try {
    const userLeaves = await UserLeave.findAll({});
    res.send(userLeaves);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});




router.patch('/accumulate', authenticateToken, async (req, res) => {
  try {

    const CASUAL_LEAVE_TYPE_ID = 1;
    const SICK_LEAVE_TYPE_ID = 1;

    const userLeaves = await UserLeave.findAll();

    for (const userLeave of userLeaves) {

      if (userLeave.leaveTypeId === CASUAL_LEAVE_TYPE_ID || userLeave.leaveTypeId === SICK_LEAVE_TYPE_ID) {
    
        userLeave.leaveBalance += userLeave.noOfDays; 

  
        await userLeave.save();
        
      }
    }
    res.send(userLeaves);
  } catch (error) {
    res.status(500).send({ error: 'Error during leave accumulation' });
  }
});



module.exports = router;
