const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');

// Define the LeaveType model
const LeaveType = sequelize.define('leaveType', {
  leaveTypeName: { type: DataTypes.STRING, allowNull: true },
}, {
  freezeTableName: true,
  timestamps: true, // Change to true if you want to track createdAt and updatedAt
});

// Sample leave type data to initialize the table
const leaveTypeData = [
  { leaveTypeName: 'Casual Leave' },
  { leaveTypeName: 'Sick Leave' },
  { leaveTypeName: 'LOP' },
  { leaveTypeName: 'Emergency Leave' },
];

// Function to initialize leave types if the table is empty
const initializeLeaveTypes = async () => {
  try {
    const leaveTypes = await LeaveType.findAll();
    if (!leaveTypes.length) {
      await LeaveType.bulkCreate(leaveTypeData);
      console.log('Leave types initialized successfully.');
    } else {
      console.log('Leave types already exist in the database.');
    }
  } catch (error) {
    console.error('Error initializing leave types:', error);
  }
};

// Sync the LeaveType model with the database and initialize leave types
LeaveType.sync({ alter: true })
  .then(initializeLeaveTypes)
  .catch(error => console.error('Error syncing LeaveType model:', error));

module.exports = LeaveType;
