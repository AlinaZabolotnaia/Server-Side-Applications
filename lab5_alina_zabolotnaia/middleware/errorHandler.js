// Централизованная обработка ошибок. Подключается в app.js последним.
// Пользователь видит только код и понятное сообщение: без stack trace, SQL, параметров подключения и .env.
// Подробности пишутся в терминал.

const {
    BaseError,
    ConnectionError,
    ValidationError,
    UniqueConstraintError,
    ForeignKeyConstraintError
} = require('sequelize');

// Ошибка с HTTP-статусом и сообщением, которое безопасно показать пользователю
class HttpError extends Error {
    constructor(status, message, { backLink = null } = {}) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.backLink = backLink;
    }
}

const DEFAULT_MESSAGES = {
    400: 'Некорректные данные запроса.',
    401: 'Для этого действия необходимо выполнить вход.',
    403: 'Недостаточно прав для этого действия.',
    404: 'Страница не найдена.',
    409: 'Конфликт данных.',
    500: 'На сервере произошла внутренняя ошибка. Попробуйте позже.',
    503: 'Нет подключения к базе данных. Попробуйте позже.'
};

// Короткое описание ошибки для терминала (у ECONNREFUSED поле message пустое)
function describeError(error) {
    return error.message || error.parent?.code || error.original?.code || error.name;
}

// Ошибка любого типа → { status, message } для пользователя
function toHttpError(err) {
    if (err instanceof HttpError) {
        return { status: err.status, message: err.message };
    }
    if (err instanceof ConnectionError) {
        return { status: 503, message: DEFAULT_MESSAGES[503] };
    }
    // UniqueConstraintError наследуется от ValidationError, поэтому проверяется раньше
    if (err instanceof UniqueConstraintError) {
        return { status: 409, message: 'Запись с такими данными уже существует.' };
    }
    if (err instanceof ForeignKeyConstraintError) {
        return { status: 409, message: 'Операция нарушает связь между преподавателем и курсами.' };
    }
    if (err instanceof ValidationError) {
        return { status: 400, message: DEFAULT_MESSAGES[400] };
    }
    if (err.status >= 400 && err.status < 500) {   // например, некорректно закодированный URL
        return { status: err.status, message: DEFAULT_MESSAGES[err.status] || DEFAULT_MESSAGES[400] };
    }
    if (err instanceof BaseError) {
        return { status: 500, message: 'Ошибка при работе с базой данных. Попробуйте позже.' };
    }
    return { status: 500, message: DEFAULT_MESSAGES[500] };
}

function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    const { status, message } = toHttpError(err);

    // Терминал: для 5xx полная ошибка, для ожидаемых 4xx одна строка
    if (err instanceof ConnectionError) {
        console.error(`Database connection error: ${describeError(err)}`);
    } else if (status >= 500) {
        console.error(err);
    } else {
        console.warn(`${status} ${req.method} ${req.originalUrl}: ${err.message}`);
    }

    res.status(status);

    if (status === 404) {
        return res.render('404', { title: '404 Not Found', message, url: req.originalUrl });
    }
    if (status === 403) {
        return res.render('403', { title: '403 Forbidden', message });
    }
    res.render('error', { title: 'Ошибка', status, message, backLink: err.backLink || null });
}

module.exports = { HttpError, describeError, errorHandler };
