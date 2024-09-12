const {DataTypes} =  require('sequelize')
const sequelize = require('../../utils/db')

 const UserLeave = sequelize.define('userLeave',{
   userId : {type : DataTypes.INTEGER, allowNull : false},
   leaveTypeId : { type: DataTypes.INTEGER, allowNull:false},
   noOfDays : {type: DataTypes.INTEGER,allowNull:false},
   takenLeaves : {type :DataTypes.INTEGER,allowNull :false},
   leaveBalance : { type:DataTypes.INTEGER, allowNull:false}


 },{
    freezeTableName :true,
    timestamps : false
 })
 UserLeave.sync({alter:true})
.then(()=>console.log)

module.exports = UserLeave