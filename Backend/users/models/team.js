/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('./user');
const TeamMember = require('./teamMember');


const Team = sequelize.define('team', {
    teamName: { type: DataTypes.STRING },
    userId: { type: DataTypes.INTEGER },
}, {
    freezeTableName: true
});

Team.sync({alter:true})
.then(()=>console.log)


Team.belongsTo(User, {
    foreignKey: "userId",
    as: "leader",
  });


  Team.hasMany(TeamMember, { foreignKey: "teamId" });
  TeamMember.belongsTo(Team);

  User.hasMany(TeamMember, { foreignKey: "userId"});
  TeamMember.belongsTo(User, { foreignKey: "userId"});

module.exports = Team;
