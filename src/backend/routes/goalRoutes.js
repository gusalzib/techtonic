const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const authMiddleware = require('../authenticationMiddleware');

// --- Specific Goal Routes ---

// Get all goals for a specific week (e.g., ?week=2026-W09)
router.get('/weekly', authMiddleware.checkAuth, goalController.getWeeklyGoals);

// Get aggregated progress (done vs planned) for a specific goal
router.get('/:id/progress', authMiddleware.checkAuth, goalController.getGoalProgress);

// The "Spawner": Create a new Planned Timoria based on this Goal's template
router.post('/:id/spawn', authMiddleware.checkAuth, goalController.createGoalSession);

router.get('/:id/sessions', authMiddleware.checkAuth, goalController.getGoalSessions); // get sessions linked to a specific goal

// --- Generic CRUD Routes ---

// Create a new goal
router.post('/', authMiddleware.checkAuth, goalController.createGoal);

// Get a single goal's details
router.get('/:id', authMiddleware.checkAuth, goalController.getGoalByID);

// Update a goal (e.g., change targetMinutes or title)
router.put('/:id', authMiddleware.checkAuth, goalController.updateGoal);

// Delete a goal
router.delete('/:id', authMiddleware.checkAuth, goalController.deleteGoal);

module.exports = router;