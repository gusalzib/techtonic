const mongoose = require('mongoose')

const timoriaSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  tag: { type: String },
  task: { type: String },
  duration: { type: Number, required: true },
  status: {
    type: String,
    enum: ['planned', 'ongoing', 'done'],
    default: 'planned'
  },
  createdAt: { type: Date, default: Date.now }
})


timoriaSchema.index({ subject: 1, topic: 1 });// Filter/Search by Subject and Topic
timoriaSchema.index({ createdAt: -1 }); //Enables fast .sort({ createdAt: -1 }) and time-range queries.
timoriaSchema.index({ tag: 1 });
// timoriaSchema.index({ task: 'text' }); // Uncomment if we need to use full-text search

module.exports = mongoose.model('Timoria', timoriaSchema)
