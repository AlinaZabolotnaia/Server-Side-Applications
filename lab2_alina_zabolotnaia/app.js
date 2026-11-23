// Лабораторная работа №2: REST API на Express.js (MVC)
// Студент: Alina Zabolotnaia (Korsakova), группа IAFR2302

const express = require('express');

const logger = require('./middleware/logger');
const bookRoutes = require('./routes/bookRoutes');
const authorRoutes = require('./routes/authorRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');

const app = express();
const PORT = 3000;

app.set('json spaces', 2);  // JSON-ответы с отступами, удобнее читать в браузере

// Middleware, общие для всех маршрутов
app.use(logger);            // логирование каждого запроса
app.use(express.json());    // разбор JSON из тела запроса в req.body

// Подключение маршрутов
app.use('/api/books', bookRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/statistics', statisticsRoutes);

// Неизвестный маршрут: срабатывает, если ни один маршрут выше не подошёл
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Обработчик ошибок (4 аргумента): например, некорректный JSON в теле запроса
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
