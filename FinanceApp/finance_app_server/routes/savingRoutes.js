const express = require('express');
const router = express.Router();
const savingsController = require('../controllers/savingsController');

router.get('/:userId', savingsController.getAllSavings);
router.post('/:userId', savingsController.createSavings);
router.put('/:userId/:code', savingsController.updateSavings);
router.delete('/:userId/:code', savingsController.deleteSavings);

module.exports = router