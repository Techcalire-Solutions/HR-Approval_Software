const {DataTypes} =  require('sequelize')
const sequelize = require('../../utils/db')

 const LeaveType = sequelize.define('leaveType',{
   leaveTypeName : {type : DataTypes.STRING, allowNull : true},

 },{
    freezeTableName :true,
    timestamps : false
 })
// Data to be inserted
const leaveTypeData = [
  { leaveTypeName: 'Casual Leave' },
  { leaveTypeName: 'Sick Leave' },
  { leaveTypeName: 'LOP' },
  { leaveTypeName: 'Emergency Leave' },
  // { leaveTypeName: 'Maternity Leave' },
  // { leaveTypeName: 'Paternity Leave' },
];

// Initialize leave types if none exist
const initializeLeaveTypes = async () => {
  try {
    const leaveTypes = await LeaveType.findAll();
    if (leaveTypes.length === 0) {
      await LeaveType.bulkCreate(leaveTypeData);
      console.log('Leave types have been added successfully');
    } else {
      console.log('Leave types already exist');
    }
  } catch (error) {
    console.error('Error during leave type initialization:', error);
  }
};

// Sync the model and run initialization
LeaveType.sync({ alter: true })
  .then(() => {
    initializeLeaveTypes();
  })
  .catch(error => {
    console.error('Error syncing LeaveType model:', error);
  });

module.exports = LeaveType