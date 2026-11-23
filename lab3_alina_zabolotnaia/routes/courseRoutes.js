// Маршруты приложения: связывают метод и URL с функциями контроллера

const express = require('express');
const courseController = require('../controllers/courseController');
const validateCourse = require('../middleware/validateCourse');

const router = express.Router();

// Для каждого маршрута с :id сначала ищем курс (или показываем 404)
router.param('id', courseController.loadCourse);

router.get('/', courseController.redirectToCourses);

router.get('/courses', courseController.listCourses);
// /courses/new объявлен раньше /courses/:id, иначе "new" было бы принято за id
router.get('/courses/new', courseController.showCreateForm);
router.post('/courses', validateCourse, courseController.createCourse);

router.get('/courses/:id', courseController.showCourse);
router.get('/courses/:id/edit', courseController.showEditForm);
router.post('/courses/:id/edit', validateCourse, courseController.updateCourse);
router.post('/courses/:id/delete', courseController.deleteCourse);

module.exports = router;
