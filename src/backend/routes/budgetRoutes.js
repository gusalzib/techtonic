const express = require('express')
const router = express.Router()
const budgetController = require('../controllers/budgetController')
const authMiddleware = require('../authenticationMiddleware');

// Specific Routes 
router.post('/transactions/create', authMiddleware.checkAuth, budgetController.createTransaction);
// router.post('/delete/:id', authMiddleware.checkAuth, budgetController.deleteTransaction);


// Generic Routes
router.get('/stats/:id', authMiddleware.checkAuth, budgetController.getBudgetStats); 
router.get('/transactions', authMiddleware.checkAuth, budgetController.getTransactions);
router.get('/categories', authMiddleware.checkAuth, budgetController.getCategories);
module.exports = router
