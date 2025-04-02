/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */

const {DataTypes} =  require('sequelize')
const sequelize = require('../../utils/db')

 const ComboOff = sequelize.define('comboOff',{
    userId: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: true },
    holidayId : { type : DataTypes.INTEGER, allowNull :true}
 },{
    freezeTableName :true,
    timestamps : true
 })


 ComboOff.sync({alter:true})
.then(()=>console.log)

module.exports = ComboOff