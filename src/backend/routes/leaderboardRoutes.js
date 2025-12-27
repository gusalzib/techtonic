const express = require('express')
const router = express.Router()
const leaderboardController = require('../controllers/leaderboardController')
const authMiddleware = require('../authenticationMiddleware');





// Generic Routes
router.get('/', authMiddleware.checkAuth, leaderboardController.getleaderboard)


module.exports = router