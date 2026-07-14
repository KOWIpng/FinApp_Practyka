const express = require('express');
const router = express.Router();
const multer = require('multer');
const operationController = require('../controllers/operationController');

const upload = multer({ storage: multer.memoryStorage() });
router.post('/receipts/upload', upload.single('receipt'), operationController.uploadReceipt);

router.get('/:userId', operationController.getAllOperations);
router.post('/add', operationController.createOperation);
router.get('/export/:userId', operationController.exportTransactions);

module.exports = router;
