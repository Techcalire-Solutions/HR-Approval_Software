
const sequelize = require('./db');
const bcrypt = require('bcrypt');
const Role = require('../users/models/role');
const User = require('../users/models/user');
const userData = require('./user.json');


async function syncModel() {
    await sequelize.sync({alter: true})

//------------------------------LEAVE ASSOCIATIONS-----------------------------------------------
  Leave.belongsTo(LeaveType, { foreignKey: 'leaveTypeId' });
  Leave.belongsTo(User, { foreignKey: 'userId' });
  
    const roleData = [
        {id: 1, roleName: 'Sales Executive',abbreviation:'SE'}, 
        {id: 2, roleName: 'Key Account Manager',abbreviation:'KAM'}, 
        {id: 3, roleName: 'Manager',abbreviation:'Manager'},
        {id: 4, roleName: 'Accountant',abbreviation:'Accountant'}, 
        {id: 5, roleName: 'Team Lead',abbreviation:'Team Lead'}, 
        {id: 6, roleName: 'HR',abbreviation:'HR'}, 
        {id: 7, roleName: 'IT',abbreviation:'IT'}, 

        {id:101, roleName: 'Administrator',abbreviation:'Approval Admin'}, 
        {id:102, roleName: 'HR Administrator',abbreviation:'HR Admin'}, 
        {id:103, roleName: 'Super Administrator',abbreviation:'Super Admin'}, 
    ]
    const role = await Role.findAll({});
    if(role.length === 0){
        for(let i = 0; i < roleData.length; i++){
            Role.bulkCreate([roleData[i]]);
        }
    }


    const user = await User.findAll({});
    
    const salt = await bcrypt.genSalt(10);
    
    if(user.length === 0){
        for(let i = 0; i < userData.length; i++){
            console.log(userData[i]);
            
            const hashedPassword = await bcrypt.hash(userData[i].password, salt)
            const name = userData[i].phoneNumber;
            userData[i].password = hashedPassword
            userData[i].userName = name
            
            User.bulkCreate([userData[i]])
        }
    }

    // const team = await Team.findAll({});

    // if (team.length === 0) {
    //     try {
    //         await Team.bulkCreate([
    //             { teamName: "EMEA", userId: 1 },
    //         ]);
    
    //         const teams = await Team.findAll();
    //         const teamMembers = [
    //             { teamId: 1, userId: 1 },
    //             { teamId: 1, userId: 2 },
    //             { teamId: 1, userId: 3 },
    //         ];
    
    //         for (const team of teams) {
    //             await TeamMember.bulkCreate(teamMembers.map(member => ({
    //                 ...member,
    //                 teamId: team.id,
    //             })));
    //         }
    //     } catch (error) {
    //         console.error("Error creating team and team members:", error.message);
    //     }
    // }
}

module.exports = syncModel;