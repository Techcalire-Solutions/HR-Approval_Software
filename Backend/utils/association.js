/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */

const sequelize = require('./db');
const Role = require('../users/models/role');
const holidayData = require('./holiday.json');
const Holiday = require("../leave/models/holiday");

async function syncModel() {
   
  await sequelize.sync({force: true})
  
    const holiday = await Holiday.findAll({})
    
    if(holiday.length === 0){
        for(let i = 0; i < holidayData.length; i++){
            Holiday.bulkCreate([holidayData[i]]);
        }
    }
  
  
    // Team.belongsTo(User, {
    //     foreignKey: "userId",
    //     as: "leader",
    //   });
    
    //   Team.hasMany(TeamMember, { foreignKey: "teamId" });
    //   TeamMember.belongsTo(Team);

    //   User.hasMany(TeamMember, { foreignKey: "userId"});
    //   TeamMember.belongsTo(User, { foreignKey: "userId"});
    

//------------------------------LEAVE ASSOCIATIONS-----------------------------------------------
//   Leave.belongsTo(LeaveType, { foreignKey: 'leaveTypeId' });
//   Leave.belongsTo(User, { foreignKey: 'userId' });
  
    const roleData = [
        {roleName: 'Sales Executive',abbreviation:'SE'}, 
        {roleName: 'Key Account Manager',abbreviation:'KAM'}, 
        {roleName: 'Manager',abbreviation:'Manager'},
        {roleName: 'Accountant',abbreviation:'Accountant'}, 
        {roleName: 'Team Lead',abbreviation:'Team Lead'}, 
        {roleName: 'HR',abbreviation:'HR'}, 
        {roleName: 'IT',abbreviation:'IT'}, 

        {roleName: 'Administrator',abbreviation:'Approval Admin'}, 
        {roleName: 'HR Administrator',abbreviation:'HR Admin'}, 
        {roleName: 'Super Administrator',abbreviation:'Super Admin'}, 
    ]
    const role = await Role.findAll({});
    if(role.length === 0){
        for(let i = 0; i < roleData.length; i++){
            Role.bulkCreate([roleData[i]]);
        }
    }


    // const user = await User.findAll({});
    
    // const salt = await bcrypt.genSalt(10);
    
    // if(user.length === 0){
    //     for(let i = 0; i < userData.length; i++){
    //         console.log(userData[i]);
            
    //         const hashedPassword = await bcrypt.hash(userData[i].password, salt)
    //         const name = userData[i].phoneNumber;
    //         userData[i].password = hashedPassword
    //         userData[i].userName = name
            
    //         User.bulkCreate([userData[i]])
    //     }
    // }

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