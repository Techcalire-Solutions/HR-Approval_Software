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
    allowNull: true, 
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
    defaultValue: false, 
  },
  session2: {
    type: DataTypes.BOOLEAN,
    defaultValue: false, 
  },
  fileUrl: { 
    type: DataTypes.STRING
   },
  leaveDates: {
    type: DataTypes.JSON, 
    allowNull: true,
  },
},
{
  freezeTableName: true,
  timestamps: true, 
});


LeaveType.hasMany(Leave, { foreignKey: 'leaveTypeId', onUpdate: 'CASCADE' });
Leave.belongsTo(LeaveType);





Leave.sync({ alter: true })
  .then(() => console.log('Leave table synchronized successfully'))
  .catch((error) => console.error('Error synchronizing Leave table:', error));

module.exports = Leave;



