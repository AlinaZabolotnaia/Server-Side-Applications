// Модель курсов: хранит данные и операции с ними.
// Данные лежат в массиве в памяти, поэтому после перезапуска сервера изменения теряются.

const courses = [
    {
        id: 1,
        title: 'Server-side Programming',
        teacher: 'Ivan Ivanov',
        credits: 5,
        semester: 1,
        description: 'Development of server-side applications using Node.js'
    },
    {
        id: 2,
        title: 'Node.js Fundamentals',
        teacher: 'Ivan Petrov',
        credits: 4,
        semester: 1,
        description: 'Modules, npm, asynchronous programming and the event loop in Node.js'
    },
    {
        id: 3,
        title: 'Databases',
        teacher: 'Maria Popescu',
        credits: 5,
        semester: 2,
        description: 'Relational data modelling, SQL queries, indexes and transactions'
    },
    {
        id: 4,
        title: 'Web Design',
        teacher: 'Elena Rusu',
        credits: 4,
        semester: 2,
        description: 'HTML, CSS, responsive layouts and basic UX principles'
    },
    {
        id: 5,
        title: 'Software Testing',
        teacher: 'Andrei Ceban',
        credits: 4,
        semester: 3,
        description: 'Test design techniques, unit and integration testing, bug reporting'
    },
    {
        id: 6,
        title: 'Computer Networks',
        teacher: 'Ivan Ivanov',
        credits: 6,
        semester: 4,
        description: 'OSI and TCP/IP models, HTTP, DNS and network troubleshooting'
    }
];

// Следующий свободный id: максимальный существующий + 1
function nextId() {
    return courses.length === 0 ? 1 : Math.max(...courses.map((course) => course.id)) + 1;
}

// Все курсы с необязательным поиском (по названию и преподавателю) и фильтром по семестру
function getAll({ search = '', semester = null } = {}) {
    const query = search.trim().toLowerCase();

    return courses.filter((course) => {
        const matchesSearch = query === ''
            || course.title.toLowerCase().includes(query)
            || course.teacher.toLowerCase().includes(query);
        const matchesSemester = semester === null || course.semester === semester;
        return matchesSearch && matchesSemester;
    });
}

function findById(id) {
    return courses.find((course) => course.id === id);
}

function create(data) {
    const course = { id: nextId(), ...data };
    courses.push(course);
    return course;
}

function update(id, data) {
    const course = findById(id);
    if (!course) {
        return null;
    }
    Object.assign(course, data);
    return course;
}

function remove(id) {
    const index = courses.findIndex((course) => course.id === id);
    if (index === -1) {
        return null;
    }
    return courses.splice(index, 1)[0];
}

module.exports = { courses, getAll, findById, create, update, remove };
