const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const UserAccount = require('../models/userAccount');
const UserPosition = require('../models/userPosition');

router.post('/add', authenticateToken, async (req, res) => {
  const { userId, division, costCentre, grade, designation, location, department, office, salary }  = req.body;
  try {
    try {
      const userExist = await UserPosition.findOne({
        where: { userId: userId}
      });
      if (userExist) {
        return res.send("Position details has already been added for the given user");
      }
    } catch (error) {
      res.send(error.message)
    } 
    
    const user = new UserPosition({ userId, division, costCentre, grade, designation, location, department, office, salary });
    await user.save();
    
    res.send(user);
  } catch (error) {
    res.send(error.message);
  }
})

module.exports = router;