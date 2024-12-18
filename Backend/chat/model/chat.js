/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('../../users/models/user');

const Chat = sequelize.define('chat',{
    toId : {type : DataTypes.INTEGER, allowNull : false},
    fromId :{type : DataTypes.INTEGER, allowNull : false},
    message : {type : DataTypes.TEXT, allowNull : false},
    time : {type : DataTypes.DATE, defaultValue : new Date()},
    status : {type : DataTypes.STRING, defaultValue : "Sent"},
    deleted : {type : DataTypes.BOOLEAN, defaultValue : false}
},
{
    freezeTableName: true,
    timestamps : false
})

User.hasOne(Chat, { foreignKey: 'toId', as: 'to', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
Chat.belongsTo(User, { foreignKey: 'toId'});

User.hasOne(Chat, { foreignKey: 'fromId', as: 'from', onUpdate: 'CASCADE', onDelete: 'CASCADE' });
Chat.belongsTo(User, { foreignKey: 'fromId'});

Chat.sync({ alter: true })
  .then(() => console.log("Chat table Sync"))
  .catch((err) => console.log("Error syncing table Chat:", err));


module.exports = Chat;


