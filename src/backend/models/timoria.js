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
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  finishedAt: { type: Date, default: Date.now },
  goalId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Goal', 
    required: false 
  }
})


timoriaSchema.index({ subject: 1, topic: 1 });// Filter/Search by Subject and Topic
timoriaSchema.index({ createdAt: -1 }); //Enables fast .sort({ createdAt: -1 }) and time-range queries.
timoriaSchema.index({ tag: 1 });
// timoriaSchema.index({ task: 'text' }); // Uncomment if we need to use full-text search


/**
 * This checks the internal Mongoose registry to see if a model named "Timoria" has already been compiled.
 * If it exists, it exports the existing one. If it doesn't (the first time the app starts), it runs the mongoose.model(...) function to compile it.
 */
module.exports = mongoose.models.Timoria || mongoose.model('Timoria', timoriaSchema)
