// Контроллер курсов: получает запрос, обращается к модели и выбирает, какую страницу показать

const courseModel = require('../models/courseModel');

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

// Общая страница 404 (используется и здесь, и в app.js)
function renderNotFound(req, res, message = 'Страница не найдена') {
    res.status(404).render('404', { title: '404 Not Found', message, url: req.originalUrl });
}

// router.param('id', ...): вызывается для всех маршрутов с :id.
// Находит курс и кладёт его в req.course, иначе сразу отвечает 404.
function loadCourse(req, res, next, id) {
    const course = courseModel.findById(Number(id));
    if (!course) {
        return renderNotFound(req, res, `Курс с ID ${id} не найден`);
    }
    req.course = course;
    next();
}

// GET /
function redirectToCourses(req, res) {
    res.redirect('/courses');
}

// GET /courses?search=node&semester=1
function listCourses(req, res) {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    // Фильтр применяется, только если семестр целый и от 1 до 8, иначе показываем все семестры
    const semesterNumber = Number(req.query.semester);
    const semester = SEMESTERS.includes(semesterNumber) ? semesterNumber : null;

    const courses = courseModel.getAll({ search, semester });

    res.render('courses/index', {
        title: 'Список курсов',
        courses,
        search,
        semester,
        semesters: SEMESTERS
    });
}

// GET /courses/new
function showCreateForm(req, res) {
    res.render('courses/create', {
        title: 'Новый курс',
        course: { title: '', teacher: '', credits: '', semester: '', description: '' },
        errors: {}
    });
}

// POST /courses (данные уже проверены middleware validateCourse)
function createCourse(req, res) {
    courseModel.create(req.courseData);
    res.redirect('/courses');
}

// GET /courses/:id
function showCourse(req, res) {
    res.render('courses/details', { title: req.course.title, course: req.course });
}

// GET /courses/:id/edit
function showEditForm(req, res) {
    res.render('courses/edit', { title: 'Редактирование курса', course: req.course, errors: {} });
}

// POST /courses/:id/edit
function updateCourse(req, res) {
    courseModel.update(req.course.id, req.courseData);
    res.redirect(`/courses/${req.course.id}`);
}

// POST /courses/:id/delete
function deleteCourse(req, res) {
    courseModel.remove(req.course.id);
    res.redirect('/courses');
}

module.exports = {
    renderNotFound,
    loadCourse,
    redirectToCourses,
    listCourses,
    showCreateForm,
    createCourse,
    showCourse,
    showEditForm,
    updateCourse,
    deleteCourse
};
