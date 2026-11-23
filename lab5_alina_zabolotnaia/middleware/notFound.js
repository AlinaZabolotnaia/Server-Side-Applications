// Подключается после всех маршрутов: если ни один не подошёл, передаём 404 в errorHandler

const { HttpError } = require('./errorHandler');

function notFound(req, res, next) {
    next(new HttpError(404, 'Страница не найдена'));
}

module.exports = notFound;
