const {DataTypes} =  require('sequelize')
const sequelize = require('../../utils/db')

const Leave = sequelize.define('leave',{
    userId: {type : DataTypes.INTEGER, allowNull : false},
    leaveTypeId : {type : DataTypes.INTEGER},
    startDate : {type : DataTypes.DATE, allowNull : true},
    endDate : {type : DataTypes.DATE, allowNull : true},
    noOfDays : {type : DataTypes.FLOAT},
    notes : { type : DataTypes.STRING, allowNull : true },
    status : { type : DataTypes.STRING, allowNull : true },
    session1: { type: DataTypes.BOOLEAN, default: false }, // Morning session
    session2: { type: DataTypes.BOOLEAN, default: false }, // Afternoon session
    leaveDates: { type: DataTypes.JSON, allowNull: true }, 
},
{
    freezeTableName :true,
    timestamps : true 
})

Leave.sync({alter: true})
.then(()=>console.log)

module.exports = Leave

