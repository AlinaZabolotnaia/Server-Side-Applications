// Регистрация, вход, выход и профиль

const bcrypt = require('bcrypt');
const { UniqueConstraintError } = require('sequelize');
const { User } = require('../models');
const { renderRegisterForm, renderLoginForm } = require('../middleware/validation');

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;
const SESSION_COOKIE = 'connect.sid';   // имя cookie express-session по умолчанию
const INVALID_CREDENTIALS = 'Неверный email или пароль';
const EMAIL_TAKEN = 'Пользователь с таким email уже зарегистрирован';

// Hash для сравнения, когда пользователь не найден: bcrypt.compare выполняется в любом случае,
// поэтому по времени ответа нельзя понять, зарегистрирован ли email
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

// Методы сессии работают через callback; оборачиваем их в Promise для async/await
const regenerateSession = (req) => new Promise((resolve, reject) =>
    req.session.regenerate((error) => (error ? reject(error) : resolve())));
const saveSession = (req) => new Promise((resolve, reject) =>
    req.session.save((error) => (error ? reject(error) : resolve())));
const destroySession = (req) => new Promise((resolve, reject) =>
    req.session.destroy((error) => (error ? reject(error) : resolve())));

// GET /register
function showRegisterForm(req, res) {
    res.render('auth/register', { title: 'Регистрация', form: { name: '', email: '' }, errors: {} });
}

// POST /register (данные уже проверены registerRules)
async function register(req, res, next) {
    try {
        const { name, email, password } = req.body;

        if (await User.findOne({ where: { email } })) {
            res.status(409);
            return renderRegisterForm(req, res, { email: EMAIL_TAKEN });
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // Явно перечисляем поля: даже если в запрос добавить role=admin, роль не сохранится
        await User.create(
            { name, email, password: hashedPassword },
            { fields: ['name', 'email', 'password'] }
        );

        res.redirect('/login?registered=1');
    } catch (error) {
        // Два одинаковых запроса одновременно: проверку выше прошли оба, сработало ограничение UNIQUE в базе
        if (error instanceof UniqueConstraintError) {
            res.status(409);
            return renderRegisterForm(req, res, { email: EMAIL_TAKEN });
        }
        next(error);
    }
}

// GET /login
function showLoginForm(req, res) {
    res.render('auth/login', {
        title: 'Вход',
        form: { email: '' },
        errors: {},
        error: null,
        notice: req.query.registered === '1' ? 'Регистрация прошла успешно. Теперь войдите в систему.' : null
    });
}

// POST /login
async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        // scope 'withPassword': hash загружается только здесь, для проверки пароля
        const user = await User.scope('withPassword').findOne({ where: { email } });
        const passwordMatches = await bcrypt.compare(password, user ? user.password : DUMMY_HASH);

        if (!user || !passwordMatches) {
            res.status(401);
            return renderLoginForm(req, res, {}, INVALID_CREDENTIALS);
        }

        user.lastLogin = new Date();
        await user.save({ fields: ['lastLogin'] });

        // Новый ID сессии после входа защищает от фиксации сессии (session fixation)
        await regenerateSession(req);
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };
        await saveSession(req);

        res.redirect('/profile');
    } catch (error) {
        next(error);
    }
}

// POST /logout
async function logout(req, res, next) {
    try {
        await destroySession(req);
        res.clearCookie(SESSION_COOKIE);
        res.redirect('/login');
    } catch (error) {
        next(error);
    }
}

// GET /profile
async function showProfile(req, res, next) {
    try {
        // defaultScope модели не загружает поле password
        const user = await User.findByPk(req.session.user.id);
        if (!user) {
            // Пользователя удалили из базы, пока сессия была активна
            await destroySession(req);
            res.clearCookie(SESSION_COOKIE);
            return res.redirect('/login');
        }

        res.render('profile', {
            title: 'Профиль',
            user,
            sessionData: req.session.user,
            sessionExpires: req.session.cookie.expires
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { showRegisterForm, register, showLoginForm, login, logout, showProfile };
