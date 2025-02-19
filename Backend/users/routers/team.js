/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
const express = require('express');
const Team = require('../models/team');
const TeamMember = require('../models/teamMember');
const router = express.Router();
const User = require('../models/user');
const TeamLeader = require('../models/teamLeader');

router.post('/', async (req, res) => {
    try {
      const { teamName, teamLeaders, teamMembers } = req.body;
        console.log(teamMembers);
        
      // Create the team
      const team = await Team.create({ teamName });
  
      // Create team leaders
      const teamLeadersPromises = teamLeaders.map(userId => 
        TeamLeader.create({ teamId: team.id, userId })
      );
      await Promise.all(teamLeadersPromises);
      console.log(teamLeadersPromises);
      
      // Create team members
      const teamMembersPromises = teamMembers.map(userId => 
        TeamMember.create({ teamId: team.id, userId })
      );
      await Promise.all(teamMembersPromises);
      console.log(teamMembersPromises);
  
      res.send({ message: 'Team created successfully', teamId: team.id });
    } catch (error) {
      res.send(error.message);
    }
});
  
router.get('/', async (req, res) => {
    try {
        const team = await Team.findAll({include: [
            { model: TeamLeader, attributes: ['userId'], include: [{model: User, attributes: ['name']}] },
            { model: TeamMember, attributes: ['userId'], include: [{model: User, attributes: ['name']}] }]
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
        res.send(error.message);
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
        res.send(error.message)
    }

})

module.exports = router;