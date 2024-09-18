const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const LeaveType = require('../models/leaveType');


router.post('/', authenticateToken, async (req, res) => {
  try {
    const { leaveTypeName } = req.body;


    if (!leaveTypeName) {
      return res.send({ message: 'Leave type name is required' });
    }

    const existingLeaveType = await LeaveType.findOne({ where: { leaveTypeName } });

    if (existingLeaveType) {
      return res.send({ message: 'Leave type already exists' });
    }


    const leaveType = new LeaveType({ leaveTypeName });
    await leaveType.save();
    res.send(leaveType);

  } catch (error) {
    res.send({ message: error.message });
  }
});


router.get('/', authenticateToken, async (req, res) => {
  try {
    const leaveTypes = await LeaveType.findAll({});
    res.status(200).send(leaveTypes);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

module.exports = router;
