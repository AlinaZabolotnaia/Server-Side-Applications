// Маршруты книг: связывают URL и HTTP-метод с функцией контроллера

const express = require('express');
const bookController = require('../controllers/bookController');

const router = express.Router();

// /search объявлен раньше /:id, иначе слово "search" было бы принято за id
router.get('/search', bookController.searchBooks);

router.get('/', bookController.getBooks);
router.get('/:id', bookController.getBookById);
router.post('/', bookController.createBook);
router.patch('/:id', bookController.updateBook);
router.delete('/:id', bookController.deleteBook);

module.exports = router;
