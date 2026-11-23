// Контроллер статистики (задание 8.2)

const bookModel = require('../models/bookModel');
const authorModel = require('../models/authorModel');

// GET /api/statistics
function getStatistics(req, res) {
    const books = bookModel.getAll();
    const genres = [...new Set(books.map((book) => book.genre))];

    // reduce проходит по массиву и оставляет книгу с наибольшим / наименьшим годом
    const newestBook = books.length ? books.reduce((a, b) => (b.year > a.year ? b : a)) : null;
    const oldestBook = books.length ? books.reduce((a, b) => (b.year < a.year ? b : a)) : null;

    res.status(200).json({
        booksCount: books.length,
        authorsCount: authorModel.count(),
        genresCount: genres.length,
        genres,
        newestBook,
        oldestBook
    });
}

module.exports = { getStatistics };
