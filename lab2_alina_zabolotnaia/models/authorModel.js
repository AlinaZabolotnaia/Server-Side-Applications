// Модель авторов: хранит данные и функции доступа к ним

const authors = [
    { id: 1, name: 'J. R. R. Tolkien', country: 'United Kingdom' },
    { id: 2, name: 'George Orwell', country: 'United Kingdom' },
    { id: 3, name: 'Robert C. Martin', country: 'United States' },
    { id: 4, name: 'Mario Casciaro', country: 'Italy' }
];

function getAll() {
    return authors;
}

function findById(id) {
    return authors.find((author) => author.id === id);
}

function count() {
    return authors.length;
}

module.exports = { getAll, findById, count };
