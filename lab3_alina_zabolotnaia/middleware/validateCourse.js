// Middleware валидации формы курса (добавление и редактирование).
// Если данные верны, кладёт очищенный курс в req.courseData и передаёт управление контроллеру.
// Если нет, сразу показывает ту же форму с сообщениями об ошибках и введёнными данными.

function validateCourse(req, res, next) {
    const body = req.body || {};

    // Значения из формы всегда строки; убираем пробелы по краям
    const form = {
        title: String(body.title ?? '').trim(),
        teacher: String(body.teacher ?? '').trim(),
        credits: String(body.credits ?? '').trim(),
        semester: String(body.semester ?? '').trim(),
        description: String(body.description ?? '').trim()
    };

    const errors = {};

    if (form.title === '') {
        errors.title = 'Название дисциплины обязательно';
    }

    if (form.teacher === '') {
        errors.teacher = 'Укажите преподавателя';
    }

    const credits = Number(form.credits);
    if (form.credits === '' || !Number.isFinite(credits) || credits <= 0) {
        errors.credits = 'Количество кредитов должно быть положительным числом';
    }

    const semester = Number(form.semester);
    if (form.semester === '' || !Number.isInteger(semester)) {
        errors.semester = 'Семестр должен быть целым числом';
    } else if (semester < 1 || semester > 8) {
        errors.semester = 'Семестр должен находиться в диапазоне от 1 до 8';
    }

    if (form.description === '') {
        errors.description = 'Описание обязательно';
    }

    if (Object.keys(errors).length > 0) {
        // req.course есть только при редактировании (его заранее находит router.param)
        const isEdit = Boolean(req.course);
        return res.status(400).render(isEdit ? 'courses/edit' : 'courses/create', {
            title: isEdit ? 'Редактирование курса' : 'Новый курс',
            course: isEdit ? { id: req.course.id, ...form } : form,
            errors
        });
    }

    req.courseData = {
        title: form.title,
        teacher: form.teacher,
        credits,
        semester,
        description: form.description
    };
    next();
}

module.exports = validateCourse;
