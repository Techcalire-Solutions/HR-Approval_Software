/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('./user');

const StatutoryInfo = sequelize.define('statutoryinfo',{
    userId : {type : DataTypes.INTEGER, allowNull : false},
    adharNo : {type : DataTypes.STRING},
    panNumber : {type : DataTypes.STRING},
    esiNumber : {type : DataTypes.STRING},
    pfNumber : {type : DataTypes.STRING},
    uanNumber : {type : DataTypes.STRING},
    insuranceNumber : {type : DataTypes.STRING},
    passportNumber : {type : DataTypes.STRING},
    passportExpiry : {type : DataTypes.DATE}
},
{
    freezeTableName: true,
    timestamps : false
})

User.hasOne(StatutoryInfo, { foreignKey: 'userId', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
StatutoryInfo.belongsTo(User, { foreignKey: 'userId', as: 'manager'  });


StatutoryInfo.sync({ alter: true })
  .then(() => console.log("StatutoryInfo table Sync"))
  .catch((err) => console.log("Error syncing table StatutoryInfo:", err));


module.exports = StatutoryInfo;


