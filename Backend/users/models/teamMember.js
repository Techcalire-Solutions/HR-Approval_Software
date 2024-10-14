const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');

const TeamMember = sequelize.define('teamMember', {
    teamId: { type: DataTypes.INTEGER },
    userId: { type: DataTypes.INTEGER },

},
    {
        freezeTableName: true
    })


TeamMember.sync({alter:true})
.then(()=>console.log)

module.exports = TeamMember;