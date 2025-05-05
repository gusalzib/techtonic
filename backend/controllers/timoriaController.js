const Timoria = require('../models/timoria')

// Get all (optionally filter by status)
exports.getAllTimorias = async (req, res) => {
  try {
    const { status } = req.query
    const filter = status ? { status } : {}
    const timorias = await Timoria.find(filter).sort({ createdAt: -1 })
    res.json(timorias)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}


// Create new
exports.createTimoria = async (req, res) => {
  const { subject, topic, tag, task, duration, status } = req.body
  const userId = req.user.id;
  try {
    const newTimoria = new Timoria({ subject, topic, tag, task, duration, status, user: userId })
    await newTimoria.save()
    res.status(201).json(newTimoria)
  } catch (err) {
    console.log(err.message);
    
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

// Get today's completed Timorias
exports.getTodayTimorias = async (req, res) => {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)

  try {
    const todayTimorias = await Timoria.find({
      finishedAt: { $gte: startOfDay, $lte: endOfDay },
      status: 'done'
    }).sort({ finishedAt: -1 })

    res.status(200).json(todayTimorias)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}



// Update a timoria
exports.updateTimoria = async (req, res) => {
  const { id } = req.params
  const { subject, topic, tag, task, duration, status, finishedAt } = req.body

  try {
    const updated = await Timoria.findByIdAndUpdate(
      id,
      { subject, topic, tag, task, duration, status, finishedAt },
      { new: true, runValidators: true }
    )

    if (!updated) return res.status(404).json({ error: 'Timoria not found' })

    res.json(updated)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}


