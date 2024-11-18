/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('./user');

const StatutoryInfo = sequelize.define('statutoryinfo',{
    userId : {type : DataTypes.INTEGER, allowNull : false},
    adharNo : {type : DataTypes.STRING, allowNull : false},
    panNumber : {type : DataTypes.STRING, allowNull : false},
    esiNumber : {type : DataTypes.STRING, allowNull : false},
    uanNumber : {type : DataTypes.STRING, allowNull : false},
    insuranceNumber : {type : DataTypes.STRING, allowNull : false}
},
{
    freezeTableName: true,
    timestamps : false
})

User.hasOne(StatutoryInfo, { foreignKey: 'userId', onUpdate: 'CASCADE' });
StatutoryInfo.belongsTo(User, { foreignKey: 'userId', as: 'manager'  });


StatutoryInfo.sync({ alter: true })
  .then(() => console.log("StatutoryInfo table Sync"))
  .catch((err) => console.log("Error syncing table StatutoryInfo:", err));


module.exports = StatutoryInfo;


