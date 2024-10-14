const {DataTypes} =  require('sequelize')
const sequelize = require('../../utils/db')
const LeaveType = require('../models/leaveType')

 const UserAssets = sequelize.define('userAssets',{
    userId: { type: DataTypes.INTEGER, allowNull: false },
    assets : { type : DataTypes.ARRAY(DataTypes.STRING), allowNull:false}
 },{
    freezeTableName :true,
    timestamps : true
 })


 UserAssets.sync({alter:true})
.then(()=>console.log)

module.exports = UserAssets