const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const UserLeave = require('../models/userLeave');
const User = require('../../users/models/user');
const { Op } = require('sequelize');
const cron = require('node-cron');
const moment = require('moment');
// Route to create user leave mapping
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

// Route to get all user leave mappings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userLeaves = await UserLeave.findAll({});
    res.send(userLeaves);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});


// Route to manually trigger leave accumulation
// Schedule the leave accumulation job to run on the 1st of every month at 00:00
router.patch('/accumulate', authenticateToken, async (req, res) => {
  try {
    console.log('Running leave accumulation job');

    const CASUAL_LEAVE_TYPE_ID = 1;
    const SICK_LEAVE_TYPE_ID = 1;

    // Fetch all user leave records
    const userLeaves = await UserLeave.findAll();

    for (const userLeave of userLeaves) {
      // For both Casual and Sick leave types
      if (userLeave.leaveTypeId === CASUAL_LEAVE_TYPE_ID || userLeave.leaveTypeId === SICK_LEAVE_TYPE_ID) {
        // Accumulate leave based on leave type
        userLeave.leaveBalance += userLeave.noOfDays;  // Add noOfDays to the leave balance

        if (userLeave.takenLeaves === 0) {
          userLeave.noOfDays += 1;  // Carry forward 1 day if no leaves were taken
        }
        
        // Reset taken leaves for the new month
        userLeave.takenLeaves = 0;

        // Save the updated leave record
        await userLeave.save();
        console.log(`Updated leave for user: ${userLeave.userId}, Leave Type: ${userLeave.leaveTypeId}`);
      }
    }

    console.log('Leave accumulation job completed');
    res.send({ message: 'Leave accumulation job completed' });
  } catch (error) {
    console.error('Error during leave accumulation:', error);
    res.status(500).send({ error: 'Error during leave accumulation' });
  }
});


router.patch('/accumulateTest', authenticateToken, async (req, res) => {
  try {
   
    cron.schedule('0 0 1 * *', async () => {
      try {
        console.log('Running leave accumulation job');

        const CASUAL_LEAVE_TYPE_ID = 1; 
        const SICK_LEAVE_TYPE_ID = 1;   


        const userLeaves = await UserLeave.findAll();


        const currentMonth = moment().format('MM');

        for (const userLeave of userLeaves) {
     
          if (userLeave.leaveTypeId === CASUAL_LEAVE_TYPE_ID || userLeave.leaveTypeId === SICK_LEAVE_TYPE_ID) {

            userLeave.leaveBalance += userLeave.noOfDays;


            if (userLeave.takenLeaves === 0) {
              userLeave.noOfDays += 1; 
            }


            userLeave.takenLeaves = 0;


            await userLeave.save();
            console.log(`Updated leave for user: ${userLeave.userId}, Leave Type: ${userLeave.leaveTypeId}`);
          }
        }

        console.log('Leave accumulation job completed');
      } catch (error) {
        console.error('Error during leave accumulation:', error);
      }
    }, {
      scheduled: true,
      timezone: "America/New_York" // Adjust timezone if needed
    });

    // Send a response immediately
    res.send({ message: 'Leave accumulation job scheduled' });
  } catch (error) {
    console.error('Error scheduling leave accumulation:', error);
    res.status(500).send({ error: 'Error scheduling leave accumulation' });
  }
});


module.exports = router;
