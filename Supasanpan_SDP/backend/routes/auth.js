const express = require('express');
const router = express.Router();
const { login, register, resetPassword } = require('../controllers/authController');
const { validateLogin, validateRegister } = require('../middleware/validation');

// Login route
router.post('/login', validateLogin, login);

// Register route
router.post('/register', validateRegister, register);

// Reset password route
router.post('/reset-password', resetPassword);

module.exports = router; 