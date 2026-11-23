// Контроллер курсов и страницы статистики

const { Op, ValidationError, ForeignKeyConstraintError } = require('sequelize');
const { sequelize, Teacher, Course } = require('../models');
const { parseId, toFieldErrors } = require('../middleware/validateData');
const { renderNotFound, renderError } = require('../middleware/errorHandler');

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

const getTeachersForSelect = () => Teacher.findAll({ order: [['name', 'ASC']] });

// Экранирование % и _ , чтобы они искались как обычные символы, а не как шаблоны LIKE
const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');

// router.param('id'): для всех маршрутов /courses/:id находит курс вместе с преподавателем
async function loadCourse(req, res, next, value) {
    try {
        const id = parseId(String(value));
        if (id === null) {
            return renderError(res, 400, `Некорректный ID курса: «${value}». ID должен быть положительным целым числом.`);
        }
        const course = await Course.findByPk(id, { include: Teacher });
        if (!course) {
            return renderNotFound(req, res, `Курс с ID ${id} не найден`);
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

// GET /courses?search=node&teacherId=2&semester=1
// Все условия собираются в один WHERE, фильтрацию выполняет PostgreSQL
async function listCourses(req, res, next) {
    try {
        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        const teacherId = parseId(String(req.query.teacherId ?? ''));
        const semesterNumber = parseId(String(req.query.semester ?? ''));
        const semester = SEMESTERS.includes(semesterNumber) ? semesterNumber : null;

        const where = {};
        if (search !== '') {
            where.title = { [Op.iLike]: `%${escapeLike(search)}%` };  // ILIKE: без учёта регистра
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

// GET /courses/new
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

// Запасная обработка ошибок модели и внешнего ключа при сохранении курса
async function renderCourseFormWithDbErrors(res, view, title, course, error) {
    const errors = error instanceof ForeignKeyConstraintError
        ? { teacherId: 'Выбранный преподаватель не существует' }
        : toFieldErrors(error);
    res.status(400).render(view, { title, course, teachers: await getTeachersForSelect(), errors });
}

// POST /courses
async function createCourse(req, res, next) {
    try {
        await Course.create(req.courseData);
        res.redirect('/courses');
    } catch (error) {
        if (error instanceof ValidationError || error instanceof ForeignKeyConstraintError) {
            try {
                return await renderCourseFormWithDbErrors(res, 'courses/create', 'Новый курс', req.courseData, error);
            } catch (renderFailure) {
                return next(renderFailure);
            }
        }
        next(error);
    }
}

// GET /courses/:id
function showCourse(req, res) {
    res.render('courses/details', { title: req.course.title, course: req.course });
}

// GET /courses/:id/edit
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

// POST /courses/:id/edit
async function updateCourse(req, res, next) {
    try {
        await req.course.update(req.courseData);
        res.redirect(`/courses/${req.course.id}`);
    } catch (error) {
        if (error instanceof ValidationError || error instanceof ForeignKeyConstraintError) {
            try {
                return await renderCourseFormWithDbErrors(res, 'courses/edit', 'Редактирование курса',
                    { id: req.course.id, ...req.courseData }, error);
            } catch (renderFailure) {
                return next(renderFailure);
            }
        }
        next(error);
    }
}

// POST /courses/:id/delete
async function deleteCourse(req, res, next) {
    try {
        await req.course.destroy();
        res.redirect('/courses');
    } catch (error) {
        next(error);
    }
}

// GET /statistics: все числа считает PostgreSQL (COUNT ... GROUP BY)
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

        // Показываем все семестры 1-8, в том числе те, где курсов нет
        const countBySemester = Object.fromEntries(semesterRows.map((row) => [row.semester, row.count]));
        const semesters = SEMESTERS.map((number) => ({ number, count: countBySemester[number] || 0 }));

        // Преподаватели с наибольшим количеством курсов (если таких несколько, показываем всех)
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
