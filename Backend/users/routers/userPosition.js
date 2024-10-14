const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const UserAccount = require('../models/userAccount');
const UserPosition = require('../models/userPosition');

router.post('/add', authenticateToken, async (req, res) => {
  const { userId, division, costCentre, grade, designation, location, department, office, salary, probationPeriod, officialMailId }  = req.body;
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
    
    const user = new UserPosition({ userId, division, costCentre, grade, designation, location, department, office, salary, 
      probationPeriod, officialMailId });
    await user.save();
    
    res.send(user);
  } catch (error) {
    res.send(error.message);
  }
})

router.get('/findbyuser/:id', authenticateToken, async (req, res) => {
  try {
    const user = await UserPosition.findOne({where: {userId: req.params.id}})

    res.send(user)
  } catch (error) {
    res.send(error.message);
  }
});

router.patch('/update/:id', async(req,res)=>{
  const { division, costCentre, grade, designation, location, department, office, salary, probationPeriod } = req.body
  try {
    let result = await UserPosition.findByPk(req.params.id);
    result.division = division;
    result.costCentre = costCentre;
    result.grade = grade;
    result.designation = designation;
    result.location = location;
    result.department = department;
    result.office = office;
    result.salary = salary;
    result.probationPeriod = probationPeriod;

    await result.save();
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
})

module.exports = router;