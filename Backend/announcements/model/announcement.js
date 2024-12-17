/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');

const Announcement = sequelize.define('announcement',{
    message : {type : DataTypes.STRING, allowNull : false},
    type:{type : DataTypes.STRING, allowNull : false},
    fileUrl : {type : DataTypes.STRING},
    dismissible : {type : DataTypes.BOOLEAN, allowNull : false},
},
{
    freezeTableName: true,
    timestamps : false
})

// Announcement.sync({ alter: true })
//   .then(() => console.log("Announcement table Sync"))
//   .catch((err) => console.log("Error syncing table Announcement:", err));


module.exports = Announcement;


