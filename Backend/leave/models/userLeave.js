const {DataTypes} =  require('sequelize')
const sequelize = require('../../utils/db')
const LeaveType = require('../models/leaveType');
const User = require('../../users/models/user');

 const UserLeave = sequelize.define('userLeave',{
   userId : {type : DataTypes.INTEGER, allowNull : true},
   leaveTypeId : { type: DataTypes.INTEGER, allowNull:true},
   noOfDays : {type: DataTypes.FLOAT, allowNull:true, defaultValue: 0},
   takenLeaves : {type :DataTypes.FLOAT, allowNull :true, defaultValue: 0},
   leaveBalance : { type:DataTypes.FLOAT, allowNull:true, defaultValue: 0},
   year : {type: DataTypes.INTEGER}
 },{
    freezeTableName :true,
    timestamps : true,
    tableName: 'userLeave'
 })

 LeaveType.hasMany(UserLeave, { foreignKey: 'leaveTypeId', onUpdate: 'CASCADE' });
 UserLeave.belongsTo(LeaveType, {as: 'leaveType'});
 
 User.hasMany(UserLeave, { foreignKey: 'userId', onUpdate: 'CASCADE' });
 UserLeave.belongsTo(User);

 UserLeave.sync({force: true})
.then(()=>console.log)

module.exports = UserLeave