// Контроллер книг: принимает запрос, обращается к модели и формирует ответ

const bookModel = require('../models/bookModel');
const authorModel = require('../models/authorModel');

const REQUIRED_FIELDS = ['title', 'authorId', 'genre', 'year'];

// Проверка типов переданных полей; возвращает текст ошибки или null
function validateFields(data) {
    if ('title' in data && (typeof data.title !== 'string' || data.title.trim() === '')) {
        return 'title must be a non-empty string';
    }
    if ('genre' in data && (typeof data.genre !== 'string' || data.genre.trim() === '')) {
        return 'genre must be a non-empty string';
    }
    if ('authorId' in data && !Number.isInteger(data.authorId)) {
        return 'authorId must be an integer';
    }
    if ('year' in data && !Number.isInteger(data.year)) {
        return 'year must be an integer';
    }
    // Задание 8.3: нельзя ссылаться на несуществующего автора
    if ('authorId' in data && !authorModel.findById(data.authorId)) {
        return 'Author not found';
    }
    return null;
}

// GET /api/books, GET /api/books?genre=fantasy&year=1937
function getBooks(req, res) {
    const { genre, year } = req.query;
    const filters = {};

    if (genre !== undefined) {
        filters.genre = genre;
    }
    if (year !== undefined) {
        filters.year = Number(year);
        if (!Number.isInteger(filters.year)) {
            return res.status(400).json({ error: 'year must be an integer' });
        }
    }

    res.status(200).json(bookModel.getAll(filters));
}

// GET /api/books/search?title=node
function searchBooks(req, res) {
    const { title } = req.query;
    if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Query parameter title is required' });
    }
    res.status(200).json(bookModel.searchByTitle(title.trim()));
}

// GET /api/books/:id
function getBookById(req, res) {
    const book = bookModel.findById(Number(req.params.id));
    if (!book) {
        return res.status(404).json({ error: 'Book not found' });
    }
    res.status(200).json(book);
}

// POST /api/books
function createBook(req, res) {
    const data = req.body || {};

    const missing = REQUIRED_FIELDS.filter((field) => data[field] === undefined || data[field] === null);
    if (missing.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    const error = validateFields(data);
    if (error) {
        return res.status(400).json({ error });
    }

    const book = bookModel.create({
        title: data.title.trim(),
        authorId: data.authorId,
        genre: data.genre.trim(),
        year: data.year
    });
    res.status(201).json(book);
}

// PATCH /api/books/:id: меняются только переданные поля
function updateBook(req, res) {
    const id = Number(req.params.id);
    if (!bookModel.findById(id)) {
        return res.status(404).json({ error: 'Book not found' });
    }

    const data = req.body || {};
    const changes = {};
    for (const field of REQUIRED_FIELDS) {
        if (data[field] !== undefined) {
            changes[field] = data[field];
        }
    }

    if (Object.keys(changes).length === 0) {
        return res.status(400).json({ error: `Provide at least one field to update: ${REQUIRED_FIELDS.join(', ')}` });
    }

    const error = validateFields(changes);
    if (error) {
        return res.status(400).json({ error });
    }

    res.status(200).json(bookModel.update(id, changes));
}

// DELETE /api/books/:id
function deleteBook(req, res) {
    const book = bookModel.remove(Number(req.params.id));
    if (!book) {
        return res.status(404).json({ error: 'Book not found' });
    }
    res.status(200).json({ message: 'Book deleted', book });
}

module.exports = { getBooks, searchBooks, getBookById, createBook, updateBook, deleteBook };
