const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const UserAccount = require('../models/userAccount');
const UserPosition = require('../models/userPosition');
const User = require('../models/user')

router.post('/add', authenticateToken, async (req, res) => {
  const { userId, division, costCentre, grade, designation, location, department, office, salary, probationPeriod, 
    officialMailId, projectMailId }  = req.body;
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
      probationPeriod, officialMailId, projectMailId });
    await user.save();
    
    res.send(user);
  } catch (error) {
    res.send(error.message);
  }
})

router.get('/findbyuser/:id', authenticateToken, async (req, res) => {
  try {
    const user = await UserPosition.findOne({where: {userId: req.params.id},
    include:[{
      model :User,
      attributes : ['name']
    }
    ]})

    res.send(user)
  } catch (error) {
    res.send(error.message);
  }
});

router.patch('/update/:id', async(req,res)=>{
  const { division, costCentre, grade, designation, location, department, office, salary, probationPeriod, projectMailId } = req.body
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
    result.projectMailId = projectMailId;

    await result.save();
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
})

router.delete('/delete/:id', authenticateToken, async (req, res) => {
  const id = req.params.id
  try {
    const userposition = await UserPosition.findByPk(id)

    const result = await userposition.destroy({
      force: true
    });
    if (result === 0) {
      return res.status(404).json({
        status: "fail",
        message: "userposition with that ID not found",
      });
    }

    res.status(204).json();
  } catch (error) {
    res.send(error.message)
  }
})

router.get('/', async (req, res) => {
  try {
      const userposition = await UserPosition.findAll({
         
      });

      res.send(userposition);


  } catch (error) {
      res.send(error.message)
  }

})

module.exports = router;