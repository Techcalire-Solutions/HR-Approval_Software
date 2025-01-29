const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const UserLeave = require('../models/userLeave');
const User = require('../../users/models/user');

const cron = require('node-cron');

const LeaveType = require('../models/leaveType');
const { where } = require('sequelize');



// -----------------------------Leave Accumulation function-----------------------------------------------

cron.schedule('0 0 1 * *', async () => {
  try {
    // Fetch all leave types for Sick Leave and Casual Leave
    const leaveTypes = await LeaveType.findAll({
      where: {
        leaveTypeName: ['Sick Leave', 'Casual Leave']
      }
    });

    if (leaveTypes.length === 0) {
      return;
    }

    // Iterate through each leave type (SL and CL)
    for (const leaveType of leaveTypes) {
      const userLeaves = await UserLeave.findAll({
        where: { leaveTypeId: leaveType.id }
      });

      if (userLeaves.length === 0) {
        continue; // Skip if no user leave records are found
      }

      // Update leave balance and increment noOfDays for each user
      for (const userLeave of userLeaves) {
        // Increment noOfDays by 1 (if leaveBalance is positive)
        const newNoOfDays = userLeave.noOfDays + 1;

        // Ensure leaveBalance doesn't go negative
        const newLeaveBalance = Math.max(newNoOfDays - userLeave.takenLeaves, 0);

        // Update user leave record
        userLeave.noOfDays = newNoOfDays;
        userLeave.leaveBalance = newLeaveBalance;
        await userLeave.save();
      }
    }
  } catch (error) {
    console.error('Error updating leave balances:', error.message);
  }
});


router.get('/leavecount/:userId/:typeid', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    const leaveTypeId  = req.params.typeid;

    const userLeaves = await UserLeave.findOne({
      where: { userId, leaveTypeId  },
      include: {
        model: LeaveType,
        as: 'leaveType',
        attributes: ['leaveTypeName', 'id'],
      },
    });

    
    // if (!userLeaves.length) {
    //   return res.json({
    //     userLeaves: [
    //       {
    //         id: null,
    //         userId: userId,
    //         leaveTypeId: 3, 
    //         noOfDays: 0,
    //         takenLeaves: 0,
    //         leaveBalance: 0,
    //         leaveType: {
    //           leaveTypeName: "LOP",
    //           id: 3
    //         }
    //       }
    //     ]
    //   });
    // }

 
    // const lopLeaveExists = userLeaves.some(leave => leave.leaveType.leaveTypeName === 'LOP');
    // if (!lopLeaveExists) {
      
    //   userLeaves.push({
    //     id: null,
    //     userId: userId,
    //     leaveTypeId: 3,
    //     noOfDays: 0,
    //     takenLeaves: 0,
    //     leaveBalance: 0,
    //     leaveType: {
    //       leaveTypeName: "LOP",
    //       id: 3
    //     }
    //   });
    // }
    res.send(userLeaves);

  } catch (error) {
    res.send(error.message);
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

router.get('/forencashment', async (req, res) => {
  try {
    const leaveTypes = await LeaveType.findAll({
      where: { leaveTypeName: ['Casual Leave', 'Comb Off'] },
      attributes: ['id', 'leaveTypeName']
    });

    const cl = leaveTypes.find(type => type.leaveTypeName === 'Casual Leave')?.id;
    const co = leaveTypes.find(type => type.leaveTypeName === 'Comb Off')?.id;
    if (!cl || !co) {
      return res.send("Required leave types not found");
    }

    const userLeaves = await UserLeave.findAll({
      where: { leaveTypeId: [cl, co] },
      include: {
        model: User,
        attributes: ['id', 'name'],
      },
      attributes: ['userId', 'leaveTypeId', 'leaveBalance'],
    });
    const encashment = [];
    const userMap = {};

    userLeaves.forEach(leave => {
      const userId = leave.userId;
      if (!userMap[userId]) {
        userMap[userId] = { userId, casualLeave: 0, combOff: 0, totalLeave: 0 };
      }

      if (leave.leaveTypeId === cl) {
        userMap[userId].casualLeave = leave.leaveBalance;
      } else if (leave.leaveTypeId === co) {
        userMap[userId].combOff = leave.leaveBalance;
      }

      userMap[userId].totalLeave =
        (userMap[userId].casualLeave || 0) + (userMap[userId].combOff || 0);
    });

    for (const user of Object.values(userMap)) {
      encashment.push(user);
    }

    res.send(encashment);
  } catch (error) {
    res.send(error.message);
  }
});



module.exports = router;
