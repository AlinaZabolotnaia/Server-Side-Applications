// Лабораторная работа №5: аутентификация, авторизация и защита Express-приложения
// (продолжение лабораторной №4: система управления учебными курсами на PostgreSQL + Sequelize)
// Студент: Alina Zabolotnaia (Korsakova), группа IAFR2302

const path = require('path');
const http = require('http');
const express = require('express');
const session = require('express-session');
const { Server } = require('socket.io');

const { sequelize } = require('./models');          // также загружает .env через config/database.js
const { consoleLogger, fileLogger } = require('./middleware/logger');
const { setCurrentUser } = require('./middleware/auth');
const notFound = require('./middleware/notFound');
const { errorHandler, describeError } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const teacherRoutes = require('./routes/teacherRoutes');

const PORT = Number(process.env.PORT) || 3000;

// Без секрета сессии подписать cookie невозможно: останавливаем запуск с понятным сообщением
if (!process.env.SESSION_SECRET) {
    console.error('SESSION_SECRET is not set. Add it to the .env file (see .env.example).');
    process.exit(1);
}

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Логирование запросов: терминал (morgan 'dev') и файл logs/requests.log
app.use(consoleLogger);
app.use(fileLogger);

app.use(express.urlencoded({ extended: true }));
// Express 5 не создаёт req.body, если у запроса нет тела формы; дальше код рассчитывает на объект
app.use((req, res, next) => {
    req.body = req.body || {};
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,                 // не сохранять сессию повторно, если она не менялась
    saveUninitialized: false,      // не создавать сессию (и cookie) для гостя, пока в неё ничего не записали
    cookie: {
        maxAge: 1000 * 60 * 60,    // 1 час
        httpOnly: true,            // cookie недоступна JavaScript на странице
        sameSite: 'lax'            // cookie не отправляется с POST-запросами с чужих сайтов (защита от CSRF)
    }
}));

// currentUser и isAdmin доступны во всех шаблонах
app.use(setCurrentUser);

app.use('/', authRoutes);
app.use('/', courseRoutes);
app.use('/', teacherRoutes);

app.use(notFound);        // после всех маршрутов
app.use(errorHandler);    // последним

// HTTP-сервер создаётся явно, чтобы к нему подключить Socket.IO
const server = http.createServer(app);
const io = new Server(server);
app.set('io', io);        // контроллеры получают io через req.app.get('io')

async function start() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established');

        await sequelize.sync();   // создаёт отсутствующие таблицы (в том числе Users), данные не удаляет
        console.log('Database tables are synchronized');
    } catch (error) {
        console.error(`Unable to connect to the database "${process.env.DB_NAME}" `
            + `at ${process.env.DB_HOST}:${process.env.DB_PORT}: ${describeError(error)}`);
        console.error('Check that PostgreSQL is running and the settings in .env are correct.');
    }

    server.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });
}

start();
