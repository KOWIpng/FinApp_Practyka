const express = require('express');
const router = express.Router();
const operationTypeController = require('../controllers/operationTypeController');

router.get('/', operationTypeController.getAllOperationTypes);
router.post('/', operationTypeController.createOperationType);

module.exports = router;
