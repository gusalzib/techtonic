const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../authenticationMiddleware');

router.post('/subscribe', authMiddleware.checkAuth, notificationController.subscribe);
router.post('/schedule', authMiddleware.checkAuth, notificationController.schedule);
router.post('/cancel', authMiddleware.checkAuth, notificationController.cancel);

module.exports = router;
