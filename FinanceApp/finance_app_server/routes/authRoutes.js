const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateToken = require("../tokenPackage");

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;
