const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');

const Holiday = sequelize.define('holiday',{
    name : {type : DataTypes.STRING, allowNull : false},
    type : {type : DataTypes.STRING, allowNull : false},
    comments : {type : DataTypes.STRING},
    date  : {type : DataTypes.DATEONLY, allowNull : false},
    comboAdded : {type: DataTypes.BOOLEAN, defaultValue : false},
    comboAddedFor : {type: DataTypes.INTEGER, defaultValue : 0}
},
{
    freezeTableName: true,
    timestamps : false
})

Holiday.sync({ force: true })
  .then(() => console.log("Holiday table Sync"))
  .catch((err) => console.log("Error syncing table Holiday:", err));


module.exports = Holiday;


