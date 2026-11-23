// Контроллер преподавателей. Ошибки передаются в централизованный errorHandler через next(error)

const { UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const { Teacher } = require('../models');
const { HttpError } = require('../middleware/errorHandler');
const { logAdminAction } = require('../middleware/logger');
const { renderTeacherForm } = require('../middleware/validation');
const { parseId } = require('./courseController');

const HAS_COURSES_MESSAGE = 'Невозможно удалить преподавателя, у которого есть курсы';
const EMAIL_TAKEN = 'Этот email уже используется другим преподавателем';

const pickTeacherData = ({ name, email, department, academicDegree }) =>
    ({ name, email, department, academicDegree });

// Email должен быть уникальным; при редактировании свой email оставить можно
async function isEmailTaken(email, exceptId = null) {
    const owner = await Teacher.findOne({ where: { email } });
    return Boolean(owner) && owner.id !== exceptId;
}

// Повторный показ формы с ошибкой email и статусом 409 Conflict
function renderEmailConflict(req, res) {
    res.status(409);
    return renderTeacherForm(req, res, { email: EMAIL_TAKEN });
}

// Middleware для маршрутов /teachers/:id: загружает преподавателя в req.teacher
async function loadTeacher(req, res, next) {
    try {
        const id = parseId(req.params.id);
        if (id === null) {
            return next(new HttpError(400, `Некорректный ID преподавателя: «${req.params.id}». ID должен быть положительным целым числом.`));
        }
        const teacher = await Teacher.findByPk(id);
        if (!teacher) {
            return next(new HttpError(404, `Преподаватель с ID ${id} не найден`));
        }
        req.teacher = teacher;
        next();
    } catch (error) {
        next(error);
    }
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

// GET /teachers/new (admin)
function showCreateForm(req, res) {
    res.render('teachers/create', {
        title: 'Новый преподаватель',
        teacher: { name: '', email: '', department: '', academicDegree: '' },
        errors: {}
    });
}

// POST /teachers (admin)
async function createTeacher(req, res, next) {
    try {
        if (await isEmailTaken(req.body.email)) {
            return renderEmailConflict(req, res);
        }
        const teacher = await Teacher.create(pickTeacherData(req.body));
        logAdminAction(req, 'CREATE', 'Teacher', teacher.id);
        res.redirect('/teachers');
    } catch (error) {
        if (error instanceof UniqueConstraintError) {
            return renderEmailConflict(req, res);
        }
        next(error);
    }
}

// GET /teachers/:id: курсы получаем через связь Sequelize
async function showTeacher(req, res, next) {
    try {
        const courses = await req.teacher.getCourses({ order: [['semester', 'ASC'], ['title', 'ASC']] });
        res.render('teachers/details', { title: req.teacher.name, teacher: req.teacher, courses });
    } catch (error) {
        next(error);
    }
}

// GET /teachers/:id/edit (admin)
function showEditForm(req, res) {
    res.render('teachers/edit', { title: 'Редактирование преподавателя', teacher: req.teacher, errors: {} });
}

// POST /teachers/:id/edit (admin)
async function updateTeacher(req, res, next) {
    try {
        if (await isEmailTaken(req.body.email, req.teacher.id)) {
            return renderEmailConflict(req, res);
        }
        await req.teacher.update(pickTeacherData(req.body));
        logAdminAction(req, 'UPDATE', 'Teacher', req.teacher.id);
        res.redirect(`/teachers/${req.teacher.id}`);
    } catch (error) {
        if (error instanceof UniqueConstraintError) {
            return renderEmailConflict(req, res);
        }
        next(error);
    }
}

// POST /teachers/:id/delete (admin): преподавателя с курсами удалять нельзя
async function deleteTeacher(req, res, next) {
    const conflict = () => new HttpError(409, HAS_COURSES_MESSAGE, { backLink: `/teachers/${req.teacher.id}` });
    try {
        if (await req.teacher.countCourses() > 0) {
            return next(conflict());
        }
        const { id } = req.teacher;
        await req.teacher.destroy();
        logAdminAction(req, 'DELETE', 'Teacher', id);
        res.redirect('/teachers');
    } catch (error) {
        // Запасная защита: ограничение ON DELETE RESTRICT в базе данных
        next(error instanceof ForeignKeyConstraintError ? conflict() : error);
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
