// Лабораторная работа №4: система управления учебными курсами (PostgreSQL + Sequelize)
// Студент: Alina Zabolotnaia (Korsakova), группа IAFR2302

const path = require('path');
const express = require('express');

const { sequelize } = require('./models');          // также загружает .env через config/database.js
const logger = require('./middleware/logger');
const { describeError, notFound, errorHandler } = require('./middleware/errorHandler');
const courseRoutes = require('./routes/courseRoutes');
const teacherRoutes = require('./routes/teacherRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(logger);
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', courseRoutes);
app.use('/', teacherRoutes);

app.use(notFound);
app.use(errorHandler);

// Проверка соединения с базой и создание таблиц, затем запуск сервера.
// Если база недоступна, выводим понятное сообщение; сервер всё равно запускается
// и показывает страницу ошибки 503 вместо аварийного завершения.
async function start() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established');

        await sequelize.sync();   // создаёт отсутствующие таблицы, существующие данные не трогает
        console.log('Database tables are synchronized');
    } catch (error) {
        console.error(`Unable to connect to the database "${process.env.DB_NAME}" `
            + `at ${process.env.DB_HOST}:${process.env.DB_PORT}: ${describeError(error)}`);
        console.error('Check that PostgreSQL is running and the settings in .env are correct.');
    }

    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
}

start();
