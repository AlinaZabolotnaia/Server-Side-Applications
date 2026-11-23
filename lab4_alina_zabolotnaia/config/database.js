// Подключение Sequelize к PostgreSQL. Параметры берутся из файла .env

const path = require('path');
// quiet: true отключает служебное сообщение dotenv в терминале
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false
    }
);

module.exports = sequelize;
