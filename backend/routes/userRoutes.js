const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const userController = require('../controllers/usersController');
const authMiddleware = require('../authenticationMiddleware');
const router = express.Router();

// Signup Route
router.post('/signup', userController.signup);

// Login Route
router.post('/login', userController.login);


// Protect logout so it is available only to logged-in users
router.post('/logout', userController.logout);


// Protected route to get user status (only accessible to logged-in users)
router.get('/status', authMiddleware.checkAuth, authMiddleware.getUserStatus);


module.exports = router