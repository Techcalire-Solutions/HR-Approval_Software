const Sequelize = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.USER_NAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres'
});

  
// module.exports = sequelize

// const sequelize = new Sequelize('wac_approval_db', 'wac', 'Wac@Jan2023', {
//   host: 'localhost',
//   dialect: 'postgres'
// });


module.exports = sequelize