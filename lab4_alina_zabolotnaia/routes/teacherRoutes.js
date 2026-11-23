// Маршруты преподавателей

const express = require('express');
const teacherController = require('../controllers/teacherController');
const { validateTeacher } = require('../middleware/validateData');

const router = express.Router();

router.param('id', teacherController.loadTeacher);

router.get('/teachers', teacherController.listTeachers);
router.get('/teachers/new', teacherController.showCreateForm);
router.post('/teachers', validateTeacher, teacherController.createTeacher);

router.get('/teachers/:id', teacherController.showTeacher);
router.get('/teachers/:id/edit', teacherController.showEditForm);
router.post('/teachers/:id/edit', validateTeacher, teacherController.updateTeacher);
router.post('/teachers/:id/delete', teacherController.deleteTeacher);

module.exports = router;
