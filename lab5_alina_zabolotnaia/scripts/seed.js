// Начальное заполнение базы данных: npm run seed
// Создаёт таблицы (если их нет) и добавляет преподавателей и курсы, только если таблица преподавателей пуста.
// Существующие данные скрипт не удаляет и не перезаписывает.

const { sequelize, Teacher, Course } = require('../models');

const teachers = [
    { name: 'Ivan Ivanov', email: 'ivanov@example.com', department: 'Informatics', academicDegree: 'Doctor' },
    { name: 'Ivan Petrov', email: 'petrov@example.com', department: 'Informatics', academicDegree: 'Master' },
    { name: 'Maria Popescu', email: 'popescu@example.com', department: 'Information Technologies', academicDegree: 'Doctor' },
    { name: 'Elena Rusu', email: 'rusu@example.com', department: 'Applied Informatics', academicDegree: 'Master' },
    { name: 'Andrei Ceban', email: 'ceban@example.com', department: 'Software Engineering', academicDegree: 'PhD' },
    { name: 'Olga Lungu', email: 'lungu@example.com', department: 'Applied Informatics', academicDegree: 'Doctor habilitat' }
];

// teacherEmail связывает курс с преподавателем; при вставке заменяется на teacherId
const courses = [
    { title: 'Server-side Programming', credits: 5, semester: 1, teacherEmail: 'ivanov@example.com',
      description: 'Development of server-side applications using Node.js' },
    { title: 'Node.js Fundamentals', credits: 4, semester: 1, teacherEmail: 'petrov@example.com',
      description: 'Modules, npm, asynchronous programming and the event loop in Node.js' },
    { title: 'Databases', credits: 5, semester: 2, teacherEmail: 'popescu@example.com',
      description: 'Relational data modelling, SQL queries, indexes and transactions' },
    { title: 'Web Design', credits: 4, semester: 2, teacherEmail: 'rusu@example.com',
      description: 'HTML, CSS, responsive layouts and basic UX principles' },
    { title: 'Software Testing', credits: 4, semester: 3, teacherEmail: 'ceban@example.com',
      description: 'Test design techniques, unit and integration testing, bug reporting' },
    { title: 'Advanced Node.js', credits: 5, semester: 3, teacherEmail: 'ivanov@example.com',
      description: 'Streams, worker threads, performance and security of Node.js services' },
    { title: 'Computer Networks', credits: 6, semester: 4, teacherEmail: 'ivanov@example.com',
      description: 'OSI and TCP/IP models, HTTP, DNS and network troubleshooting' }
];

async function seed() {
    try {
        await sequelize.authenticate();
        await sequelize.sync();

        if (await Teacher.count() > 0) {
            console.log('The database already contains data, seeding skipped');
            return;
        }

        // Транзакция: либо добавятся все записи, либо ни одной
        await sequelize.transaction(async (transaction) => {
            const created = await Teacher.bulkCreate(teachers, { transaction });
            const idByEmail = Object.fromEntries(created.map((teacher) => [teacher.email, teacher.id]));

            await Course.bulkCreate(
                courses.map(({ teacherEmail, ...course }) => ({ ...course, teacherId: idByEmail[teacherEmail] })),
                { transaction, validate: true }
            );
        });

        console.log(`Seeded ${teachers.length} teachers and ${courses.length} courses`);
    } catch (error) {
        console.error('Seeding failed:', error.message);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

seed();
