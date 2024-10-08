
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

    // const userData = [    
    //     { name: "HR Admin", email: "hradmin@gmail.com", phoneNumber:"1234567890", password: "hradmin@123", roleId: 102, status: true, empNo: 'OAC-2024-3', isTemporary: false },
    //     { name: "Approval Admin", email: "admin@gmail.com", phoneNumber:"1234567890", password: "admin@123", roleId: 101, status: true, empNo: 'OAC-2024-2', isTemporary: false },
    //     { name: "Super Admin", email: "superadmin@gmail.com", phoneNumber:"1234567890", password: "superadmin@123", roleId: 103, status: true, empNo: 'OAC-2024-1', isTemporary: false },

    //     { name: "Shibin", email: "shibin@gmail.com", phoneNumber:"9847391646", password: "shibin@123", roleId: 3, status: true, empNo: 'OAC-2024-001', director: true, isTemporary: false },
    //     { name: "Mahin", email: "mahin@gmail.com", phoneNumber:"0000000000", password: "mahin@123", roleId: 3, status: true, empNo: 'OAC-2024-002', director: true, isTemporary: false },
    //     { name: "Azar", email: "azar@gmail.com", phoneNumber:"1111111111", password: "azar@123", roleId: 3, status: true, empNo: 'OAC-2024-003', director: true, isTemporary: false },


    //     { name: "Ashbin", email: "ashbin@gmail.com", phoneNumber:"9846335577", password: "ashbin@123", roleId: 1, teamId:1,status: true, empNo: 'OAC-2024-004' },
    //     { name: "Sameer", email: "sameer@gmail.com", phoneNumber:"9846335570", password: "sameer@123", roleId: 1,teamId:1, status: true, empNo: 'OAC-2024-005' },
    //     { name: "Vishnu", email: "vishnu@gmail.com", phoneNumber:"9846335123", password: "vishnu@123", roleId: 1, teamId:1, status: true, empNo: 'OAC-2024-006' },
    //     { name: "Sijin", email: "anupamav08@gmail.com", phoneNumber:"9846442233", password: "sijin@123", roleId: 2, status: true, empNo: 'OAC-2024-007'},
    //     { name: "Fawas", email: "fawas@gmail.com", phoneNumber:"98667799551", password: "fawas@123", roleId: 4, status: true, empNo: 'OAC-2024-008' },
    //     { name: "Dhanalakshmi", email: "dhanalakshmi@gmail.com", phoneNumber:"1234567890", password: "dhanalakshmi@123", roleId: 6, status: true, empNo: 'OAC-2024-009' },
        
    // ];

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