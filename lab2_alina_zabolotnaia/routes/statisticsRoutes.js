// Маршрут статистики (задание 8.2)

const express = require('express');
const statisticsController = require('../controllers/statisticsController');

const router = express.Router();

router.get('/', statisticsController.getStatistics);

module.exports = router;
