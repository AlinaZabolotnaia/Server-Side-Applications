// Аутентификация (кто вы?) и авторизация (что вам можно?)

const { HttpError } = require('./errorHandler');

// Делает данные текущего пользователя доступными во всех EJS-шаблонах как currentUser
function setCurrentUser(req, res, next) {
    res.locals.currentUser = req.session.user || null;
    res.locals.isAdmin = Boolean(req.session.user && req.session.user.role === 'admin');
    next();
}

// Пропускает только пользователя, который выполнил вход.
// GET-запрос гостя перенаправляется на /login; для POST и других методов перенаправление
// потеряло бы отправленные данные, поэтому отвечаем 401 Unauthorized.
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    if (req.method === 'GET') {
        return res.redirect('/login');
    }
    next(new HttpError(401, 'Для этого действия необходимо выполнить вход'));
}

// Пропускает только администратора. Сначала проверяет вход, затем роль
function isAdmin(req, res, next) {
    isAuthenticated(req, res, (error) => {
        if (error) {
            return next(error);
        }
        if (req.session.user.role !== 'admin') {
            return next(new HttpError(403, 'Это действие доступно только администратору'));
        }
        next();
    });
}

// Страницы входа и регистрации не нужны пользователю, который уже вошёл
function isGuest(req, res, next) {
    if (req.session.user) {
        return res.redirect('/profile');
    }
    next();
}

module.exports = { setCurrentUser, isAuthenticated, isAdmin, isGuest };
