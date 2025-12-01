const express = require('express')
const router = express.Router()
const timoriaController = require('../controllers/timoriaController')
const authMiddleware = require('../authenticationMiddleware');

// Specific Routes 
router.get('/today', authMiddleware.checkAuth, timoriaController.getTodayTimorias)
router.get('/statistics', authMiddleware.checkAuth, timoriaController.getStatistics);
router.get('/taxonomy', authMiddleware.checkAuth, timoriaController.getDistinctLists);
router.get('/history', authMiddleware.checkAuth, timoriaController.getTimoriaHistory);



// Generic Routes
router.get('/', authMiddleware.checkAuth, timoriaController.getAllTimorias)
router.post('/', authMiddleware.checkAuth, timoriaController.createTimoria)
router.delete('/:id', timoriaController.deleteTimoria)
router.put('/:id', timoriaController.updateTimoria)

module.exports = router
