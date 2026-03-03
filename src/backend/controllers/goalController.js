const Goal = require('../models/Goal');
const Timoria = require('../models/Timoria');
const mongoose = require('mongoose'); // Required for aggregation and ObjectId casting

// Create a new Weekly Goal
exports.createGoal = async (req, res) => {
  try {
    const goal = new Goal({
      ...req.body,
      user: req.user.id
    });
    await goal.save();
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// FETCH all goals for the current week
exports.getWeeklyGoals = async (req, res) => {
  const { week } = req.query; // Expecting YYYY-WNN
  try {
    const goals = await Goal.find({ 
      user: req.user.id, 
      weekIdentifier: week 
    });
    res.status(200).json(goals);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getGoalSessions = async (req, res) => {
  try {
    const sessions = await Timoria.find({ goalId: req.params.id }).sort({ createdAt: -1 });
    res.status(200).json(sessions);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// THE "SPAWNER": Create a Planned Timoria from a Goal
exports.createGoalSession = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);
      if (!goal) return res.status(404).json({ msg: 'Goal not found' });
      console.log('Received goal: ', goal);
      

    const newPlannedTimoria = new Timoria({
        user: req.user.id,
        goalId: goal._id,
        subject: goal.subject,
        topic: goal.topic,
        tag: req.body.tag || '',
        task: req.body.task,
        duration: req.body.duration || 25, // Default to 25 or user choice
        status: 'planned'
    });

    await newPlannedTimoria.save();
    res.status(201).json(newPlannedTimoria);
  } catch (err) {
      res.status(500).json({ msg: 'Server error' });
      console.error('Failed to create session ', err);
      
  }
};

exports.getGoalProgress = async (req, res) => {
  try {
    const stats = await Timoria.aggregate([
      { $match: { goalId: mongoose.Types.ObjectId(req.params.id) } },
      { $group: {
          _id: "$status",
          totalMinutes: { $sum: "$duration" }
      }}
    ]);
    
    // Returns something like: [{_id: 'done', totalMinutes: 100}, {_id: 'planned', totalMinutes: 50}]
    res.status(200).json(stats);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};


// Get a single goal by ID with ownership check
exports.getGoalByID = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal) return res.status(404).json({ msg: 'Goal not found or access denied' });
    
    res.status(200).json(goal);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Update a goal
exports.updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: req.body },
      { new: true } // Returns the updated document
    );
    
    if (!goal) return res.status(404).json({ msg: 'Goal not found or access denied' });
    res.status(200).json(goal);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Delete a goal and optionally clean up orphaned planned Timorias
exports.deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    
    if (!goal) return res.status(404).json({ msg: 'Goal not found or access denied' });

    // Optional: Delete planned Timorias linked to this goal so they don't clutter the timer
    await Timoria.deleteMany({ goalId: req.params.id, status: 'planned' });

    res.status(200).json({ msg: 'Goal and planned sessions removed' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Refined Progress Endpoint
exports.getGoalProgress = async (req, res) => {
  try {
    // Ensure ID is a valid ObjectId before aggregating
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: 'Invalid Goal ID' });
    }

    const stats = await Timoria.aggregate([
      { $match: { goalId: new mongoose.Types.ObjectId(req.params.id) } },
      { $group: {
          _id: "$status",
          totalMinutes: { $sum: "$duration" }
      }}
    ]);
    
    res.status(200).json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};