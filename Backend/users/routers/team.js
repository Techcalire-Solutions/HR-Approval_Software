const express = require('express');
const Team = require('../models/team');
const TeamMember = require('../models/teamMember');
const router = express.Router();
const authenticateToken = require('../../middleware/authorization');
const { Op, fn, col, where } = require('sequelize');
const sequelize = require('../../utils/db');


router.post('/', async (req, res) => {
    try {
        const { teamName, userId, teamMembers } = req.body;

        const team = new Team({ teamName, userId })
        await team.save()
        let teamId = team.id;
        for (let i = 0; i < teamMembers.length; i++) {
            teamMembers[i].teamId = teamId;
        }
        const teamMembersBulkResult = await TeamMember.bulkCreate(teamMembers);
        const teamMember = new TeamMember({ teamId, userId })
        await teamMember.save()
        res.send(teamMembersBulkResult)

    } catch (error) {
        res.send(error.message)

    }

})

router.get('/', async (req, res) => {
    try {
        const team = await Team.findAll({
            include: ['leader',
                {
                    model: TeamMember,
                    include: 'register'
                },
            ],
        });

        res.send(team);


    } catch (error) {
        res.send(error.message)
    }

})
// --
router.get('/:id', async (req, res) => {
    try {

        const team = await Team.findOne({
            include: ['leader',
                {
                    model: TeamMember,
                    include: 'register'
                },
            ], where: { id: req.params.id }
        })
        res.send(team)

    } catch (error) {
        res.send(error)
    }
})


// router.patch('/:id', async (req, res) => {
//     try {
//         Team.update(req.body, {
//             where: { id: req.params.id }
//         })
//             .then(num => {
//                 if (num == 1) {
//                     res.send({
//                         message: "Team updated successfully."
//                     });
//                 } else {
//                     res.send({
//                         message: `Cannot update Team with id=${id}. Maybe Team was not found or req.body is empty!`
//                     });
//                 }
//             })
//     } catch (error) {
//         res.status(500).json({
//             status: "error",
//             message: error.message,
//         });
//     }
// })
router.patch('/:id', async (req, res) => {
    try {
        const { teamName, userId, teamMembers } = req.body;

        // Update the team
        const [num] = await Team.update({ teamName, userId }, {
            where: { id: req.params.id }
        });

        if (num == 1) {
            if (teamMembers && teamMembers.length > 0) {
                // Delete existing team members
                await TeamMember.destroy({ where: { teamId: req.params.id } });

                // Add new team members
                for (let i = 0; i < teamMembers.length; i++) {
                    teamMembers[i].teamId = req.params.id;
                }
                await TeamMember.bulkCreate(teamMembers);
            }

            res.send({
                message: "Team updated successfully."
            });
        } else {
            res.send({
                message: `Cannot update Team with id=${req.params.id}. Maybe Team was not found or req.body is empty!`
            });
        }
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: error.message,
        });
    }
});


router.delete('/:id', async (req, res) => {
    try {

        const team = await Team.destroy({
            where: { id: req.params.id },
            force: true,
        });

        if (team === 0) {
            return res.status(404).json({
                status: "fail",
                message: "Team with that ID not found",
            });
        }

        res.status(204).json();
    } catch (error) {
        res.send({ error: error.message })
    }

})

module.exports = router;