const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const Designation = require('../models/designation');
const { Op, where } = require('sequelize');
const sequelize = require('../../utils/db');
const UserPosition = require('../models/userPosition');
const User = require('../models/user');
const Role = require('../models/role');

router.post('/add', authenticateToken, async (req, res) => {
  const { designationName, abbreviation, roleId } = req.body;
    try {
          const role = new Designation({ designationName, abbreviation, roleId });
          await role.save();
          
          res.send(role);

    } catch (error) {
        res.send(error.message);
    }
})

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
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('designationName'), ' ', '')),
              {
                [Op.like]: `%${searchTerm.toLowerCase()}%`
              }
            ),
            sequelize.where(
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('abbreviation'), ' ', '')),
              {
                [Op.like]: `%${searchTerm.toLowerCase()}%`
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
              sequelize.fn('LOWER', sequelize.fn('REPLACE', sequelize.col('roleName'), ' ', '')),
              {
                [Op.like]: `%${searchTerm}%`
              }
            )
          ]
        };
      }
    }

    const role = await Designation.findAll({
      order:['id'], limit, offset, where: whereClause
    })

    let totalCount;
    totalCount = await Designation.count({where: whereClause});
    
    if (req.query.page != 'undefined' && req.query.pageSize != 'undefined') {
      const response = {
        count: totalCount,
        items: role,
      };

      res.json(response);
    } 
    else {
      const filteredRoles = role.filter(role => 
        role.designationName !== 'SUPER ADMIN' && role.designationName !== 'APPROVAL ADMIN' && role.designationName !== 'HR ADMIN'
      );
      res.json(filteredRoles);
    }
  } catch (error) {
    res.send(error.message);
  }
})

router.patch('/update/:id', authenticateToken, async (req, res) => {
  try {
    const designation = await Designation.findByPk(req.params.id);
    const isRoleIdUpdated = designation.roleId !== req.body.roleId;
    
    designation.designationName = req.body.designationName;
    designation.abbreviation = req.body.abbreviation;

    if (!req.body.includedInPaymentFlow) {
      designation.roleId = null;
    } else {
      designation.roleId = req.body.roleId;
    }
    await designation.save();
    let roleId = designation.roleId
    if(roleId === null || roleId === ''){
      const employeeRole = await Role.findOne({ where: { roleName: 'Employee' } });
      if (employeeRole) {
        roleId = employeeRole.id;
      } else {
        throw new Error('Role "employee" not found');
      }
    }

    let userIds;
    if (isRoleIdUpdated) {
      const userPositions = await UserPosition.findAll({
        where: { designationId: designation.id },
      });
      userIds = userPositions.map((up) => up.userId);
      await User.update(
        { roleId: roleId }, 
        { where: { id: userIds } }
      );
    }
    const user = await User.findAll({where: {id: userIds}})
    res.send(designation);
  } catch (error) {
    res.send(error.message);
  }
});

router.delete('/delete/:id', authenticateToken, async(req,res)=>{
  try {
      const result = await Designation.destroy({
          where: { id: req.params.id },
          force: true,
      });

      if (result === 0) {
          return res.status(404).json({
            status: "fail",
            message: "Role with that ID not found",
          });
        }
    
        res.status(204).json();
      }  catch (error) {
        res.send(error.message);
  }
  
})

router.get('/byroleid/:id', authenticateToken, async (req, res) => {
  try {
    const role = await Designation.findAll({ where: { roleId: req.params.id } });

    res.send(role);
  } catch (error) {
    res.send( error.message );
  }
});

module.exports = router;