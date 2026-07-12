const mongoose = require('mongoose');

const pendingNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['timoria', 'break'],
    required: true
  },
  finishTime: {
    type: Date,
    required: true
  },
  payload: {
    title: { type: String, required: true },
    body: { type: String, required: true }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '24h' // Automatically delete old entries after 24 hours
  }
});

// Index finishTime for faster polling
pendingNotificationSchema.index({ finishTime: 1 });

module.exports = mongoose.model('PendingNotification', pendingNotificationSchema);
