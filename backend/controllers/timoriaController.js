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

// get today's timorias to display in the table 
exports.getTodayTimorias = async (req, res) => {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  try {
    const todayTimorias = await Timoria.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: -1 })

    res.status(200).json(todayTimorias)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}



// Update a timoria
exports.updateTimoria = async (req, res) => {
  const { id } = req.params
  const { subject, topic, tag, task, duration } = req.body

  try {
    const updated = await Timoria.findByIdAndUpdate(
      id,
      { subject, topic, tag, task, duration },
      { new: true, runValidators: true }
    )

    if (!updated) return res.status(404).json({ error: 'Timoria not found' })

    res.json(updated)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}


