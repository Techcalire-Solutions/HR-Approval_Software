const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const LeaveType = require('../models/leaveType');
const User = require('../../users/models/user');

const Leave = sequelize.define('Leave', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  leaveTypeId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null in case leave type isn't selected
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  noOfDays: {
    type: DataTypes.FLOAT,
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  session1: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // Use defaultValue instead of default
  },
  session2: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, // Use defaultValue instead of default
  },
  leaveDates: {
    type: DataTypes.JSON, // Store JSON for leave dates
    allowNull: true,
  },
},
{
  freezeTableName: true,
  timestamps: true, // This will add `createdAt` and `updatedAt` timestamps automatically
});

// Define associations
// Leave.belongsTo(LeaveType, { foreignKey: 'leaveTypeId' }); // Leave belongs to LeaveType
// LeaveType.hasMany(Leave, { foreignKey: 'leaveTypeId' });  // Each LeaveType can have many Leaves


// Sync the model with the database
Leave.sync({ alter: true })
  .then(() => console.log('Leave table synchronized successfully'))
  .catch((error) => console.error('Error synchronizing Leave table:', error));

module.exports = Leave;



