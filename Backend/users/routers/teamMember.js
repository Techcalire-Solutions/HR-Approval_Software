const express = require('express');
const TeamMember = require('../models/teamMember');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const { Op, fn, col, where } = require('sequelize');
const sequelize = require('../../utils/db');


router.post('/', async (req, res) => {
    try {
        const { teamId, userId } = req.body;

        const teamMember = new TeamMember({ teamId, userId })
        await teamMember.save()
        res.send(teamMember)

    } catch (error) {
        res.send(error.message)

    }



})

router.get('/', async (req, res) => {
    try {
        const teamMember = await TeamMember.findAll({
            include: [{
                model: {Team, include: 'leader'},  
            }, 'register'],
        });
        res.send(teamMember)

    } catch (error) {
        res.send(error.message)
    }

})
//---
router.get('/:id', async (req, res) => {
    try {

        const teamMember = await TeamMember.findOne({ where: { id: req.params.id } })
        res.send(teamMember)

    } catch (error) {
        res.send(error)
    }
})


module.exports = router;