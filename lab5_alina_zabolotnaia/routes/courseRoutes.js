// Маршруты курсов и статистики.
// Порядок middleware важен: сначала проверка прав (isAdmin), затем загрузка записи, валидация и контроллер.
// Поэтому даже вручную отправленный POST-запрос без прав не дойдёт до базы данных.

const express = require('express');
const courseController = require('../controllers/courseController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const { courseRules, validate, renderCourseForm } = require('../middleware/validation');

const router = express.Router();
const { loadCourse } = courseController;

router.get('/', courseController.redirectToCourses);
router.get('/statistics', isAuthenticated, courseController.showStatistics);

// Просмотр, поиск и фильтрация доступны всем, включая гостей
router.get('/courses', courseController.listCourses);

// /courses/new объявлен раньше /courses/:id, иначе "new" было бы принято за id
router.get('/courses/new', isAdmin, courseController.showCreateForm);
router.post('/courses', isAdmin, courseRules, validate(renderCourseForm), courseController.createCourse);

router.get('/courses/:id', loadCourse, courseController.showCourse);
router.get('/courses/:id/edit', isAdmin, loadCourse, courseController.showEditForm);
router.post('/courses/:id/edit', isAdmin, loadCourse, courseRules, validate(renderCourseForm), courseController.updateCourse);
router.post('/courses/:id/delete', isAdmin, loadCourse, courseController.deleteCourse);

module.exports = router;
