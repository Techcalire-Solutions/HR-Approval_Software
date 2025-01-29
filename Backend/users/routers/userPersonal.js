/* eslint-disable no-useless-catch */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const UserPersonal = require('../models/userPersonal');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const sequelize = require('../../utils/db');
const { Op, fn, literal  } = require('sequelize');
const User = require('../models/user');
const UserPosition = require('../models/userPosition')

async function saveDates(dateStrings) {
  try {
    if (!Array.isArray(dateStrings)) {
      dateStrings = [dateStrings]; // Convert to array if it's a single string
    }

    const formattedDates = dateStrings.map(dateString => {
      // Ensure the input is parsed correctly
      const date = new Date(Date.parse(dateString)); // Parse the date string directly
      if (isNaN(date)) {
        throw new Error(`Invalid date format: ${dateString}`);
      }

      // Format as 'YYYY-MM-DD' using UTC normalization
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Month is 0-based
      const day = String(date.getUTCDate()).padStart(2, '0');

      return `${year}-${month}-${day}`; // Return formatted date
    });

    return formattedDates;
  } catch (error) {
    throw error;
  }
}




router.post('/add', authenticateToken, async (req, res) => {
  const { userId, empNo, dateOfJoining, probationPeriod, isTemporary, maritalStatus, dateOfBirth, gender, 
    parentName, spouseName, referredBy, reportingMangerId, bloodGroup, emergencyContactNo, emergencyContactName, 
    emergencyContactRelation, spouseContactNo, parentContactNo, motherName, motherContactNo, temporaryAddress,
    permanentAddress, qualification, experience } = req.body;

  try {
    const existingUser = await UserPersonal.findOne({ where: { userId } });
    if (existingUser) {
      return res.send("Personal details have already been added for the given user");
    }

    let formattedDateOfJoining;
    let formattedDateOfBirth;

    if (dateOfJoining) {
      formattedDateOfJoining = await saveDates(dateOfJoining);
      if (formattedDateOfJoining.length === 0) {
        return res.send("Invalid dateOfJoining format.");
      }
    }

    if (dateOfBirth) {
      formattedDateOfBirth = await saveDates(dateOfBirth);
      if (formattedDateOfBirth.length === 0) {
        return res.send("Invalid dateOfBirth format.");
      }
    }

    const user = new UserPersonal({ 
      userId, empNo, dateOfJoining: dateOfJoining ? formattedDateOfJoining[0] : null, probationPeriod, isTemporary, maritalStatus, 
      dateOfBirth: dateOfBirth ? formattedDateOfBirth[0] : null,  gender,  parentName,  spouseName,  referredBy, 
      reportingMangerId, bloodGroup,  emergencyContactNo, emergencyContactName, emergencyContactRelation, 
      spouseContactNo, parentContactNo, motherName, motherContactNo, temporaryAddress, permanentAddress, qualification, experience
    });

    await user.save();
    res.send(user); 
  } catch (error) {
    res.send(error.message);
  }
});


router.get('/find', authenticateToken, async (req, res) => {
  try {
    const user = await UserPersonal.findAll({})

    res.send(user)
  } catch (error) {
    res.send(error.message);
  }
});

router.get('/findbyuser/:id', authenticateToken, async (req, res) => {
  try {
    const user = await UserPersonal.findOne({
      where: {userId: req.params.id},
      include: {
        model: User,
        as: 'manager',
        attributes: ['name']
      }
    })

    res.send(user)
  } catch (error) {
    res.send(error.message);
  }
});

router.patch('/update/:id', async(req,res)=>{
  const { dateOfJoining, probationPeriod, isTemporary, maritalStatus, dateOfBirth, gender, parentName,
     spouseName, referredBy, reportingMangerId, bloodGroup, emergencyContactNo, emergencyContactName, emergencyContactRelation,
     spouseContactNo, parentContactNo, motherName, motherContactNo, temporaryAddress, permanentAddress, qualification, experience } = req.body
  try {
    let formattedDateOfJoining;
    let formattedDateOfBirth;

    if (dateOfJoining) {
      formattedDateOfJoining = await saveDates(dateOfJoining);
      if (formattedDateOfJoining.length === 0) {
        return res.send("Invalid dateOfJoining format.");
      }
    }

    if (dateOfBirth) {
      formattedDateOfBirth = await saveDates(dateOfBirth);
      if (formattedDateOfBirth.length === 0) {
        return res.send("Invalid dateOfBirth format.");
      }
    }
    
    let result = await UserPersonal.findByPk(req.params.id);
    result.dateOfJoining = dateOfJoining ? formattedDateOfJoining[0] : null;
    result.probationPeriod = probationPeriod;
    result.isTemporary = isTemporary;
    result.maritalStatus = maritalStatus;
    result.dateOfBirth = dateOfBirth ? formattedDateOfBirth[0] : null;
    result.probationPeriod = probationPeriod;
    result.gender = gender;
    result.parentName = parentName;
    result.spouseName = spouseName;
    result.referredBy = referredBy;
    result.reportingMangerId = reportingMangerId;
    result.bloodGroup = bloodGroup;
    result.emergencyContactNo = emergencyContactNo;
    result.emergencyContactName = emergencyContactName;
    result.emergencyContactRelation = emergencyContactRelation; 
    result.spouseContactNo = spouseContactNo;
    result.parentContactNo = parentContactNo;
    result.motherName = motherName;
    result.motherContactNo = motherContactNo; 
    result.temporaryAddress = temporaryAddress;
    result.permanentAddress = permanentAddress;
    result.qualification = qualification;
    result.experience = experience;
    await result.save();
    
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
})

router.get('/birthdays', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    
    const employeesWithBirthdays = await UserPersonal.findAll({
      where: {
        [Op.and]: [
          sequelize.where(fn('EXTRACT', literal('MONTH FROM "dateOfBirth"')), currentMonth),
          sequelize.where(fn('EXTRACT', literal('DAY FROM "dateOfBirth"')), { [Op.gte]: currentDay })
        ]
      },include: {
        model: User, as: 'user',
        attributes: ['name']
      }
    });

    const employeesWithBirthdaysWithAge = employeesWithBirthdays.map(employee => {
      const birthDate = new Date(employee.dateOfBirth);
      const age = today.getFullYear() - birthDate.getFullYear();
      const hasHadBirthdayThisYear = 
        today.getMonth() > birthDate.getMonth() || 
        (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

      return {
        ...employee.toJSON(), // Convert Sequelize instance to plain object
        age: hasHadBirthdayThisYear ? age : age - 1, // Adjust age if birthday hasn't occurred yet this year
      };
    });

    res.status(200).json(employeesWithBirthdaysWithAge);
  } catch (error) {
    res.send(error.message);
  }
});

router.get('/joiningday', authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    
    const employees = await UserPersonal.findAll({
      where: {
        [Op.and]: [
          sequelize.where(fn('EXTRACT', literal('MONTH FROM "dateOfJoining"')), currentMonth),
          sequelize.where(fn('EXTRACT', literal('DAY FROM "dateOfJoining"')), { [Op.gte]: currentDay })
        ]
      },include: {
        model: User, as: 'user',
        attributes: ['name']
      }
    });

    const employeesWithExp = employees.map(employee => {
      const date = new Date(employee.dateOfJoining);
      const exp = today.getFullYear() - date.getFullYear();
      const hasHadJoiningThisYear = 
        today.getMonth() > date.getMonth() || 
        (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());

      return {
        ...employee.toJSON(), // Convert Sequelize instance to plain object
        exp: hasHadJoiningThisYear ? exp : exp - 1, // Adjust age if birthday hasn't occurred yet this year
      };
    });

    res.status(200).json(employeesWithExp);
  } catch (error) {
    res.send(error.message);
  }
});

router.get('/dueprobation', authenticateToken, async (req, res) => {
  try {
    const today = new Date();

    const users = await User.findAll({
      include: [
        {
          model: UserPosition,
          attributes: ['probationPeriod'], 
        },
        {
          model: UserPersonal, as: 'userpersonal',
          attributes: ['dateOfJoining'],
        },
      ],
    });
    
    const probationDueUsers = [];
    for (let i = 0; i < users.length; i++) {
      
      if (users[i].userpersonal?.length > 0 && users[i].userPosition && 
        users[i].userpersonal[0]?.dateOfJoining && users[i].userPosition.probationPeriod && users[i].isTemporary === true) {
        const joiningDate = new Date(users[i].userpersonal[0].dateOfJoining);
        const probation = users[i].userPosition.probationPeriod;

        const probationEndDate = new Date(joiningDate);
        probationEndDate.setDate(probationEndDate.getDate() + probation);
        if (probationEndDate <= today) {
          probationDueUsers.push({
            ...users[i].toJSON(), 
            probationEndDate: probationEndDate.toISOString().split('T')[0] 
          });
        }
      }
    }

    res.send(probationDueUsers);
  } catch (error) {
    res.send(error.message);
  }
});


module.exports = router;