const {DataTypes} =  require('sequelize')
const sequelize = require('../../utils/db')

const Leave = sequelize.define('leave',{
    userId: {type : DataTypes.INTEGER}
},
{
    freezeTableName :true,
    timestamps : false
})

Leave.sync({alter:true})
.then(()=>console.log)

