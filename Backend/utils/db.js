// const dotenv = require('dotenv');
// dotenv.config(); 

// const Sequelize = require('sequelize');

// const sequelize = new Sequelize(process.env.DB_NAME, process.env.USER_NAME, process.env.DB_PASSWORD, {
//     host: process.env.DB_HOST,
//     dialect: process.env.DB_DIALECT, 
// });

// module.exports = sequelize;



const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.USER_NAME, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres', // Make sure to specify the dialect here
  logging: false, // Optional: disable logging
});

module.exports = sequelize;

