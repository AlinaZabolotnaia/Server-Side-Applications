// Модель книг: хранит данные и функции доступа к ним

const books = [
    { id: 1, title: 'The Hobbit', authorId: 1, genre: 'fantasy', year: 1937 },
    { id: 2, title: '1984', authorId: 2, genre: 'dystopia', year: 1949 },
    { id: 3, title: 'The Lord of the Rings', authorId: 1, genre: 'fantasy', year: 1954 },
    { id: 4, title: 'Animal Farm', authorId: 2, genre: 'satire', year: 1945 },
    { id: 5, title: 'The Clean Coder', authorId: 3, genre: 'programming', year: 2011 },
    { id: 6, title: 'Node.js Design Patterns', authorId: 4, genre: 'programming', year: 2014 }
];

// Следующий свободный id: максимальный существующий + 1
function nextId() {
    return books.length === 0 ? 1 : Math.max(...books.map((book) => book.id)) + 1;
}

// Все книги; если переданы genre и/или year, применяется фильтрация
function getAll({ genre, year } = {}) {
    return books.filter((book) =>
        (genre === undefined || book.genre.toLowerCase() === genre.toLowerCase()) &&
        (year === undefined || book.year === year)
    );
}

function findById(id) {
    return books.find((book) => book.id === id);
}

function findByAuthorId(authorId) {
    return books.filter((book) => book.authorId === authorId);
}

// Поиск по части названия без учёта регистра
function searchByTitle(text) {
    const query = text.toLowerCase();
    return books.filter((book) => book.title.toLowerCase().includes(query));
}

function create({ title, authorId, genre, year }) {
    const book = { id: nextId(), title, authorId, genre, year };
    books.push(book);
    return book;
}

function update(id, changes) {
    const book = findById(id);
    if (!book) {
        return null;
    }
    Object.assign(book, changes);
    return book;
}

function remove(id) {
    const index = books.findIndex((book) => book.id === id);
    if (index === -1) {
        return null;
    }
    return books.splice(index, 1)[0];
}

module.exports = { getAll, findById, findByAuthorId, searchByTitle, create, update, remove };
