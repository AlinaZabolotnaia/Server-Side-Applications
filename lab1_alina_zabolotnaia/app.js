// Лабораторная работа №1: простой HTTP-сервер на Node.js
// Студент: Alina Zabolotnaia (Korsakova), группа IAFR2302

const http = require('http');

const PORT = 3000;

const student = {
    name: 'Alina',
    surname: 'Zabolotnaia (Korsakova)',
    group: 'IAFR2302',
    speciality: 'Applied Informatics'
};

const courses = [
    { title: 'Dezvoltarea aplicațiilor Server-Side', teacher: 'Вишневски Влада', credits: 5 },
    { title: 'Testarea produselor software', teacher: 'Вишневски Влада', credits: 5 },
    { title: 'Metode de analiză statistică', teacher: 'Вишневски Влада', credits: 4 }
];

const quotes = [
    'First, solve the problem. Then, write the code.',
    'Simplicity is the soul of efficiency.',
    'Make it work, make it right, make it fast.'
];

// Дата и время в формате DD.MM.YYYY HH:MM
function formatDateTime(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} `
         + `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Отправка обычного текста
function sendText(res, statusCode, text) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(text);
}

// Отправка JSON
function sendJson(res, statusCode, data) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data, null, 2));
}

const server = http.createServer((req, res) => {
    // Логирование каждого запроса: HTTP Method | URL | Date and Time
    console.log(`${req.method} ${req.url} | ${formatDateTime(new Date())}`);

    if (req.method === 'GET' && req.url === '/') {
        sendText(res, 200, 'Welcome! This is my first Node.js server.');
    }
    else if (req.method === 'GET' && req.url === '/about') {
        sendText(res, 200, 'Lab 1: a simple HTTP server built with the Node.js http module, without frameworks.');
    }
    else if (req.method === 'GET' && req.url === '/student') {
        sendText(res, 200, `Student: ${student.name} ${student.surname}, group ${student.group}`);
    }
    else if (req.method === 'GET' && req.url === '/api/student') {
        sendJson(res, 200, student);
    }
    else if (req.method === 'GET' && req.url === '/time') {
        sendText(res, 200, `Current date and time: ${formatDateTime(new Date())}`);
    }
    else if (req.method === 'GET' && req.url === '/api/courses') {
        sendJson(res, 200, courses);
    }
    // Собственный маршрут: случайная цитата о программировании
    else if (req.method === 'GET' && req.url === '/quote') {
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        sendText(res, 200, quote);
    }
    else {
        // Настоящий HTTP status code 404, а не только текст на странице
        sendText(res, 404, '404 - Page not found');
    }
});

server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
