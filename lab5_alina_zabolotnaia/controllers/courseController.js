// Контроллер курсов и страницы статистики.
// Все ошибки передаются через next(error) в централизованный errorHandler

const { Op } = require('sequelize');
const { sequelize, Teacher, Course } = require('../models');
const { HttpError } = require('../middleware/errorHandler');
const { logAdminAction } = require('../middleware/logger');

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const MAX_INT = 2147483647;

const getTeachersForSelect = () => Teacher.findAll({ order: [['name', 'ASC']] });

// Строка → положительное целое число или null
function parseId(value) {
    if (!/^\d+$/.test(String(value ?? ''))) {
        return null;
    }
    const number = Number(value);
    return number > 0 && number <= MAX_INT ? number : null;
}

// Экранирование % и _ , чтобы они искались как обычные символы, а не как шаблоны LIKE
const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');

// Только поля курса из формы, ничего лишнего (значения уже проверены и приведены к числам courseRules)
const pickCourseData = ({ title, credits, semester, description, teacherId }) =>
    ({ title, credits, semester, description, teacherId });

// Middleware для маршрутов /courses/:id: загружает курс вместе с преподавателем в req.course
async function loadCourse(req, res, next) {
    try {
        const id = parseId(req.params.id);
        if (id === null) {
            return next(new HttpError(400, `Некорректный ID курса: «${req.params.id}». ID должен быть положительным целым числом.`));
        }
        const course = await Course.findByPk(id, { include: Teacher });
        if (!course) {
            return next(new HttpError(404, `Курс с ID ${id} не найден`));
        }
        req.course = course;
        next();
    } catch (error) {
        next(error);
    }
}

// GET /
function redirectToCourses(req, res) {
    res.redirect('/courses');
}

// GET /courses?search=node&teacherId=2&semester=1 (фильтрацию выполняет PostgreSQL)
async function listCourses(req, res, next) {
    try {
        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        const teacherId = parseId(req.query.teacherId);
        const semesterNumber = parseId(req.query.semester);
        const semester = SEMESTERS.includes(semesterNumber) ? semesterNumber : null;

        const where = {};
        if (search !== '') {
            where.title = { [Op.iLike]: `%${escapeLike(search)}%` };
        }
        if (teacherId !== null) {
            where.teacherId = teacherId;
        }
        if (semester !== null) {
            where.semester = semester;
        }

        const [courses, teachers] = await Promise.all([
            Course.findAll({ where, include: Teacher, order: [['title', 'ASC']] }),
            getTeachersForSelect()
        ]);

        res.render('courses/index', {
            title: 'Курсы',
            courses,
            teachers,
            semesters: SEMESTERS,
            filters: { search, teacherId, semester }
        });
    } catch (error) {
        next(error);
    }
}

// GET /courses/new (admin)
async function showCreateForm(req, res, next) {
    try {
        res.render('courses/create', {
            title: 'Новый курс',
            course: { title: '', credits: '', semester: '', description: '', teacherId: '' },
            teachers: await getTeachersForSelect(),
            errors: {}
        });
    } catch (error) {
        next(error);
    }
}

// POST /courses (admin): сохраняет курс и рассылает WebSocket-уведомление всем открытым клиентам
async function createCourse(req, res, next) {
    try {
        const course = await Course.create(pickCourseData(req.body));
        const teacher = await Teacher.findByPk(course.teacherId);

        logAdminAction(req, 'CREATE', 'Course', course.id);

        req.app.get('io').emit('courseCreated', {
            id: course.id,
            title: course.title,
            teacherName: teacher ? teacher.name : '',
            createdAt: course.createdAt.toISOString()
        });

        res.redirect('/courses');
    } catch (error) {
        next(error);
    }
}

// GET /courses/:id
function showCourse(req, res) {
    res.render('courses/details', { title: req.course.title, course: req.course });
}

// GET /courses/:id/edit (admin)
async function showEditForm(req, res, next) {
    try {
        res.render('courses/edit', {
            title: 'Редактирование курса',
            course: req.course,
            teachers: await getTeachersForSelect(),
            errors: {}
        });
    } catch (error) {
        next(error);
    }
}

// POST /courses/:id/edit (admin)
async function updateCourse(req, res, next) {
    try {
        await req.course.update(pickCourseData(req.body));
        logAdminAction(req, 'UPDATE', 'Course', req.course.id);
        res.redirect(`/courses/${req.course.id}`);
    } catch (error) {
        next(error);
    }
}

// POST /courses/:id/delete (admin)
async function deleteCourse(req, res, next) {
    try {
        const { id } = req.course;
        await req.course.destroy();
        logAdminAction(req, 'DELETE', 'Course', id);
        res.redirect('/courses');
    } catch (error) {
        next(error);
    }
}

// GET /statistics (для авторизованных): все показатели считает PostgreSQL
async function showStatistics(req, res, next) {
    try {
        const [teachersCount, coursesCount, semesterRows, teachers] = await Promise.all([
            Teacher.count(),
            Course.count(),
            Course.findAll({
                attributes: ['semester', [sequelize.cast(sequelize.fn('COUNT', sequelize.col('id')), 'INTEGER'), 'count']],
                group: ['semester'],
                raw: true
            }),
            Teacher.findAllWithCourseCount({
                order: [[sequelize.literal('"coursesCount"'), 'DESC'], ['name', 'ASC']]
            })
        ]);

        const countBySemester = Object.fromEntries(semesterRows.map((row) => [row.semester, row.count]));
        const semesters = SEMESTERS.map((number) => ({ number, count: countBySemester[number] || 0 }));

        const maxCourses = teachers.length ? teachers[0].get('coursesCount') : 0;
        const topTeachers = maxCourses > 0 ? teachers.filter((t) => t.get('coursesCount') === maxCourses) : [];

        res.render('statistics', {
            title: 'Статистика',
            teachersCount,
            coursesCount,
            semesters,
            teachers,
            topTeachers,
            maxCourses
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    parseId,
    loadCourse,
    redirectToCourses,
    listCourses,
    showCreateForm,
    createCourse,
    showCourse,
    showEditForm,
    updateCourse,
    deleteCourse,
    showStatistics
};
