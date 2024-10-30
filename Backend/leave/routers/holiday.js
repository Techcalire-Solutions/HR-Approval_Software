const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const sequelize = require('../../utils/db');
const Holiday = require('../models/holiday');
const { Op, where } = require('sequelize'); 
const UserLeave = require('../models/userLeave');
const LeaveType = require('../models/leaveType');
const ComboOff = require('../models/comboOff');

router.post('/save', authenticateToken, async (req, res) => {
  const { name, type, comments, date } = req.body;
    try {
          const holiday = new Holiday({name, type, comments, date});
          await holiday.save();
          
          res.send(holiday);

    } catch (error) {
        res.send(error.message);
    }
})

router.get('/find', async (req, res) => {
    try {
        let whereClause = {};
        let limit;
        let offset;
        const today = new Date();

        // Check if the search term is defined
        if (req.query.search && req.query.search !== 'undefined') {
            const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
            whereClause = {
                [Op.or]: [
                    sequelize.where(
                        sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('name'), ' ', '')),
                        {
                            [Op.like]: `%${searchTerm}%`
                        }
                    )
                ],
                date: { [Op.gt]: today }
            };
        } else {
            whereClause = {
                date: { [Op.gt]: today }
            };
        }

        // Check if pagination parameters are defined
        if (req.query.pageSize && req.query.page && req.query.pageSize !== 'undefined' && req.query.page !== 'undefined') {
            limit = parseInt(req.query.pageSize, 10);
            offset = (parseInt(req.query.page, 10) - 1) * limit;
        }

        const holiday = await Holiday.findAll({
            order: [['date', 'ASC']],
            limit,
            offset,
            where: whereClause
        });

        let totalCount = await Holiday.count({ where: whereClause });

        // Send response based on pagination
        if (req.query.page && req.query.pageSize && req.query.page !== 'undefined' && req.query.pageSize !== 'undefined') {
            const response = {
                count: totalCount,
                items: holiday,
            };
            res.json(response);
        } else {
            res.json(holiday);
        }
    } catch (error) {
        res.status(500).send(error.message); // Sending a 500 status code for server errors
    }
});


router.patch('/update/:id', async (req, res) => {
  const id = req.params.id;
  const selectedEmployees = req.body;

  const employeeLength = selectedEmployees.length; 
  
  try {
    const holiday = await Holiday.findByPk(id);
    holiday.comboAdded = true;
    holiday.comboAddedFor = employeeLength;
    console.log(holiday);
    
    await holiday.save();

    let leaveTypeId;
    try {
      const leaveType = await LeaveType.findOne({ where: { leaveTypeName: 'Comb Off' } });
      leaveTypeId = leaveType.id;
    } catch (error) {
      return res.status(500).send(error.message); // Send error if leaveType not found
    }
    let comboOff;
    try {
      comboOff = await ComboOff.create({
        userId: selectedEmployees,
        holidayId: req.params.id
      });
    } catch (error) {
      res.send(error.message)
    }

    for (let i = 0; i < selectedEmployees.length; i++) {
      try {
        let ul = await UserLeave.findOne({
          where: { userId: selectedEmployees[i], leaveTypeId: leaveTypeId }
        });

        if (ul) {
          ul.noOfDays += 1; 
          ul.leaveBalance += 1;
          await ul.save();
        } else {
          const userLeave = new UserLeave({
            userId: selectedEmployees[i],
            leaveTypeId: leaveTypeId,
            noOfDays: 1,
            takenLeaves: 0,
            leaveBalance: 1
          });
          await userLeave.save(); // Save new UserLeave
        }
      } catch (error) {
        return res.status(500).send(error.message); // Catch inner loop error
      }
    }
    
    res.json({comboOff, holiday, message:`Compository off added for employee number ${employeeLength} on the day ${holiday.name}` });
  } catch (error) {
    res.status(500).send(error.message); // Handle outer error
  }
});

router.patch('/updatetheupdated/:id', async (req, res) => {
  const id = req.params.id;
  const selectedEmployees = req.body.selectedEmployeeIds || [];
  const deselectedEmployees = req.body.deselectedEmployeeIds || [];
  const employeeLength = selectedEmployees.length;

  try {
      const holiday = await Holiday.findByPk(id);
      holiday.comboAdded = true;
      holiday.comboAddedFor += employeeLength;
      await holiday.save();

      const leaveType = await LeaveType.findOne({ where: { leaveTypeName: 'Comb Off' } });
      const leaveTypeId = leaveType.id;

      let comboOff = await ComboOff.findOne({ where: { holidayId: id } });

      comboOff.userId = comboOff.userId.filter(userId => !deselectedEmployees.includes(userId));
      const newUserIds = selectedEmployees.filter(userId => !comboOff.userId.includes(userId));
      
      comboOff.userId = [...new Set([...comboOff.userId, ...newUserIds])];

      // Save updated comboOff
      await comboOff.save();
      await comboOff.reload();

      // Update leave balances for deselected employees
      await Promise.all(deselectedEmployees.map(async (userId) => {
          const ul = await UserLeave.findOne({ where: { userId, leaveTypeId } });
          if (ul) {
              ul.noOfDays -= 1;
              ul.leaveBalance -= 1;
              await ul.save();
          }
      }));

      // Update leave balances for selected employees
      await Promise.all(selectedEmployees.map(async (userId) => {
          const ul = await UserLeave.findOne({ where: { userId, leaveTypeId } });
          if (ul) {
              ul.noOfDays += 1;
              ul.leaveBalance += 1;
              await ul.save();
          } else {
              const userLeave = new UserLeave({
                  userId,
                  leaveTypeId,
                  noOfDays: 1,
                  takenLeaves: 0,
                  leaveBalance: 1
              });
              await userLeave.save();
          }
      }));

      // Fetch the updated ComboOff again
      const updatedComboOff = await ComboOff.findOne({ where: { holidayId: id } });

      res.json({ updatedComboOff, holiday, message: `Compository off updated for employee number ${employeeLength} on the day ${holiday.name}` });

  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

router.get('/findcombooff/:id', authenticateToken, async (req, res) => {
  let holidayId = req.params.id
  try {
    const co = await ComboOff.findOne({ where: { holidayId: holidayId}})
    res.send(co)
  } catch (error) {
    res.send(error.message)
  }
})



module.exports = router;