const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');


const EventLog = sequelize.define('EventLog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.STRING, allowNull: true },
  userEmail:{ type: DataTypes.STRING, allowNull:true },
  subject: { type: DataTypes.STRING, allowNull: true },
  message: { type: DataTypes.TEXT, allowNull: true },
  recipients: { type: DataTypes.JSON, allowNull: true },
  attachments: { type: DataTypes.JSON, allowNull: true },
  eventType:{ type :DataTypes.STRING, allowNull :true },
  // sentAt: { type : DataTypes.DATE, defaultValue: DataTypes.NOW },
  timestamp: { type: DataTypes.DATE },
  isSent: { type: DataTypes.BOOLEAN, defaultValue: false },
});

EventLog.sync({alter: true}).then(()=>console.log)

module.exports = EventLog;
