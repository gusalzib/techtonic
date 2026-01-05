// models/report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['weekly'], required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },

  fileKey: { type: String, required: true },   // R2 object key
  fileUrl: { type: String, required: true },   // public or signed URL
  fileSize: { type: Number, required: true },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);
