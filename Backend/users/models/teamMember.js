/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const Team = require('./team');
const User = require('./user');

const TeamMember = sequelize.define('team_member', {
    teamId: { type: DataTypes.INTEGER },
    userId: { type: DataTypes.INTEGER }
}, { freezeTableName: true });

User.hasMany(TeamMember, { foreignKey: 'userId', onUpdate: 'CASCADE' });
TeamMember.belongsTo(User);

Team.hasMany(TeamMember, { foreignKey: 'teamId', onUpdate: 'CASCADE' });
TeamMember.belongsTo(Team);

TeamMember.sync({ alter: true })
  .then(() => console.log("TeamMenber table Sync"))
  .catch((err) => console.log("Error syncing table TeamMember:", err));

module.exports = TeamMember;