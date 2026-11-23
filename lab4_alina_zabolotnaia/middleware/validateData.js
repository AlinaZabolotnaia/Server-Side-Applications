// Middleware валидации форм преподавателя и курса.
// Если данные верны, кладёт очищенные значения в req.teacherData / req.courseData и вызывает next().
// Если нет, показывает ту же форму со статусом 400, сообщениями об ошибках и введёнными данными.

const { Teacher } = require('../models');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_INT = 2147483647; // максимум для типа INTEGER в PostgreSQL

const text = (value) => String(value ?? '').trim();

// Строка из формы → целое положительное число или null
function toPositiveInteger(value) {
    if (!/^\d+$/.test(value)) {
        return null;
    }
    const number = Number(value);
    return number > 0 && number <= MAX_INT ? number : null;
}

async function validateTeacher(req, res, next) {
    try {
        const body = req.body || {};
        const form = {
            name: text(body.name),
            email: text(body.email).toLowerCase(),
            department: text(body.department),
            academicDegree: text(body.academicDegree)
        };
        const errors = {};

        if (form.name === '') {
            errors.name = 'Имя преподавателя обязательно';
        }

        if (form.email === '') {
            errors.email = 'Email обязателен';
        } else if (!EMAIL_PATTERN.test(form.email)) {
            errors.email = 'Email имеет некорректный формат';
        } else {
            // Email должен быть уникальным; при редактировании свой email можно оставить
            const owner = await Teacher.findOne({ where: { email: form.email } });
            if (owner && (!req.teacher || owner.id !== req.teacher.id)) {
                errors.email = 'Этот email уже используется другим преподавателем';
            }
        }

        if (form.department === '') {
            errors.department = 'Кафедра обязательна';
        }

        if (form.academicDegree === '') {
            errors.academicDegree = 'Учёная степень обязательна';
        }

        if (Object.keys(errors).length > 0) {
            const isEdit = Boolean(req.teacher);
            return res.status(400).render(isEdit ? 'teachers/edit' : 'teachers/create', {
                title: isEdit ? 'Редактирование преподавателя' : 'Новый преподаватель',
                teacher: isEdit ? { id: req.teacher.id, ...form } : form,
                errors
            });
        }

        req.teacherData = form;
        next();
    } catch (error) {
        next(error);
    }
}

async function validateCourse(req, res, next) {
    try {
        const body = req.body || {};
        const form = {
            title: text(body.title),
            credits: text(body.credits),
            semester: text(body.semester),
            description: text(body.description),
            teacherId: text(body.teacherId)
        };
        const errors = {};

        if (form.title === '') {
            errors.title = 'Название дисциплины обязательно';
        }

        const credits = toPositiveInteger(form.credits);
        if (credits === null) {
            errors.credits = 'Количество кредитов должно быть положительным целым числом';
        }

        const semester = toPositiveInteger(form.semester);
        if (semester === null || semester > 8) {
            errors.semester = 'Семестр должен находиться в диапазоне от 1 до 8';
        }

        if (form.description === '') {
            errors.description = 'Описание обязательно';
        }

        // Преподаватель выбирается из списка, но запрос можно подделать, поэтому проверяем по базе
        const teacherId = toPositiveInteger(form.teacherId);
        if (form.teacherId === '') {
            errors.teacherId = 'Выберите преподавателя';
        } else if (teacherId === null || !(await Teacher.findByPk(teacherId))) {
            errors.teacherId = 'Выбранный преподаватель не существует';
        }

        if (Object.keys(errors).length > 0) {
            const isEdit = Boolean(req.course);
            const teachers = await Teacher.findAll({ order: [['name', 'ASC']] });
            return res.status(400).render(isEdit ? 'courses/edit' : 'courses/create', {
                title: isEdit ? 'Редактирование курса' : 'Новый курс',
                course: isEdit ? { id: req.course.id, ...form } : form,
                teachers,
                errors
            });
        }

        req.courseData = { title: form.title, credits, semester, description: form.description, teacherId };
        next();
    } catch (error) {
        next(error);
    }
}

// Ошибка валидации Sequelize (в том числе нарушение уникальности) → { поле: сообщение } для формы.
// Используется в контроллерах как запасная проверка на уровне модели и базы данных
function toFieldErrors(validationError) {
    const errors = {};
    for (const item of validationError.errors || []) {
        errors[item.path] = errors[item.path] || item.message;
    }
    return errors;
}

module.exports = { validateTeacher, validateCourse, parseId: toPositiveInteger, toFieldErrors };
