const express = require('express');
const authController = require('../controllers/authController').default;
const router = express.Router();

router.get('/register', authController.register);

module.exports = router;
