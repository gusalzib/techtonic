const express = require('express')
const router = express.Router()
const timoriaController = require('../controllers/timoriaController')

// Routes
router.get('/', timoriaController.getAllTimorias)
router.post('/', timoriaController.createTimoria)
router.delete('/:id', timoriaController.deleteTimoria)
router.put('/:id', timoriaController.updateTimoria)
router.get('/today', timoriaController.getTodayTimorias)

module.exports = router
