const Promotion = require("../models/promotion");
const User = require("../models/user");
const express = require('express');
const UserPosition = require("../models/userPosition");
const Payroll = require("../../payroll/models/payroll");
const router = express.Router();
const sequelize = require('../../utils/db');
const Designation = require("../models/designation");

router.post('/', async (req, res) => {
  const t = await sequelize.transaction(); // Start transaction
  try {
    const { userId, designationId, newSalary, effectiveDate, promotionReason, previousSalary } = req.body;
    
    // Get the employee's current details with proper error handling
    const employee = await User.findByPk(userId, {
      include: [
        { 
          model: UserPosition, 
          attributes: ['id', 'designationId'], // Include id for updating
          required: true // Ensure user has a position
        }, 
        {
          model: Payroll,
          attributes: ['grossPay'],
          order: [['createdAt', 'DESC']], // Get most recent payroll
          limit: 1,
          required: true // Ensure user has payroll
        }
      ],
      transaction: t
    });

    if (!employee) {
      await t.rollback();
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Verify we have required data
    if (!employee.userPosition || !employee.payrolls.length) {
      await t.rollback();
      return res.status(400).json({ 
        error: 'Employee position or payroll data missing' 
      });
    }

    const currentPositionId = employee.userPosition.designationId;

    // Create the promotion record
    const promotion = await Promotion.create({
      userId,
      oldDesignationId: currentPositionId,
      designationId,
      previousSalary,
      newSalary,
      effectiveDate,
      promotionReason,
      promotionDate: new Date()
    }, { transaction: t });

    // Update the employee's position
    const up = await UserPosition.findOne({ 
    where: { id: employee.userPosition.id },
    transaction: t 
    });

    if (!up) {
    await t.rollback();
    return res.status(404).json({ error: 'UserPosition not found' });
    }

    up.designationId = designationId;
    await up.save({ transaction: t });
    
    await t.commit(); // Commit if all successful
    res.status(201).json(promotion);
  } catch (error) {
    await t.rollback(); // Rollback on error
    console.error('Error applying promotion:', error);
    res.status(500).json({ 
      error: 'Failed to apply promotion',
      details: error.message 
    });
  }
});

// Get all promotions
router.get('/', async (req, res) => {
  try {
    const promotions = await Promotion.findAll({
      include: [{
        model: User,
        attributes: ['name']
      }],
      order: [['effectiveDate', 'DESC']]
    });
    res.json(promotions);
  } catch (error) {
    console.error('Error fetching promotions:', error);
    res.status(500).json({ error: 'Failed to fetch promotions' });
  }
});

// Get promotions for a specific employee
router.get('/:id', async (req, res) => {
  try {
    const promotion = await Promotion.findAll({
      where: { userId: req.params.id },
      include: [
        { model: User, as: 'user', attributes: ['name'] },
        { model: Designation, as: 'Designation', attributes: ['designationName'] },
        { model: Designation, as: 'oldDesignation', attributes: ['designationName'] }
      ]
    });

    // if (promotion.length === 0) {
    //   return res.status(404).json({ error: 'No promotions found for this user' });
    // }

    res.json(promotion);
  } catch (error) {
    console.error('Error fetching promotion:', error);
    res.status(500).json({ error: 'Failed to fetch promotion' });
  }
});

// Get promotion by ID
// router.get('/:id', async (req, res) => {
//   try {
//     const promotion = await Promotion.findByPk(req.params.id, {
//       include: [{
//         model: User,
//         attributes: ['name', 'position', 'salary']
//       }]
//     });
    
//     if (!promotion) {
//       return res.status(404).json({ error: 'Promotion not found' });
//     }
    
//     res.json(promotion);
//   } catch (error) {
//     console.error('Error fetching promotion:', error);
//     res.status(500).json({ error: 'Failed to fetch promotion' });
//   }
// });

module.exports = router;