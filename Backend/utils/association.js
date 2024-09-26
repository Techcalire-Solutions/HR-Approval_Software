
const Team = require("../users/models/team");
const TeamMember = require("../users/models/teamMember");
const sequelize = require('./db');
const bcrypt = require('bcrypt');
const Role = require('../users/models/role');
const User = require('../users/models/user');


async function syncModel() {
    await sequelize.sync({alter: true})

    // Team.belongsTo(User, {
    //     foreignKey: "userId",
    //     as: "leader",
    //   });
    
    //   Team.hasMany(TeamMember, { foreignKey: "teamId" });
    //   TeamMember.belongsTo(Team);

    //   User.hasMany(TeamMember, { foreignKey: "userId"});
    //   TeamMember.belongsTo(User, { foreignKey: "userId"});
    

    const roleData = [
        {roleName: 'Sales Executive',abbreviation:'SE'}, //1
        {roleName: 'Key Account Manager',abbreviation:'KAM'}, //2
        {roleName: 'Manager',abbreviation:'Manager'}, //3
        {roleName: 'Accountant',abbreviation:'Accountant'}, //4
        {roleName: 'Team Lead',abbreviation:'Team Lead'}, //5
        {roleName: 'Administrator',abbreviation:'Approval Admin'}, //6
        {roleName: 'HR Administrator',abbreviation:'HR Admin'}, //7
        {roleName: 'HR',abbreviation:'HR'}, //8
        {roleName: 'Super Administrator',abbreviation:'Super Admin'}, //9
    ]
    const role = await Role.findAll({});
    if(role.length === 0){
        for(let i = 0; i < roleData.length; i++){
            Role.bulkCreate([roleData[i]]);
        }
    }

    const userData = [    
        { name: "Ashbin", email: "ashbin@gmail.com", phoneNumber:"9846335577", password: "ashbin@123", roleId: 1, teamId:1,status: true, empNo: 'OAC-2024-001' },
        { name: "Sameer", email: "sameer@gmail.com", phoneNumber:"9846335570", password: "sameer@123", roleId: 1,teamId:1, status: true, empNo: 'OAC-2024-002' },
        { name: "Vishnu", email: "vishnu@gmail.com", phoneNumber:"9846335123", password: "vishnu@123", roleId: 1, teamId:1, status: true, empNo: 'OAC-2024-003' },
        { name: "Sijin", email: "anupama@onboardaero.com", phoneNumber:"9846442233", password: "sijin@123", roleId: 2, status: true, empNo: 'OAC-2024-004', reportingManager: true },
        { name: "Shibin", email: "shibin@gmail.com", phoneNumber:"9847391646", password: "shibin@123", roleId: 3, status: true, empNo: 'OAC-2024-005' },
        { name: "Fawas", email: "fawas@gmail.com", phoneNumber:"98667799551", password: "fawas@123", roleId: 4, status: true, empNo: 'OAC-2024-006' },
        { name: "Approval Admin", email: "admin@gmail.com", phoneNumber:"1234567890", password: "admin@123", roleId: 6, status: true, empNo: 'OAC-2024-007' },
        { name: "HR Admin", email:"hradmin@gmail.com", phoneNumber:"1234567890", password: "hradmin@123", roleId: 7, status: true, empNo: 'OAC-2024-008'},
        { name: "Super Admin", email: "superadmin@gmail.com", phoneNumber:"1234567890", password: "superadmin@123", roleId: 9, status: true, empNo: 'OAC-2024-009' },
        { name: "Dhanalakshmi", email: "dhanalakshmi@gmail.com", phoneNumber:"1234567890", password: "dhanalakshmi@123", roleId: 8, status: true, empNo: 'OAC-2024-008' },
        
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
                { teamId: 1, userId: 2 },
                { teamId: 1, userId: 3 },
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