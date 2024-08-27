
const Team = require("../users/models/team");
const TeamMember = require("../users/models/teamMember");
const sequelize = require('./db');
const bcrypt = require('bcrypt');
const Role = require('../users/models/role');
const User = require('../users/models/user');


async function syncModel() {
    
    await sequelize.sync({alter: true})
    Team.belongsTo(User, {
        foreignKey: "userId",
        as: "leader",
      });
    
      Team.hasMany(TeamMember, { foreignKey: "teamId" });
      TeamMember.belongsTo(Team);

      User.hasMany(TeamMember, { foreignKey: "userId", as: "register"});
      TeamMember.belongsTo(User, { foreignKey: "userId", as: "register"});
      
    const team = await Team.findAll({});

    if (team.length === 0) {
        try {
            await Team.bulkCreate([
                { teamName: "Team A", userId: 1 },
                // { teamName: "Team B", userId: 2 }
            ]);
    
            const teams = await Team.findAll();
            const teamMembers = [
                { teamId: 1, userId: 1 },
                { teamId: 1, userId: 5 },
                { teamId: 1, userId: 4 },
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
    

    const roleData = [
        {roleName: 'Sales Executive',abbreviation:'SE'},
        {roleName: 'Key Account Manager',abbreviation:'KAM'},
        {roleName: 'Manager',abbreviation:'Manager'},
        {roleName: 'Accountant',abbreviation:'Accountant'}
    ]
    const role = await Role.findAll({});
    if(role.length === 0){
        for(let i = 0; i < roleData.length; i++){
            Role.bulkCreate([roleData[i]]);
        }
    }

    const userData = [
        { name: "Admin", email: "admin@gmail.com", phoneNumber:"1234567890", password: "password", roleId: 1, status: true },
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
}

module.exports = syncModel;