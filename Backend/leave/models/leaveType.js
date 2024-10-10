const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');

const LeaveType = sequelize.define('leaveType', {
  leaveTypeName: { type: DataTypes.STRING, allowNull: true },
}, {
  freezeTableName: true,
  timestamps: true,
});

const leaveTypeData = [
  { leaveTypeName: 'Casual Leave' },
  { leaveTypeName: 'Sick Leave' },
  { leaveTypeName: 'LOP' },
  { leaveTypeName: 'Comb Off' },
];

const initializeLeaveTypes = async () => {
  const leaveTypes = await LeaveType.findAll();
  if (!leaveTypes.length) await LeaveType.bulkCreate(leaveTypeData);
};

LeaveType.sync({ alter: true })
  .then(initializeLeaveTypes)
  .catch(console.error);

module.exports = LeaveType;
