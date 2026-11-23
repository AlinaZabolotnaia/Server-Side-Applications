// Модель Teacher → таблица "Teachers"

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Teacher', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Имя преподавателя обязательно' }
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: { msg: 'Этот email уже используется другим преподавателем' },
        validate: {
            notEmpty: { msg: 'Email обязателен' },
            isEmail: { msg: 'Email имеет некорректный формат' }
        }
    },
    department: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Кафедра обязательна' }
        }
    },
    academicDegree: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Учёная степень обязательна' }
        }
    }
});
