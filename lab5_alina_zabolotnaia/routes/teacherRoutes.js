// Маршруты преподавателей. Просмотр доступен всем, изменения только администратору

const express = require('express');
const teacherController = require('../controllers/teacherController');
const { isAdmin } = require('../middleware/auth');
const { teacherRules, validate, renderTeacherForm } = require('../middleware/validation');

const router = express.Router();
const { loadTeacher } = teacherController;

router.get('/teachers', teacherController.listTeachers);
router.get('/teachers/new', isAdmin, teacherController.showCreateForm);
router.post('/teachers', isAdmin, teacherRules, validate(renderTeacherForm), teacherController.createTeacher);

router.get('/teachers/:id', loadTeacher, teacherController.showTeacher);
router.get('/teachers/:id/edit', isAdmin, loadTeacher, teacherController.showEditForm);
router.post('/teachers/:id/edit', isAdmin, loadTeacher, teacherRules, validate(renderTeacherForm), teacherController.updateTeacher);
router.post('/teachers/:id/delete', isAdmin, loadTeacher, teacherController.deleteTeacher);

module.exports = router;
