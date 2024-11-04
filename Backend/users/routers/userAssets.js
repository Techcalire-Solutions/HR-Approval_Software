const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');

const UserAssets = require('../models/userAssets');
const { where } = require('sequelize');
const UserPosition = require('../models/userPosition');
const User = require('../models/user');

router.post('/', authenticateToken, async (req, res) => {
    const { roleName, abbreviation, status, department } = req.body;
    try {
        const role = new UserAssets({roleName, abbreviation, status, department});
        await role.save();
        
        res.send(role);

    } catch (error) {
    console.log(error);
    
        res.send(error.message);
    }
})
  
router.get('/find', authenticateToken, async (req, res) => {
    try {
        const department = req.query.department;
        console.log(department,"departmentdepartmentdepartment");
        
        if(department === 'undefined'){
            return res.send("Add department...");
        }
        const ua = await UserAssets.findAll({
            include: [
                {
                    model: User,
                    attributes: ['id'],
                    include: [
                        {model: UserPosition, where: {department: department}}
                    ]
                }
            ]
        });
        res.send(ua);
    } catch (error) {
        res.send({ error: error.message });
    }
});

module.exports = router;