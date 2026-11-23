// Обработка 404 и ошибок приложения. Пользователь видит понятное сообщение, stack trace пишется только в терминал

const { BaseError, ConnectionError } = require('sequelize');

// Короткое описание ошибки подключения: у ECONNREFUSED поле message пустое, поэтому берём код ошибки
function describeError(error) {
    return error.message || error.parent?.code || error.original?.code || error.name;
}

function renderNotFound(req, res, message = 'Страница не найдена') {
    res.status(404).render('404', { title: '404 Not Found', message, url: req.originalUrl });
}

function renderError(res, status, message) {
    res.status(status).render('error', { title: 'Ошибка', status, message });
}

// Последний обычный middleware: ни один маршрут не подошёл
function notFound(req, res) {
    renderNotFound(req, res);
}

// Обработчик ошибок (4 аргумента)
function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof ConnectionError) {
        // Для ошибки подключения достаточно одной строки, stack trace здесь ничего не добавляет
        console.error(`Database connection error: ${describeError(err)}`);
        return renderError(res, 503,
            'Нет подключения к базе данных. Проверьте, что PostgreSQL запущен и параметры в .env указаны верно.');
    }

    console.error(err);

    if (err.status >= 400 && err.status < 500) {
        return renderError(res, err.status, 'Некорректный запрос.');
    }
    if (err instanceof BaseError) {
        return renderError(res, 500, 'Ошибка при работе с базой данных. Попробуйте позже.');
    }
    renderError(res, 500, 'На сервере произошла внутренняя ошибка. Попробуйте позже.');
}

module.exports = { describeError, renderNotFound, renderError, notFound, errorHandler };
