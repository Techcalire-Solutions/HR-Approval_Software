const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const UserAccount = require('../models/userAccount');

router.post('/add', authenticateToken, async (req, res) => {
  const { userId, accountNo, ifseCode, paymentFrequency, modeOfPayment }  = req.body;
  try {
    try {
      const userExist = await UserAccount.findOne({
        where: { accountNo: accountNo}
      });
      if (userExist) {
        return res.send("The provided bank account has already been added.");
      }
    } catch (error) {
      res.send(error.message)
    } 

    try {
        const us = await UserAccount.findOne({
          where: { userId: userId}
        });
        if (us) {
          return res.send("Account details has already been added for the given user");
        }
    } catch (error) {
        res.send(error.message)
    } 
    
    const user = new UserAccount({ userId, accountNo, ifseCode, paymentFrequency, modeOfPayment });
    await user.save();
    
    res.send(user);
  } catch (error) {
    res.send(error.message);
  }
})

module.exports = router;