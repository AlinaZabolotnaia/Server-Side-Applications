// Точка сборки моделей: создаёт модели и настраивает связи между ними

const sequelize = require('../config/database');
const Teacher = require('./Teacher')(sequelize);
const Course = require('./Course')(sequelize);

// Teacher 1 → Many Courses
// onDelete: 'RESTRICT': база данных сама не даст удалить преподавателя, у которого есть курсы
Teacher.hasMany(Course, {
    foreignKey: 'teacherId',
    onDelete: 'RESTRICT'
});

Course.belongsTo(Teacher, {
    foreignKey: 'teacherId'
});

// Все преподаватели с количеством курсов, посчитанным в самой базе данных:
// SELECT "Teacher".*, COUNT("Courses".id) ... LEFT JOIN "Courses" ... GROUP BY "Teacher".id
Teacher.findAllWithCourseCount = function ({ order = [['name', 'ASC']] } = {}) {
    return Teacher.findAll({
        attributes: {
            include: [[sequelize.cast(sequelize.fn('COUNT', sequelize.col('Courses.id')), 'INTEGER'), 'coursesCount']]
        },
        include: [{ model: Course, attributes: [] }],
        group: ['Teacher.id'],
        order
    });
};

module.exports = { sequelize, Teacher, Course };
