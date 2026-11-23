// Маршруты аутентификации

const express = require('express');
const authController = require('../controllers/authController');
const { isAuthenticated, isGuest } = require('../middleware/auth');
const { registerRules, loginRules, validate, renderRegisterForm, renderLoginForm } = require('../middleware/validation');

const router = express.Router();

router.get('/register', isGuest, authController.showRegisterForm);
router.post('/register', isGuest, registerRules, validate(renderRegisterForm), authController.register);

router.get('/login', isGuest, authController.showLoginForm);
router.post('/login', isGuest, loginRules, validate(renderLoginForm), authController.login);

// Выход только методом POST: GET-ссылку мог бы открыть сторонний сайт или предзагрузка браузера
router.post('/logout', isAuthenticated, authController.logout);

router.get('/profile', isAuthenticated, authController.showProfile);

module.exports = router;
