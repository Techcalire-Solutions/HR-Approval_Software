
const Team = require("../users/models/team");
const TeamMember = require("../users/models/teamMember");
const sequelize = require('./db');
const bcrypt = require('bcrypt');
const Role = require('../users/models/role');
const User = require('../users/models/user');


async function syncModel() {
    await sequelize.sync({alter: true})

    const team = await Team.findAll({});

  if (team.length === 0) {
    Team.bulkCreate([
      { teamName: "Team A", userId: 1 }
      // { teamName: "Team B", userId: 2 }
    ]).then(async () => {
      const teams = await Team.findAll(); 
      for (const team of teams) {
        // const teamId = team.id;
        const teamMembers = [
          { teamId:1, userId: 1 },
          { teamId:1, userId: 5 }, 
          { teamId:1, userId: 4 }, 

        
        ];
        await TeamMember.bulkCreate(teamMembers);
      }
    });
  }

    const roleData = [
        {roleName: 'Sales Executive'},
        {roleName: 'Key Account Manager'},
        {roleName: 'Manager'},
        {roleName: 'Accountant'}
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