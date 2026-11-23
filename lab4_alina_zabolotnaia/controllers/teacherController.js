// Контроллер преподавателей

const { ValidationError, ForeignKeyConstraintError } = require('sequelize');
const { Teacher } = require('../models');
const { parseId, toFieldErrors } = require('../middleware/validateData');
const { renderNotFound, renderError } = require('../middleware/errorHandler');

const HAS_COURSES_MESSAGE = 'Невозможно удалить преподавателя, у которого есть курсы';

// router.param('id'): для всех маршрутов /teachers/:id находит преподавателя или отвечает 400/404
async function loadTeacher(req, res, next, value) {
    try {
        const id = parseId(String(value));
        if (id === null) {
            return renderError(res, 400, `Некорректный ID преподавателя: «${value}». ID должен быть положительным целым числом.`);
        }
        const teacher = await Teacher.findByPk(id);
        if (!teacher) {
            return renderNotFound(req, res, `Преподаватель с ID ${id} не найден`);
        }
        req.teacher = teacher;
        next();
    } catch (error) {
        next(error);
    }
}

// Страница преподавателя с курсами, полученными через связь (teacher.getCourses)
async function renderTeacherDetails(res, teacher, { status = 200, error = null } = {}) {
    const courses = await teacher.getCourses({ order: [['semester', 'ASC'], ['title', 'ASC']] });
    res.status(status).render('teachers/details', { title: teacher.name, teacher, courses, error });
}

// GET /teachers
async function listTeachers(req, res, next) {
    try {
        const teachers = await Teacher.findAllWithCourseCount();
        res.render('teachers/index', { title: 'Преподаватели', teachers });
    } catch (error) {
        next(error);
    }
}

// GET /teachers/new
function showCreateForm(req, res) {
    res.render('teachers/create', {
        title: 'Новый преподаватель',
        teacher: { name: '', email: '', department: '', academicDegree: '' },
        errors: {}
    });
}

// POST /teachers
async function createTeacher(req, res, next) {
    try {
        await Teacher.create(req.teacherData);
        res.redirect('/teachers');
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).render('teachers/create', {
                title: 'Новый преподаватель', teacher: req.teacherData, errors: toFieldErrors(error)
            });
        }
        next(error);
    }
}

// GET /teachers/:id
async function showTeacher(req, res, next) {
    try {
        await renderTeacherDetails(res, req.teacher);
    } catch (error) {
        next(error);
    }
}

// GET /teachers/:id/edit
function showEditForm(req, res) {
    res.render('teachers/edit', { title: 'Редактирование преподавателя', teacher: req.teacher, errors: {} });
}

// POST /teachers/:id/edit
async function updateTeacher(req, res, next) {
    try {
        await req.teacher.update(req.teacherData);
        res.redirect(`/teachers/${req.teacher.id}`);
    } catch (error) {
        if (error instanceof ValidationError) {
            return res.status(400).render('teachers/edit', {
                title: 'Редактирование преподавателя',
                teacher: { id: req.teacher.id, ...req.teacherData },
                errors: toFieldErrors(error)
            });
        }
        next(error);
    }
}

// POST /teachers/:id/delete: удалять можно только преподавателя без курсов
async function deleteTeacher(req, res, next) {
    try {
        const coursesCount = await req.teacher.countCourses();
        if (coursesCount > 0) {
            return renderTeacherDetails(res, req.teacher, { status: 409, error: HAS_COURSES_MESSAGE });
        }
        await req.teacher.destroy();
        res.redirect('/teachers');
    } catch (error) {
        // Запасная защита: ограничение ON DELETE RESTRICT в базе данных
        if (error instanceof ForeignKeyConstraintError) {
            try {
                return await renderTeacherDetails(res, req.teacher, { status: 409, error: HAS_COURSES_MESSAGE });
            } catch (detailsError) {
                return next(detailsError);
            }
        }
        next(error);
    }
}

module.exports = {
    loadTeacher,
    listTeachers,
    showCreateForm,
    createTeacher,
    showTeacher,
    showEditForm,
    updateTeacher,
    deleteTeacher
};
