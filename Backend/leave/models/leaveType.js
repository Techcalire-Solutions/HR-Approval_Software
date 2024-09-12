const {DataTypes} =  require('sequelize')
const sequelize = require('../../utils/db')

 const LeaveType = sequelize.define('leaveType',{
   leaveTypeName : {type : DataTypes.STRING, allowNull : true},

 },{
    freezeTableName :true,
    timestamps : false
 })
 LeaveType.sync({alter:true})
.then(()=>console.log)

module.exports = LeaveType