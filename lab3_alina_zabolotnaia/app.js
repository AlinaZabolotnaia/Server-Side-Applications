// Лабораторная работа №3: система управления учебными курсами (Express.js, EJS, middleware)
// Студент: Alina Zabolotnaia (Korsakova), группа IAFR2302

const path = require('path');
const express = require('express');

const logger = require('./middleware/logger');
const courseRoutes = require('./routes/courseRoutes');
const { renderNotFound } = require('./controllers/courseController');

const app = express();
const PORT = 3000;

// Шаблонизатор EJS. path.join(__dirname, ...) даёт абсолютный путь,
// поэтому приложение работает при запуске из любой папки
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware: подключаются до маршрутов и применяются ко всем запросам
app.use(logger);                                            // логирование
app.use(express.urlencoded({ extended: true }));            // данные HTML-форм → req.body
app.use(express.static(path.join(__dirname, 'public')));    // CSS и другие статические файлы

// Маршруты
app.use('/', courseRoutes);

// Неизвестный маршрут → страница 404
app.use((req, res) => {
    renderNotFound(req, res);
});

// Обработчик ошибок (4 аргумента). Stack trace пишем только в терминал, пользователю не показываем
app.use((err, req, res, next) => {
    console.error(err);
    const status = err.status >= 400 && err.status < 500 ? err.status : 500;
    res.status(status).render('error', {
        title: 'Ошибка',
        status,
        message: status === 500
            ? 'На сервере произошла внутренняя ошибка. Попробуйте позже.'
            : 'Некорректный запрос.'
    });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
