const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const LeaveType = require('../models/leaveType');
const { Op, fn, col, where } = require('sequelize');
const sequelize = require('../../utils/db');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { leaveTypeName } = req.body;
    if (!leaveTypeName) return res.send({ message: 'Leave type name is required' });

    const existingLeaveType = await LeaveType.findOne({ where: { leaveTypeName } });
    if (existingLeaveType) return res.send({ message: 'Leave type already exists' });

    const leaveType = await LeaveType.create({ leaveTypeName });
    res.send(leaveType);
  } catch (error) {
    res.send(error.message);
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const leaveTypes = await LeaveType.findAll();
    res.status(200).send(leaveTypes);
  } catch (error) {
    res.send(error.message);
  }
});

router.get('/find', async (req, res) => {
  try {
    let whereClause = {}
    let limit;
    let offset;
    
    if (req.query.pageSize != 'undefined' && req.query.page != 'undefined') {
      limit = req.query.pageSize;
      offset = (req.query.page - 1) * req.query.pageSize;
      if (req.query.search != 'undefined') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        whereClause = {
          [Op.or]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('leaveTypeName'), ' ', '')),
              {
                [Op.like]: `%${searchTerm}%`
              }
            )
          ]
        };
      }
    } else {
      if (req.query.search != 'undefined') {
        const searchTerm = req.query.search.replace(/\s+/g, '').trim().toLowerCase();
        whereClause = {
          [Op.or]: [
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('leaveTypeName'), ' ', '')),
              {
                [Op.like]: `%${searchTerm}%`
              }
            )
          ]
        };
      }
    }

    const leaveType = await LeaveType.findAll({
      order:['id'], limit, offset, where: whereClause
    })

    let totalCount;
    totalCount = await LeaveType.count({where: whereClause});
    
    if (req.query.page != 'undefined' && req.query.pageSize != 'undefined') {
      const response = {
        count: totalCount,
        items: leaveType,
      };

      res.json(response);
    }
    else {

      res.json(leaveType);
    }
  } catch (error) {
    res.send(error.message);
  }


});
router.delete('/:id', authenticateToken, async(req,res)=>{
  try {
      const result = await LeaveType.destroy({
          where: { id: req.params.id },
          force: true,
      });

      if (result === 0) {
          return res.status(404).json({
            status: "fail",
            message: "LeaveType with that ID not found",
          });
        }
    
        res.status(204).json();
      }  catch (error) {
        res.send(error.message);
  }
  
})

router.patch('/:id', authenticateToken, async(req,res)=>{
  try {
    const leaveTypeId = parseInt(req.params.id, 10);

    // if ([1, 2, 3, 4, 5].includes(leaveTypeId)) {
    //     return res.send("Leave Type cannot be updated");
    // }
    LeaveType.update(req.body, {
        where: { id: leaveTypeId }
    })
    .then(num => {
        if (num == 1) {
            res.send({
                message: "LeaveType was updated successfully."
            });
        } else {
            res.send({
                message: `Cannot update leaveType with id=${leaveTypeId}. Maybe LeaveType was not found or req.body is empty!`
            });
        }
    })
    .catch(error => {
        // Handle any errors that occur during the update process
        res.send(error.message);
    });
} catch (error) {
    // Handle any unexpected errors
    res.send(error.message);
}

})

module.exports = router;
