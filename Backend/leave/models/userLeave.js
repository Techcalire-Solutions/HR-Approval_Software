const {DataTypes} =  require('sequelize')
const sequelize = require('../../utils/db')

 const UserLeave = sequelize.define('userLeave',{
   userId : {type : DataTypes.INTEGER, allowNull : true},
   leaveTypeId : { type: DataTypes.INTEGER, allowNull:true},
   noOfDays : {type: DataTypes.INTEGER,allowNull:true},
   takenLeaves : {type :DataTypes.INTEGER,allowNull :true},
   leaveBalance : { type:DataTypes.INTEGER, allowNull:true}


 },{
    freezeTableName :true,
    timestamps : true
 })
//  UserLeave.sync({alter:true})
// .then(()=>console.log)

module.exports = UserLeave