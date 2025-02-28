/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
const { DataTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const User = require('../../users/models/user')


const Notification = sequelize.define('notification', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User, 
            key: 'id',
        },
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false, 
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    route: {
        type: DataTypes.STRING,
        allowNull: true, 
    },
}, {
    freezeTableName: true,
    timestamps: false,
});


User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User);

Notification.sync({ alter: true }).then(() => {
    console.log('Notification table synced successfully.');
}).catch(err => {
    console.error('Error syncing notification table:', err);
});


module.exports = Notification;
