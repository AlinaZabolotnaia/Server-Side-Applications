// Логирование: HTTP-запросы через morgan (терминал + файл logs/requests.log) и журнал действий администратора

const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const REQUEST_LOG = path.join(LOG_DIR, 'requests.log');

function formatDateTime(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} `
         + `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Собственный токен morgan: дата и время запроса в формате DD.MM.YYYY HH:MM
morgan.token('date-local', () => formatDateTime(new Date()));

// Запись в файл: POST /login | 200 | 15 ms | 18.11.2026 14:35
const FILE_FORMAT = ':method :url | :status | :response-time[0] ms | :date-local';

fs.mkdirSync(LOG_DIR, { recursive: true });
const fileStream = fs.createWriteStream(REQUEST_LOG, { flags: 'a' });   // 'a': дописывать в конец

// Терминал: стандартный формат 'dev' (цветной статус)
const consoleLogger = morgan('dev');
// Файл
const fileLogger = morgan(FILE_FORMAT, { stream: fileStream });

// ADMIN ACTION | admin@example.com | DELETE COURSE | Course ID: 5 | 18.11.2026 14:35
function logAdminAction(req, action, entity, id) {
    const email = req.session.user ? req.session.user.email : 'unknown';
    console.log(`ADMIN ACTION | ${email} | ${action} ${entity.toUpperCase()} | ${entity} ID: ${id} | ${formatDateTime(new Date())}`);
}

module.exports = { consoleLogger, fileLogger, logAdminAction, formatDateTime };
