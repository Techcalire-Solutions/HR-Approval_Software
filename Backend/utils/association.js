
const Team = require("../users/models/team");
const TeamMember = require("../users/models/teamMember");
const sequelize = require('./db');
const bcrypt = require('bcrypt');
const Role = require('../users/models/role');
const User = require('../users/models/user');


async function syncModel() {
    await sequelize.sync({alter: true})

 
    

    const roleData = [
        {roleName: 'Sales Executive',abbreviation:'SE'},
        {roleName: 'Key Account Manager',abbreviation:'KAM'},
        {roleName: 'Manager',abbreviation:'Manager'},
        {roleName: 'Accountant',abbreviation:'Accountant'},
        {roleName: 'Team Lead',abbreviation:'Team Lead'},
        {roleName: 'Administrator',abbreviation:'Admin'},
        {roleName: 'HR',abbreviation:'HR'},
    ]
    const role = await Role.findAll({});
    if(role.length === 0){
        for(let i = 0; i < roleData.length; i++){
            Role.bulkCreate([roleData[i]]);
        }
    }

    const userData = [
       
        { name: "Ashbin", email: "ashbin@gmail.com", phoneNumber:"9846335577", password: "ashbin@123", roleId: 1, teamId:1,status: true },
        { name: "Sameer", email: "sameer@gmail.com", phoneNumber:"9846335570", password: "sameer@123", roleId: 1,teamId:1, status: true },
        { name: "Vishnu", email: "vishnu@gmail.com", phoneNumber:"9846335123", password: "vishnu@123", roleId: 1, teamId:1, status: true },
        { name: "Sijin", email: "sijin@gmail.com", phoneNumber:"9846442233", password: "sijin@123", roleId: 2, teamId:1, status: true },
        { name: "Shibin", email: "shibin@gmail.com", phoneNumber:"9847391646", password: "shibin@123", roleId: 3, teamId:1, status: true },
        { name: "Fawas", email: "fawas@gmail.com", phoneNumber:"98667799551", password: "fawas@123", roleId: 4, teamId:1, status: true },
        { name: "Admin", email: "admin@gmail.com", phoneNumber:"1234567890", password: "admin@123", roleId: 6, teamId:1, status: true },
        { name: "Dhanalakshmi", email: "dhanalakshmi@gmail.com", phoneNumber:"1234567890", password: "dhanalakshmi@123", roleId: 7, teamId:1, status: true },
    ];
    const user = await User.findAll({});
    const salt = await bcrypt.genSalt(10);
    if(user.length === 0){
        for(let i = 0; i < userData.length; i++){
            const hashedPassword = await bcrypt.hash(userData[i].password, salt)
            const name = userData[i].phoneNumber;
            userData[i].password = hashedPassword
            userData[i].userName = name
            
            User.bulkCreate([userData[i]])
        }
    }

    const team = await Team.findAll({});

    if (team.length === 0) {
        try {
            await Team.bulkCreate([
                { teamName: "EMEA", userId: 1 },
            ]);
    
            const teams = await Team.findAll();
            const teamMembers = [
                { teamId: 1, userId: 1 },
            ];
    
            for (const team of teams) {
                await TeamMember.bulkCreate(teamMembers.map(member => ({
                    ...member,
                    teamId: team.id,
                })));
            }
        } catch (error) {
            console.error("Error creating team and team members:", error.message);
        }
    }
}

module.exports = syncModel;