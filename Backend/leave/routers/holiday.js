/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const sequelize = require('../../utils/db');
const Holiday = require('../models/holiday');
const { Op, where } = require('sequelize'); 
const UserLeave = require('../models/userLeave');
const LeaveType = require('../models/leaveType');
const ComboOff = require('../models/comboOff');
const xlsx = require('xlsx');
const multer = require('multer');
const moment = require('moment');

// Multer setup for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Route to upload Excel file
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const supportedFormats = ['MM-DD-YYYY', 'YYYY-MM-DD'];

    // Prepare holidays from the uploaded data
    const holidays = sheetData.map(row => {
      let parsedDate = null;

      if (typeof row['Date'] === 'string') {
        parsedDate = moment(row['Date'], supportedFormats, true);
      } else if (typeof row['Date'] === 'number') {
        parsedDate = moment(new Date((row['Date'] - 25569) * 86400 * 1000));
      };
      
      return {
        name: row['Name'],
        type: row['Type'],
        date: parsedDate.isValid() ? parsedDate.toDate() : null,
        comments: row['Comments'] || null,
      };
    });
    console.log(holidays);
    
    // Helper function to format the date to 'yyyy-MM-dd'
    const formatDate = (date) => {
      return date && !isNaN(date) ? date.toISOString().split('T')[0] : null;
    };

    const existingHolidays = await Holiday.findAll({
      attributes: ['date'],
    });

    const existingDates = new Set();
    existingHolidays.forEach(holiday => {
        if (holiday.dataValues && holiday.dataValues.date) {
            existingDates.add(holiday.dataValues.date);
        }
    });
    // Filter out holidays with duplicate dates in the database
    const uploadedDates = holidays.map(holiday => formatDate(holiday.date)).filter(Boolean);
    const addedDates = uploadedDates.filter(date => !existingDates.has(date));
    const notAddedDates = uploadedDates.filter(date => !addedDates.includes(date));
    console.log(addedDates, uploadedDates);
    
    // Filter out holidays with duplicate dates in the database
    const newHolidays = holidays.filter(
      holiday => formatDate(holiday.date) && !existingDates.has(formatDate(holiday.date))
    );
    

    if (newHolidays.length > 0) {
      await Holiday.bulkCreate(newHolidays);
      if(notAddedDates.length > 0){
        return res.send(`${notAddedDates} dates are removed since they were already exist in Holidays list`);
      }else{
        res.status(200).json({
          message: 'Holidays uploaded successfully.',
          newHolidays,
        })
      }
    }else {
      return res.send('No new holidays to add. All holidays are already in the database.');
    }
  } catch (error) {
    res.send(error.message);
  }
});

router.post('/save', authenticateToken, async (req, res) => {
  const { name, type, comments, date } = req.body;
  try {
    const holidayExist = await Holiday.findOne({
      where: { date: date}
    })
    if(holidayExist){
      return res.send(`${date} is already marked as a holiday for ${holidayExist.name}`);
    }
  } catch (error) {
    res.send(error.message);
  }
    try {
          const holiday = new Holiday({name, type, comments, date});
          await holiday.save();
          
          res.send(holiday);

    } catch (error) {
        res.send(error.message);
    }
});

router.delete('/delete/:id', authenticateToken, async(req,res)=>{
  try {
      const result = await Holiday.destroy({
          where: { id: req.params.id },
          force: true,
      });

      if (result === 0) {
          return res.status(404).json({
            status: "fail",
            message: "Holiday with that ID not found",
          });
        }
    
        res.status(204).json();
      }  catch (error) {
        res.send(error.message);
  }
  
})

router.patch('/updateholiday/:id', authenticateToken, async(req,res)=>{
  try {
    const id = parseInt(req.params.id, 10); 
    Holiday.update(req.body, {
        where: { id: id }
    })
    .then(num => {
        if (num == 1) {
            res.send({
                message: "Holiday was updated successfully."
            });
        } else {
            res.send({
                message: `Cannot update Holiday with id=${roleId}. Maybe Holiday was not found or req.body is empty!`
            });
        }
    })
    .catch(error => {
        res.send(error.message);
    });
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
        res.send(error.message); // Sending a 500 status code for server errors
    }
});

router.get('/findall', async (req, res) => {
  try {
      let whereClause = {};
      let limit;
      let offset;
      const currentYear = new Date().getFullYear();
      // Check if the search term is defined
      const startDate = `${currentYear}-01-01`;
      const endDate = `${currentYear}-12-31`;
      whereClause = {
        date: {
          [Op.between]: [startDate, endDate],
        },
      }

      const holiday = await Holiday.findAll({
          order: [['date', 'ASC']],
          limit,
          offset,
          where: whereClause
      });

      res.json(holiday);
  } catch (error) {
      res.send(error.message); // Sending a 500 status code for server errors
  }
});

router.get('/byname', async (req, res) => {
  try {
    if (req.query.search && req.query.search !== 'undefined') {
      const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
      const whereClause = {
          [Op.or]: [
              sequelize.where(
                  sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('name'), ' ', '')),
                  {
                      [Op.like]: `%${searchTerm}%`
                  }
              )
          ]
      };

      const holiday = await Holiday.findAll({
        order: [['date', 'ASC']],
        where: whereClause
    });

    res.send(holiday)
    }
  } catch (error) {
    res.send(error.message); 
  }
})

router.get('/holidaybydate', async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.send( 'Date is required' );
        }

        const holidays = await Holiday.findAll({
            where: {
                date: {
                    [Op.eq]: date,
                },
            },
        });
        
        res.status(200).json(holidays);
    } catch (error) {
        res.send( error.message );
    }
});

router.get('/holidaysbyyear', async (req, res) => {
    try {
        const { year } = req.query;

        if (!year) {
            return res.send('Year is required');
        }

        // Create start and end dates for the year
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;

        const holidays = await Holiday.findAll({
          where: {
            date: {
              [Op.between]: [startDate, endDate],
          },
        },
        });

        // Return the result
        res.status(200).json(holidays);
    } catch (error) {
        console.error('Error fetching holidays:', error);
        res.send(error.message)
    }
});

router.patch('/byyear', async (req, res) => {
  try {
      const ids = req.body;
      console.log(ids);
      
      if (!Array.isArray(ids) || ids.length === 0) {
          return res.send( 'Array of IDs is required' );
      }

      const result = await Holiday.destroy({
          where: {
              id: ids,
          },
      });

      if (result > 0) {
        res.status(204).json();
      } else {
          res.send('No holidays found with the given IDs');
      }
  } catch (error) {
      res.send(error.message);
  }
});

// comboofffffffffffffffffffffffffffffff----------------------------------------------------------------------------------------
router.patch('/update/:id', async (req, res) => {
  const id = req.params.id;
  const selectedEmployees = req.body;

  const employeeLength = selectedEmployees.length; 
  
  try {
    const holiday = await Holiday.findByPk(id);
    holiday.comboAdded = true;
    holiday.comboAddedFor = employeeLength;
    
    await holiday.save();

    let leaveTypeId;
    try {
      const leaveType = await LeaveType.findOne({ where: { leaveTypeName: 'Comb Off' } });
      leaveTypeId = leaveType.id;
    } catch (error) {
      return res.send(error.message); // Send error if leaveType not found
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
        return res.send(error.message); // Catch inner loop error
      }
    }
    
    res.json({comboOff, holiday, message:`Compository off added for employee number ${employeeLength} on the day ${holiday.name}` });
  } catch (error) {
    res.send(error.message); // Handle outer error
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
      res.json({ error: error.message });
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