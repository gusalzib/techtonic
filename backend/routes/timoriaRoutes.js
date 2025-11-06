const express = require('express')
const router = express.Router()
const timoriaController = require('../controllers/timoriaController')
const authMiddleware = require('../authenticationMiddleware');

// Specific Routes 
router.get('/today', timoriaController.getTodayTimorias)
router.get('/statistics', authMiddleware.checkAuth, timoriaController.getStatistics);
router.get('/taxonomy', authMiddleware.checkAuth, timoriaController.getDistinctLists)


// Generic Routes
router.get('/', timoriaController.getAllTimorias)
router.post('/', authMiddleware.checkAuth, timoriaController.createTimoria)
router.delete('/:id', timoriaController.deleteTimoria)
router.put('/:id', timoriaController.updateTimoria)

module.exports = router
