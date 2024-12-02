/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('./user');
const Designation = require('../models/designation');
const Team = require('./team');

const UserPosition = sequelize.define('userPosition',{
    userId : {type : DataTypes.INTEGER, allowNull : false},
    division : {type : DataTypes.STRING},
    costCentre : {type : DataTypes.STRING},
    grade : {type : DataTypes.STRING},
    location : {type : DataTypes.STRING},
    department: { type: DataTypes.JSON, allowNull: true},
    office  : {type : DataTypes.STRING},
    salary : {type : DataTypes.STRING},
    probationPeriod : {type : DataTypes.INTEGER, defaultValue : 3},
    probationNote : {type : DataTypes.STRING},
    officialMailId : {type : DataTypes.STRING},
    projectMailId : {type : DataTypes.STRING},
    designationId : {type : DataTypes.INTEGER},
    teamId : { type: DataTypes.INTEGER, allowNull: true } 
},
{
    freezeTableName: true,
    timestamps : false
})


User.hasOne(UserPosition, { foreignKey: 'userId', onUpdate: 'CASCADE' });
UserPosition.belongsTo(User, { foreignKey: 'userId' });

Team.hasOne(UserPosition, { foreignKey: 'teamId', onUpdate: 'CASCADE' });
UserPosition.belongsTo(Team, { foreignKey: 'teamId' });

Designation.hasOne(UserPosition, { foreignKey: 'designationId', onUpdate: 'CASCADE' });
UserPosition.belongsTo(Designation, { foreignKey: 'designationId' });

UserPosition.sync({ alter: true })
  .then(() => console.log("UserPosition table Sync"))
  .catch((err) => console.log("Error syncing table UserPosition:", err));


module.exports = UserPosition;


