const {DataTypes} =  require('sequelize')
const sequelize = require('../../utils/db')

 const LeaveType = sequelize.define('leaveType',{
   leaveTypeName : {type : DataTypes.STRING, allowNull : true},

 },{
    freezeTableName :true,
    timestamps : false
 })
const leaveTypeData = [
  { leaveTypeName: 'Casual Leave' },
  { leaveTypeName: 'Sick Leave' },
  { leaveTypeName: 'LOP' },
  { leaveTypeName: 'Emergency Leave' },

];


// const initializeLeaveTypes = async () => {
//   try {
//     const leaveTypes = await LeaveType.findAll();
//     if (!leaveTypes.length) await LeaveType.bulkCreate(leaveTypeData);
//   } catch (error) {
  
//   }
// };

// LeaveType.sync({ alter: true })
//   .then(initializeLeaveTypes)
//   .catch(error => console.error('Error syncing LeaveType model:', error));


module.exports = LeaveType