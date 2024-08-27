const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');

const Role = sequelize.define('role',{
    roleName : {type : DataTypes.STRING, allowNull : false},
    abbreviation:{type : DataTypes.STRING, allowNull : false},
    status : {type : DataTypes.BOOLEAN, defaultValue : true}
},
{
    freezeTableName: true,
    timestamps : false
})

Role.sync({ alter: true })
  .then(() => console.log("Role table Sync"))
  .catch((err) => console.log("Error syncing table Role:", err));


module.exports = Role;


