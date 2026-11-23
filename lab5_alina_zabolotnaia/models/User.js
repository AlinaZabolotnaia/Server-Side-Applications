// Модель User → таблица "Users"
// В поле password хранится только bcrypt-hash. По умолчанию (defaultScope) hash вообще не загружается
// из базы; для проверки пароля при входе используется отдельный scope 'withPassword'.

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: { args: [2, 100], msg: 'Имя должно содержать от 2 до 100 символов' }
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: { msg: 'Пользователь с таким email уже зарегистрирован' },
        validate: {
            isEmail: { msg: 'Email имеет некорректный формат' }
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Пароль обязателен' }
        }
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        allowNull: false,
        defaultValue: 'user'
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    defaultScope: {
        attributes: { exclude: ['password'] }
    },
    scopes: {
        withPassword: { attributes: { include: ['password'] } }
    }
});
