const User = require('../models/user');
const PendingNotification = require('../models/pendingNotification');

exports.subscribe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription } = req.body;

    if (!subscription) {
      return res.status(400).json({ error: 'Subscription object is required' });
    }

    await User.findByIdAndUpdate(userId, { pushSubscription: subscription });
    res.status(200).json({ message: 'Subscribed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.schedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, finishTime, payload } = req.body;

    // Delete any existing notification for this user of the same type (or all types if we only want one timer at a time)
    await PendingNotification.deleteMany({ user: userId });

    const newNotification = new PendingNotification({
      user: userId,
      type,
      finishTime: new Date(finishTime),
      payload
    });

    await newNotification.save();
    res.status(201).json(newNotification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cancel = async (req, res) => {
  try {
    const userId = req.user.id;
    await PendingNotification.deleteMany({ user: userId });
    res.status(200).json({ message: 'Notifications cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
