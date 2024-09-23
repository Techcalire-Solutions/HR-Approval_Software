const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const StatutoryInfo = require('../models/statutoryInfo');
const {Op} = require('sequelize');

router.post('/add', authenticateToken, async (req, res) => {
  const { userId, adharNo, panNumber, esiNumber, uanNumber }  = req.body;
  try {
    try {
      const userExist = await StatutoryInfo.findOne({
        where: {
            [Op.or]: [ { adharNo: adharNo }, { panNumber: panNumber }, { esiNumber: esiNumber }, { uanNumber: uanNumber } ]
          }
      });
      if (userExist) {
        return res.send( "User with given statutory information already exists" )  
      }
    } catch (error) {
      res.send(error.message)
    } 

    try {
        const us = await StatutoryInfo.findOne({
          where: { userId: userId}
        });
        if (us) {
            return res.send("Statutory information has already been added for this user.");
        }
    } catch (error) {
        res.send(error.message)
    } 
    
    const user = new StatutoryInfo({userId, adharNo, panNumber, esiNumber, uanNumber });
    await user.save();
    
    res.send(user);
  } catch (error) {
    res.send(error.message);
  }
})

module.exports = router;