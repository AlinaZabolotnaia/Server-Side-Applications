// Модель Course → таблица "Courses"

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Course', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Название дисциплины обязательно' }
        }
    },
    credits: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isInt: { msg: 'Количество кредитов должно быть целым числом' },
            min: { args: [1], msg: 'Количество кредитов должно быть положительным числом' }
        }
    },
    semester: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isInt: { msg: 'Семестр должен быть целым числом' },
            min: { args: [1], msg: 'Семестр должен находиться в диапазоне от 1 до 8' },
            max: { args: [8], msg: 'Семестр должен находиться в диапазоне от 1 до 8' }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Описание обязательно' }
        }
    },
    // Внешний ключ на Teachers.id. Сама связь настраивается в models/index.js
    teacherId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
});
