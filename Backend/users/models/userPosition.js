const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');

const UserPosition = sequelize.define('userposition',{
    userId : {type : DataTypes.INTEGER, allowNull : false},
    division : {type : DataTypes.STRING},
    costCentre : {type : DataTypes.STRING},
    grade : {type : DataTypes.STRING},
    designation : {type : DataTypes.STRING},
    location : {type : DataTypes.STRING},
    department : {type : DataTypes.STRING},
    office  : {type : DataTypes.STRING},
    salary : {type : DataTypes.STRING},
    probationPeriod : {type : DataTypes.INTEGER, defaultValue : 3},
    officialMailId : {type : DataTypes.STRING},
},
{
    freezeTableName: true,
    timestamps : false
})

UserPosition.sync({ alter: true })
  .then(() => console.log("UserPosition table Sync"))
  .catch((err) => console.log("Error syncing table UserPosition:", err));


module.exports = UserPosition;


