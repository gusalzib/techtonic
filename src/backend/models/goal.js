const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "Mastering Vue 3"
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Weekly quota in minutes
  targetMinutes: { type: Number, required: true }, 
  
  // Pre-fill data for linked Timorias
  subject: { type: String, required: true },
  topic: { type: String },
  tag: { type: String },

  isRecurring: { type: Boolean, default: false },
  
  // Identifier to group by week (e.g., "2026-W09")
  weekIdentifier: { type: String, required: true }, 

  status: { 
    type: String, 
    enum: ['active', 'archived'], 
    default: 'active'  
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Goal', goalSchema);