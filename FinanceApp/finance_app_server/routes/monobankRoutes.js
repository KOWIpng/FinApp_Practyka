const express = require('express');
const router = express.Router();
const monobankController = require('../controllers/monobankController');

router.get('/transactions/:userId/:from/:to', monobankController.getTransactions);
router.post('/token/:userId', monobankController.setToken);

module.exports = router