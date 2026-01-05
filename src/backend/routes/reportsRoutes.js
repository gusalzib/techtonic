// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../authenticationMiddleware');
const reportController = require('../controllers/reportsController');

router.post('/generate', auth.checkAuth, reportController.generateWeeklyReport);
router.get('/:id/signedUrl', auth.checkAuth, reportController.getSignedURL);
router.delete('/:id', auth.checkAuth, reportController.deleteReport);

router.get('/', auth.checkAuth, reportController.getUserReports);

module.exports = router;
