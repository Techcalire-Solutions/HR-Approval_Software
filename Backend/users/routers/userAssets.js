/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');

const UserAssets = require('../models/userAssets');
const UserPosition = require('../models/userPosition');
const User = require('../models/user');

router.post('/save', authenticateToken, async (req, res) => {
    const { userId, assetCode, assets } = req.body;
    try {
        const userExists = await UserAssets.findOne({where: {userId: userId}})
        if(userExists){
            return res.send("Asset already added")
        }
        const codeExists = await UserAssets.findOne({where: {assetCode: assetCode}});
        if(codeExists){
            return res.send("The code is already allotted");
        }
    } catch (error) {
        res.send(error.message)
    }
    try {
        const role = new UserAssets({userId, assetCode, assets});
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
        console.log(department,"department");
        
        const ua = await UserAssets.findAll({
            include: [
                {
                    model: User,
                    attributes: ['id'],
                    required: true, // Ensures only UserAssets with matching Users are included
                    include: [
                        {
                            model: UserPosition,
                            attributes: [],
                            required: true, // Ensures UserPositions must match the department filter
                            where: {
                                'department.abbreviation': department // Matching the specified department
                            }
                        }
                    ]
                }
            ]
        });
        res.send(ua);
    } catch (error) {
        res.send({ error: error.message });
    }
});

router.get('/findbyuser/:id', authenticateToken, async (req, res) => {
    try {
        const ua = await UserAssets.findOne({where: {userId: req.params.id}});
        res.send(ua);
    } catch (error) {
        res.send({ error: error.message });
    }
});

router.patch('/update/:id', async(req,res)=>{
    const { assets } = req.body;
    try {
      let result = await UserAssets.findByPk(req.params.id);
      result.assets = assets
  
      await result.save();
      res.send(result);
    } catch (error) {
      res.send(error.message);
    }
  })
  

module.exports = router;