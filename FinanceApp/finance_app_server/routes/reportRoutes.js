const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');

router.get('/incvsexp/:userId', reportsController.getReport);
router.get('/category-expenses/:userId', reportsController.getReportCatExp);
router.get("/expense-trend/:userId", reportsController.getExpenseTrend)

module.exports = router