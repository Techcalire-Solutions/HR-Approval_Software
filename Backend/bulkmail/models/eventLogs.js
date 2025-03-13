const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');


const EventLog = sequelize.define('EventLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {  // ✅ Add this field
    type: DataTypes.STRING, // Use INTEGER if userId is a number
    allowNull: true
  },

  userEmail:{
    type: DataTypes.STRING,
    allowNull:true,

  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  recipients: {
    type: DataTypes.JSON, 
    allowNull: true,
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  eventType:{
    type :DataTypes.STRING,
    allowNull :true
  },
  sentAt: {
    type : DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = EventLog;
