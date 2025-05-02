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

module.exports = router