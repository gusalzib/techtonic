const Timoria = require('../models/timoria')

// Get all
exports.getAllTimorias = async (req, res) => {
  try {
    const timorias = await Timoria.find().sort({ createdAt: -1 })
    res.json(timorias)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Create new
exports.createTimoria = async (req, res) => {
  const { subject, topic, tag, task, duration } = req.body
  try {
    const newTimoria = new Timoria({ subject, topic, tag, task, duration })
    await newTimoria.save()
    res.status(201).json(newTimoria)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

// Delete
exports.deleteTimoria = async (req, res) => {
  try {
    const { id } = req.params
    const deleted = await Timoria.findByIdAndDelete(id)
    if (!deleted) {
      return res.status(404).json({ error: 'Timoria not found' })
    }
    res.json({ message: 'Deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

