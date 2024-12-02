/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const UserPosition = require('../models/userPosition');
const User = require('../models/user');
const Designation = require('../models/designation');
const Team = require('../models/team');
const TeamMember = require('../models/teamMember');

router.post('/add', authenticateToken, async (req, res) => {
  const { userId, division, costCentre, grade, location, department, office, salary, probationPeriod, 
    officialMailId, projectMailId, designationId, teamId }  = req.body;
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

    const desi = await Designation.findByPk(designationId);
    const roleId = desi?.roleId;
    // if(designationName === 'SENIOR SALES ASSOCIATE' || designationName === 'SALES ASSOCIATE'){
    //   const role = await Role.findOne({ where: {roleName: 'Sales Executive'}})
    //   roleId = role.id;
    // }else if(designationName === 'KEY ACCOUNT MANAGER'){
    //   const role = await Role.findOne({ where: {roleName: 'Key Account Manager'}})
    //   roleId = role.id;
    // }else if(designationName === 'FINANCE MANAGER' || designationName === 'ACCOUNTS EXECUTIVE'){
    //   const role = await Role.findOne({ where: {roleName: 'Accountant'}})
    //   roleId = role.id;
    // }else if(designationName === 'MANAGING DIRECTOR'){
    //   const role = await Role.findOne({ where: {roleName: 'Manager'}})
    //   roleId = role.id;
    // }
    
    if(roleId != null || roleId === ''){
      try {
        let user = await User.findByPk(userId)
        user.roleId = roleId;
        await user.save();
      } catch (error) {
        res.send(error.message)
      }
    }

        
    const user = new UserPosition({ userId, division, costCentre, grade, location, department, office, salary, 
      probationPeriod, officialMailId, projectMailId, designationId, teamId });
    await user.save();
    

    if (teamId!=null){
      const team = await Team.findOne({ where: { id: teamId } });

      if (!team) {
        return res.send('Team not found');
      }

      const teamMember = await TeamMember.create({
        teamId: team.id,
        userId: userId
      });
    } 
    res.send(user);

  } catch (error) {
    res.send(error.message);
  }
})

router.get('/findbyuser/:id', authenticateToken, async (req, res) => {
  try {
    const user = await UserPosition.findOne({where: {userId: req.params.id},
      include:[
        { model : User, attributes : ['name'] },
        { model : Designation, attributes : ['designationName']},
        { model : Team, attributes : ['teamName']}
      ]
    })

    res.send(user)
  } catch (error) {
    res.send(error.message);
  }
});

router.patch('/update/:id', async(req,res)=>{
  const { division, costCentre, grade, teamId, location, department, office, salary, probationPeriod, projectMailId, designationId } = req.body
  try {
    
    let result = await UserPosition.findByPk(req.params.id);
    const desi = await Designation.findByPk(req.body.designationId);
    const roleId = desi?.roleId;
    
    if(roleId != null || roleId === ''){
      try {
        let user = await User.findByPk(result.userId)
        user.roleId = roleId;
        await user.save();
      } catch (error) {
        res.send(error.message)
      }
    }
    result.division = division;
    result.costCentre = costCentre;
    result.grade = grade;
    result.designationId = designationId;
    result.location = location;
    result.department = department;
    result.office = office;
    result.salary = salary;
    result.probationPeriod = probationPeriod;
    result.projectMailId = projectMailId;
    result.teamId = teamId;

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

router.patch('/updaterole/:id', async (req, res) => {
  try {
    // if(req.body.designationName === 'SENIOR SALES ASSOCIATE' || req.body.designationName === 'SALES ASSOCIATE'){
    //   const role = await Role.findOne({ where: {roleName: 'Sales Executive'}})
    //   roleId = role.id;
    // }else if(req.body.designationName === 'KEY ACCOUNT MANAGER'){
    //   const role = await Role.findOne({ where: {roleName: 'Key Account Manager'}})
    //   roleId = role.id;
    // }else if(req.body.designationName === 'FINANCE MANAGER' || req.body.designationName === 'ACCOUNTS EXECUTIVE'){
    //   const role = await Role.findOne({ where: {roleName: 'Accountant'}})
    //   roleId = role.id;
    // }else if(req.body.designationName === 'MANAGING DIRECTOR'){
    //   const role = await Role.findOne({ where: {roleName: 'Manager'}})
    //   roleId = role.id;
    // }
    const desi = await Designation.findByPk(req.body.designationId);
    const roleId = desi?.roleId;

    if(roleId != null || roleId === ''){
      try {
        let user = await User.findByPk(req.params.id)
        user.roleId = roleId;
        await user.save();
      } catch (error) {
        res.send(error.message)
      }
    }
      
      let userposition = await UserPosition.findOne({
        where: {userId: req.params.id}
      });
      
      if(userposition){
        userposition.designationId = req.body.designationId;
        await userposition.save();
      }else{
        userposition = new UserPosition({userId: req.params.id, designationId: req.body.designationId});
        await userposition.save();
      }

      res.send(userposition);
  } catch (error) {
      res.send(error.message)
  }

})
module.exports = router;