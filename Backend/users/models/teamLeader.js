const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('./user');
const Team = require('./team');

const TeamLeader = sequelize.define('team_leader', {
    teamId: { type: DataTypes.INTEGER},
    userId: { type: DataTypes.INTEGER }
}, { freezeTableName: true });

User.hasMany(TeamLeader, { foreignKey: 'userId', onUpdate: 'CASCADE' });
TeamLeader.belongsTo(User);

Team.hasMany(TeamLeader, { foreignKey: 'teamId', onUpdate: 'CASCADE' });
TeamLeader.belongsTo(Team);

TeamLeader.sync({ alter: true })
  .then(() => console.log("TeamLeader table Sync"))
  .catch((err) => console.log("Error syncing table TeamLeader:", err));

module.exports = TeamLeader;

