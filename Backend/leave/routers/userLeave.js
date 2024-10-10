const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const UserLeave = require('../models/userLeave');

const cron = require('node-cron');

const LeaveType = require('../models/leaveType')



// -----------------------------Leave Accumulation function-----------------------------------------------

cron.schedule('0 0 1 * *', async () => {
  try {
    // Fetch all leave types (for SL, CL)
    const leaveTypes = await LeaveType.findAll({
      where: {
        leaveTypeName: ['Sick Leave', 'Casual Leave']
      }
    });

    if (leaveTypes.length === 0) {
      console.log('No leave types found for Sick Leave or Casual Leave.');
      return;
    }

    // Fetch all user leave records for SL and CL types
    for (const leaveType of leaveTypes) {
      const userLeaves = await UserLeave.findAll({
        where: { leaveTypeId: leaveType.id }
      });

      if (userLeaves.length === 0) {
        console.log(`No user leave records found for ${leaveType.leaveTypeName}.`);
        continue; // Skip to the next leave type if no user records are found
      }

      // Increment noOfDays by 1 and update leaveBalance
      for (const userLeave of userLeaves) {
        userLeave.noOfDays += 1; // Increment noOfDays by 1
        userLeave.leaveBalance = userLeave.noOfDays - userLeave.takenLeaves; // Update leaveBalance

        // Log the update for debugging purposes
        console.log(`Updating leave for User ID ${userLeave.userId}, Leave Type: ${leaveType.leaveTypeName}`);
        console.log(`Old Balance: ${userLeave.leaveBalance}, New Balance: ${userLeave.leaveBalance}`);

        // Save the updated record
        await userLeave.save();
      }
    }

    console.log('User leave balances updated successfully at the start of the month.');
  } catch (error) {
    console.error('Error updating leave balances:', error.message);
  }
});

router.get('/leavecount/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch user leaves with associated leave types
    const userLeaves = await UserLeave.findAll({
      where: { userId },
      include: [
        {
          model: LeaveType,
          as: 'leaveType',
          attributes: ['leaveTypeName', 'id'],
        },
      ],
    });

    // Debugging: log the fetched user leaves
    console.log('Fetched User Leaves:', JSON.stringify(userLeaves, null, 2));

    if (!userLeaves.length) {
      return res.status(404).json({ message: 'No leave records found for this user.' });
    }

    // Prepare the leaveCounts by returning only the relevant fields
    const leaveCounts = userLeaves.map((userLeave) => {
      console.log(`Leave Count for User ID ${userLeave.userId}:`, {
        noOfDays: userLeave.noOfDays,
        takenLeaves: userLeave.takenLeaves,
        leaveBalance: userLeave.leaveBalance,
      });

      return {
        userId: userLeave.userId,
        leaveTypeId: userLeave.leaveTypeId,
        leaveTypeName: userLeave.leaveType.leaveTypeName,
        noOfDays: userLeave.noOfDays,
        takenLeaves: userLeave.takenLeaves,
        leaveBalance: userLeave.leaveBalance,
      };
    });

    // Debugging: log the leave counts
    console.log('Leave Counts:', JSON.stringify(leaveCounts, null, 2));

    res.json({
      leaveCounts,
    });

  } catch (error) {
    console.error('Error fetching leave counts:', error.message);
    res.status(500).json({ message: 'Error fetching leave counts', error: error.message });
  }
});

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

router.get('/byuserandtype/:userid/:typeid', authenticateToken, async (req, res) => {
  try {
    const userLeaves = await UserLeave.findOne({
      where: { userId : req.params.userid, leaveTypeId: req.params.typeid}
    });
    res.send(userLeaves);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

router.get('/byuser/:userid', authenticateToken, async (req, res) => {
  try {
    const userLeaves = await UserLeave.findAll({
      where: { userId : req.params.userid},
      include: [{model: LeaveType}]
    });
    res.send(userLeaves);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});



router.patch('/update', authenticateToken, async (req, res) => {
  let  data  = req.body;
  try {
    let updated = [];
    for( let i = 0; i < data.length; i++ ){
      let ulExist = await UserLeave.findOne({
        where: { userId: data[i].userId, leaveTypeId: data[i].leaveTypeId }
      })
      if(ulExist){
        ulExist.noOfDays  = +data[i].noOfDays;
        ulExist.takenLeaves = +data[i].takenLeaves;
        ulExist.leaveBalance = +data[i].leaveBalance;

        await ulExist.save();
        updated.push(ulExist);
      }else{
        let userLeave = new UserLeave({
          userId: data[i].userId,
          leaveTypeId: data[i].leaveTypeId,
          noOfDays: +data[i].noOfDays,
          takenLeaves: +data[i].takenLeaves,
          leaveBalance: +data[i].leaveBalance
        })
        await userLeave.save();
        updated.push(userLeave);
      }
    }
    res.send(updated);
  } catch (error) {
    res.send(error.message)
  }
})


module.exports = router;
