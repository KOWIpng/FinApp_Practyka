const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.get('/:userId', categoryController.getAllCategories);
router.post('/', categoryController.createCategory);
router.post('/target', categoryController.setCategoryTarget);
router.delete('/', categoryController.deleteCategory);

module.exports = router;
