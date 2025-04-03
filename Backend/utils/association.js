/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */

const sequelize = require('./db');
const bcrypt = require('bcrypt');

const Role = require('../users/models/role');
const User = require('../users/models/user');


async function syncModel() {
   
  await sequelize.sync({alter: true})
  
    const roleData = [
        {roleName: 'Employee',abbreviation:'EMP'}, 
        {roleName: 'Sales Executive',abbreviation:'SE'}, 
        {roleName: 'Key Account Manager',abbreviation:'KAM'}, 
        {roleName: 'Manager',abbreviation:'Manager'},
        {roleName: 'Accountant',abbreviation:'Accountant'}, 
        {roleName: 'Team Lead',abbreviation:'Team Lead'}, 
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

    const userData = [
        {"name":"Super Admin","empNo":"SuperAdmin","email":"superadmin@gmail.com","phoneNumber":"1234567890","password":"superadmin@123", "roleId":"Super Administrator", "teamId":null,"status":true,"userImage":null,"director":false,"paswordReset":false,"isTemporary":false,"separated":false}, 
        {"name":"Approval Admin","empNo":"ApprovalAdmin","email":"admin@gmail.com","phoneNumber":"1234567890","password":"admin@123", "roleId":"Administrator", "teamId":null,"status":true,"userImage":null,"director":false,"paswordReset":false,"isTemporary":false,"separated":false},  
        {"name":"HR Admin","empNo":"HRAdmin","email":"hradmin@gmail.com", "officialMailId":"hradmin@hradmin.com", "phoneNumber":"1234567890","password":"hradmin@123", "roleId":"HR Administrator", "teamId":null,"status":true,"userImage":null,"director":false,"paswordReset":false,"isTemporary":false,"separated":false},    
    ]
    const user = await User.findAll({});
    const salt = await bcrypt.genSalt(10); 
    if(user.length === 0){
        for(let i = 0; i < userData.length; i++){
            const hashedPassword = await bcrypt.hash(userData[i].password, salt)
            userData[i].password = hashedPassword;
            const role = await Role.findOne({ where: { roleName: userdata[i].roleId}})
            userData[i].roleId = role.id
            User.bulkCreate([userData[i]])
        }
    }
}

module.exports = syncModel;