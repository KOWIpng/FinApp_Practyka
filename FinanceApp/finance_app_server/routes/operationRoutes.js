const express = require('express');
const router = express.Router();
const operationController = require('../controllers/operationController');



router.get('/:userId', operationController.getAllOperations);
router.post('/add', operationController.createOperation);
router.get('/export/:userId', operationController.exportTransactions);

module.exports = router;
