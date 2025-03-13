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
const LeaveType = require('../../leave/models/leaveType');
const UserLeave = require('../../leave/models/userLeave');
const Role = require('../models/role');

router.post('/add', authenticateToken, async (req, res) => {
  const { userId, division, costCentre, grade, location, department, office, salary, probationPeriod, confirmationDate,
    officialMailId, projectMailId, designationId, teamId }  = req.body;
  try {
    if(probationPeriod === 0){
      let result = await User.findByPk(userId);
      if (!result) {
          return res.send("Employee not found");
      }

      result.isTemporary = false;
      await result.save();

      const leaveTypes = await LeaveType.findAll({});
      const sl = leaveTypes.find(x => x.leaveTypeName === 'Sick Leave');
      const cl = leaveTypes.find(x => x.leaveTypeName === 'Casual Leave');
      const slId = sl ? sl.id : null;
      const clId = cl ? cl.id : null;
      
      let data = [
        {userId: userId, leaveTypeId: slId, noOfDays : 1, leaveBalance : 1},
        {userId: userId, leaveTypeId: clId, noOfDays : 1, leaveBalance : 1},
      ]
      for(let i = 0; i < data.length; i++){
        UserLeave.bulkCreate([data[i]]);
      }
    }
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
    let userSaved = await User.findByPk(userId)
    if(roleId != null || roleId === ''){
      try {
        userSaved.roleId = roleId;
        await userSaved.save();
      } catch (error) {
        res.send(error.message)
      }
    }

    const user = new UserPosition({ userId, division, costCentre, grade, location, department, office, salary, confirmationDate,
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
  const { division, costCentre, grade, teamId, location, department, office, salary, probationPeriod, projectMailId,
    designationId, confirmationDate, officialMailId } = req.body
  try {
    
    let result = await UserPosition.findByPk(req.params.id);
    if(result.probationPeriod !== 0 && probationPeriod === 0)
      {
      let user = await User.findByPk(result.userId);
      if (!user) {
          return res.send("Employee not found");
      }
      user.isTemporary = false;
      await user.save();

      const leaveTypes = await LeaveType.findAll({});
      const sl = leaveTypes.find(x => x.leaveTypeName === 'Sick Leave');
      const cl = leaveTypes.find(x => x.leaveTypeName === 'Casual Leave');
      const slId = sl ? sl.id : null;
      const clId = cl ? cl.id : null;
      
      let data = [
        {userId: result.userId, leaveTypeId: slId, noOfDays : 1, leaveBalance : 1},
        {userId: result.userId, leaveTypeId: clId, noOfDays : 1, leaveBalance : 1},
      ]
      for(let i = 0; i < data.length; i++){
        UserLeave.bulkCreate([data[i]]);
      }
    }
    const desi = await Designation.findByPk(req.body.designationId);
    const roleId = desi?.roleId;
    // if(desi.designationName === 'MANAGING DIRECTOR'){
    //   let user = await User.findByPk(result.userId)
    //   user.director = true;
    //   await user.save();
    // }else{
    //   let user = await User.findByPk(result.userId)
    //   user.director = false;
    //   await user.save();
    // }

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
    result.confirmationDate = confirmationDate;
    result.officialMailId = officialMailId;

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
      const userposition = await UserPosition.findAll({});

      res.send(userposition);
  } catch (error) {
      res.send(error.message)
  }
})

router.patch('/updaterole/:id', async (req, res) => {
  try {
    const desi = await Designation.findByPk(req.body.designationId);
    let roleId = desi?.roleId;
    
    if(roleId === null || roleId === ''){
      const employeeRole = await Role.findOne({ where: { roleName: 'Employee' } });
      if (employeeRole) {
        roleId = employeeRole.id;
      } else {
        throw new Error('Role "employee" not found');
      }
    }
    let user
    try {
      user = await User.findByPk(req.params.id)
      user.roleId = roleId;
      await user.save();
    } catch (error) {
      res.send(error.message)
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

    // if(desi.designationName === 'MANAGING DIRECTOR'){
    //   user.director = true;
    //   await user.save();
    // }else{
    //   user.director = false;
    //   await user.save();
    // }
    res.send(userposition);
  } catch (error) {
      res.send(error.message)
  }

})
module.exports = router;