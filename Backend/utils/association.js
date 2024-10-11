
const Team = require("../users/models/team");
const TeamMember = require("../users/models/teamMember");
const sequelize = require('./db');
const bcrypt = require('bcrypt');
const Role = require('../users/models/role');
const User = require('../users/models/user');
// models/index.js
const UserLeave = require('../leave/models/userLeave');
const LeaveType = require('../leave/models/leaveType');
const userData = require('./user.json');const Leave = require('../leave/models/leave')
const holidayData = require('./holiday.json');
const Holiday = require("../leave/models/holiday");

async function syncModel() {
    await sequelize.sync({alter: true})

//------------------------------LEAVE ASSOCIATIONS-----------------------------------------------
  Leave.belongsTo(LeaveType, { foreignKey: 'leaveTypeId' });
  Leave.belongsTo(User, { foreignKey: 'userId' });
  
  
  
    // Team.belongsTo(User, {
    //     foreignKey: "userId",
    //     as: "leader",
    //   });
    
    //   Team.hasMany(TeamMember, { foreignKey: "teamId" });
    //   TeamMember.belongsTo(Team);

    //   User.hasMany(TeamMember, { foreignKey: "userId"});
    //   TeamMember.belongsTo(User, { foreignKey: "userId"});
    

    const roleData = [
        {id: 1, roleName: 'Sales Executive',abbreviation:'SE'}, 
        {id: 2, roleName: 'Key Account Manager',abbreviation:'KAM'}, 
        {id: 3, roleName: 'Manager',abbreviation:'Manager'},
        {id: 4, roleName: 'Accountant',abbreviation:'Accountant'}, 
        {id: 5, roleName: 'Team Lead',abbreviation:'Team Lead'}, 
        {id: 6, roleName: 'HR',abbreviation:'HR'}, 
        {id: 6, roleName: 'IT',abbreviation:'IT'}, 

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
            const hashedPassword = await bcrypt.hash(userData[i].password, salt)
            userData[i].password = hashedPassword
            
            User.bulkCreate([userData[i]])
        }
    }

    const holiday = await Holiday.findAll({})
    
    if(holiday.length === 0){
        for(let i = 0; i < holidayData.length; i++){
            Holiday.bulkCreate([holidayData[i]]);
        }
    }

}

module.exports = syncModel;