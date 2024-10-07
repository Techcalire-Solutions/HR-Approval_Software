const {DataTypes} =  require('sequelize')
const sequelize = require('../../utils/db')

 const UserLeave = sequelize.define('userLeave',{
   userId : {type : DataTypes.INTEGER, allowNull : true},
   leaveTypeId : { type: DataTypes.INTEGER, allowNull:true},
   noOfDays : {type: DataTypes.INTEGER, allowNull:true, defaultValue: 0},
   takenLeaves : {type :DataTypes.FLOAT, allowNull :true, defaultValue: 0},
   leaveBalance : { type:DataTypes.FLOAT, allowNull:true, defaultValue: 0}
 },{
    freezeTableName :true,
    timestamps : true
 })
 
 UserLeave.sync({alter:true})
.then(()=>console.log)

module.exports = UserLeave