const Role = require("../users/models/role");
const User = require("../users/models/user");
const sequelize = require('./db');
const bcrypt = require('bcrypt');


async function syncModel() {
    await sequelize.sync({alter: true})

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