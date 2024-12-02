/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const UserQualification = require('../models/userQualification');

router.post('/save', authenticateToken, async (req, res) => {
    const { userId, qualification, experience } = req.body;
    try {
        const userExists = await UserQualification.findOne({where: {userId: userId}})
        if(userExists){
            return res.send("Qualification already added")
        }
    } catch (error) {
        res.send(error.message)
    }
    try {
        const qual = new UserQualification({userId, qualification, experience });
        await qual.save();
        
        res.send(qual);

    } catch (error) {
        res.send(error.message);
    }
})

router.get('/findbyuser/:id', authenticateToken, async (req, res) => {
    try {
        const qualification = await UserQualification.findOne({where: {userId: req.params.id}});
        res.send(qualification);
    } catch (error) {
        res.send(error.message)
    }
})

router.patch('/update/:id', async(req,res)=>{
    const { qualification, experience } = req.body;
    try {
      let result = await UserQualification.findOne({where: {userId: req.params.id}});
      if(!result){
        res.send("Record not found");
      }
      console.log(result);
      
      result.qualification = qualification
      result.experience = experience;
  
      await result.save();
      console.log(result);
      
      res.send(result);
    } catch (error) {
      res.send(error.message);
    }
})
  

module.exports = router;