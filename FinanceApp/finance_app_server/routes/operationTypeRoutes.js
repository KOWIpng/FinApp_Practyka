const express = require('express');
const router = express.Router();
const operationTypeController = require('../controllers/operationTypeController');

//  ТІЛЬКИ GET-запит (який тепер повертає статичний масив типів)
router.get('/', operationTypeController.getAllOperationTypes);


module.exports = router;