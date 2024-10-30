const {DataTypes} =  require('sequelize')
const sequelize = require('../../utils/db')
const LeaveType = require('../models/leaveType')

 const UserLeave = sequelize.define('userLeave',{
   userId : {type : DataTypes.INTEGER, allowNull : true},
   leaveTypeId : { type: DataTypes.INTEGER, allowNull:true},
   noOfDays : {type: DataTypes.FLOAT, allowNull:true, defaultValue: 0},
   takenLeaves : {type :DataTypes.FLOAT, allowNull :true, defaultValue: 0},
   leaveBalance : { type:DataTypes.FLOAT, allowNull:true, defaultValue: 0}
 },{
    freezeTableName :true,
    timestamps : true
 })

 LeaveType.hasMany(UserLeave, { foreignKey: 'leaveTypeId', onUpdate: 'CASCADE' });
 UserLeave.belongsTo(LeaveType);
 

 UserLeave.sync({force:true})
.then(()=>console.log)

module.exports = UserLeave