// Проверка входных данных через express-validator.
// Правила (rules) описывают каждое поле, validate(renderForm) собирает ошибки и при их наличии
// показывает ту же форму со статусом 400. Некорректные данные до контроллера не доходят.

const { body, validationResult } = require('express-validator');
const { Teacher } = require('../models');

const MAX_INT = 2147483647;            // максимум для INTEGER в PostgreSQL
const SEMESTER_RANGE = { min: 1, max: 8 };

// ---------- Правила ----------

const registerRules = [
    body('name').trim()
        .notEmpty().withMessage('Имя обязательно').bail()
        .isLength({ min: 2, max: 100 }).withMessage('Имя должно содержать минимум 2 символа (максимум 100)'),
    body('email').trim()
        .notEmpty().withMessage('Email обязателен').bail()
        .isEmail().withMessage('Email имеет некорректный формат').bail()
        .toLowerCase(),
    // Пароль не обрезаем: пробелы могут быть частью пароля.
    // bcrypt учитывает только первые 72 байта, поэтому длиннее не принимаем
    body('password')
        .notEmpty().withMessage('Пароль обязателен').bail()
        .isLength({ min: 6 }).withMessage('Пароль должен содержать минимум 6 символов').bail()
        .isLength({ max: 72 }).withMessage('Пароль должен содержать не более 72 символов'),
    body('passwordConfirm')
        .notEmpty().withMessage('Подтвердите пароль').bail()
        .custom((value, { req }) => value === req.body.password).withMessage('Пароль и подтверждение не совпадают')
];

const loginRules = [
    body('email').trim()
        .notEmpty().withMessage('Email обязателен').bail()
        .isEmail().withMessage('Email имеет некорректный формат').bail()
        .toLowerCase(),
    body('password')
        .notEmpty().withMessage('Пароль обязателен')
];

const teacherRules = [
    body('name').trim()
        .notEmpty().withMessage('Имя преподавателя обязательно').bail()
        .isLength({ max: 255 }).withMessage('Имя не должно превышать 255 символов'),
    body('email').trim()
        .notEmpty().withMessage('Email обязателен').bail()
        .isEmail().withMessage('Email имеет некорректный формат').bail()
        .toLowerCase(),
    body('department').trim()
        .notEmpty().withMessage('Кафедра обязательна').bail()
        .isLength({ max: 255 }).withMessage('Название кафедры не должно превышать 255 символов'),
    body('academicDegree').trim()
        .notEmpty().withMessage('Учёная степень обязательна').bail()
        .isLength({ max: 255 }).withMessage('Учёная степень не должна превышать 255 символов')
];

const courseRules = [
    body('title').trim()
        .notEmpty().withMessage('Название дисциплины обязательно').bail()
        .isLength({ max: 255 }).withMessage('Название не должно превышать 255 символов'),
    body('credits').trim()
        .isInt({ min: 1, max: MAX_INT }).withMessage('Количество кредитов должно быть положительным целым числом').bail()
        .toInt(),
    body('semester').trim()
        .isInt(SEMESTER_RANGE).withMessage('Семестр должен быть целым числом от 1 до 8').bail()
        .toInt(),
    body('description').trim()
        .notEmpty().withMessage('Описание обязательно'),
    body('teacherId').trim()
        .notEmpty().withMessage('Выберите преподавателя').bail()
        .isInt({ min: 1, max: MAX_INT }).withMessage('Выбранный преподаватель не существует').bail()
        .toInt()
        // Значение приходит из <select>, но запрос можно подделать, поэтому проверяем по базе.
        // Ошибку самой базы (например, нет соединения) не превращаем в сообщение у поля,
        // а сохраняем и передаём в errorHandler.
        .custom(async (teacherId, { req }) => {
            let teacher;
            try {
                teacher = await Teacher.findByPk(teacherId);
            } catch (error) {
                req.databaseError = error;
                return true;
            }
            if (!teacher) {
                throw new Error('Выбранный преподаватель не существует');
            }
            return true;
        })
];

// ---------- Обработка результата ----------

// Ошибки → { поле: первое сообщение }
function collectErrors(req) {
    return Object.fromEntries(
        Object.entries(validationResult(req).mapped()).map(([field, error]) => [field, error.msg])
    );
}

// renderForm(req, res, errors) показывает нужную форму; вызывается только если есть ошибки
function validate(renderForm) {
    return async (req, res, next) => {
        try {
            if (req.databaseError) {
                return next(req.databaseError);
            }
            const errors = collectErrors(req);
            if (Object.keys(errors).length === 0) {
                return next();
            }
            res.status(400);
            await renderForm(req, res, errors);
        } catch (error) {
            next(error);
        }
    };
}

// ---------- Формы для повторного показа ----------
// Пароли обратно в форму не передаются никогда

const renderRegisterForm = (req, res, errors) => res.render('auth/register', {
    title: 'Регистрация',
    form: { name: req.body.name || '', email: req.body.email || '' },
    errors
});

const renderLoginForm = (req, res, errors, error = null) => res.render('auth/login', {
    title: 'Вход',
    form: { email: req.body.email || '' },
    errors,
    error,
    notice: null
});

const teacherFormData = (req) => ({
    id: req.teacher ? req.teacher.id : undefined,
    name: req.body.name || '',
    email: req.body.email || '',
    department: req.body.department || '',
    academicDegree: req.body.academicDegree || ''
});

const renderTeacherForm = (req, res, errors) => res.render(req.teacher ? 'teachers/edit' : 'teachers/create', {
    title: req.teacher ? 'Редактирование преподавателя' : 'Новый преподаватель',
    teacher: teacherFormData(req),
    errors
});

async function renderCourseForm(req, res, errors) {
    const teachers = await Teacher.findAll({ order: [['name', 'ASC']] });
    res.render(req.course ? 'courses/edit' : 'courses/create', {
        title: req.course ? 'Редактирование курса' : 'Новый курс',
        course: {
            id: req.course ? req.course.id : undefined,
            title: req.body.title ?? '',
            credits: req.body.credits ?? '',
            semester: req.body.semester ?? '',
            description: req.body.description ?? '',
            teacherId: req.body.teacherId ?? ''
        },
        teachers,
        errors
    });
}

module.exports = {
    registerRules,
    loginRules,
    teacherRules,
    courseRules,
    validate,
    renderRegisterForm,
    renderLoginForm,
    renderTeacherForm,
    renderCourseForm
};
