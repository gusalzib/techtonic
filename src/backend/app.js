// Import the Express framework for creating the server and handling routes
const express = require('express');

// Import Mongoose to connect to and interact with MongoDB using models and schemas
const mongoose = require('mongoose');

// Import CORS middleware to allow cross-origin requests (from frontend to backend)
const cors = require('cors');

const morgan = require('morgan');


// Load environment variables depending on NODE_ENV
const dotenv = require('dotenv');
const env = process.env.NODE_ENV || 'development';
const envFile = env === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile }); 
console.log(`Loaded env file: ${envFile}`);

// Create an Express application instance
const app = express();

const authMiddleware = require('./authenticationMiddleware');

// Middleware to log incoming HTTP requests
app.use(morgan('dev'));

// Enable CORS to allow the frontend (possibly on a different port) to access the backend
app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:5173', 'https://techtonic-v0qp.onrender.com', 'https://techtonic.se', 'https://www.techtonic.se']
}));

// Middleware to automatically parse incoming JSON requests (req.body will be available as a JS object)
app.use(express.json());

// Define a basic test route at the root URL to confirm the server is running
app.get('/api/health', (req, res) => {
  res.send('API is running...');
});

// app.post('/api/contact', (res, req) => {
//   console.log('i got the request');
  
// })

// Routes
const timoriaRoutes = require('./routes/timoriaRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const userRoutes = require('./routes/userRoutes');
const contactRoutes = require('./routes/contact.js');
const reportsRoutes = require('./routes/reportsRoutes.js');
const budgetRoutes = require('./routes/budgetRoutes');
const goalRoutes = require('./routes/goalRoutes.js');
const notificationRoutes = require('./routes/notificationRoutes.js');

app.use('/api/timoria', timoriaRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/goals', goalRoutes)
app.use('/api/notifications', notificationRoutes);


// Catch-all for unhandled errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});
/**########################################################## PROD CODE ########################################################## */
// Import Path (Built-in Node module) - No installation needed
const path = require('path');

// This block serves the frontend. It must come AFTER API routes 
// so that API requests don't get caught by the '*' wildcard.

// In CommonJS, __dirname is available globally, so you don't need 'fileURLToPath'
// Note: Check if process.env.NODE_ENV is set to 'production' if you only want this in prod
// For now, I've left it enabled as per your snippet.

// Serve static files from the 'dist' folder
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Fallback: Any route not handled by API or static files returns index.html
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
/**XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */


/**########################################################## WEEKLY REPORTS GENERATION SCHEDULE ########################################################## */

const User = require('./models/user');
const cron = require('node-cron');
const { generateAutomaticWeeklyReportsForUsers } = require('./controllers/reportsController');

// Schedule: "0 05 * * 1" means 0 minutes, 05 hours (5 AM),
// any day of month, any month, Monday (1)
// you can check https://crontab.guru/#0 05 * * 1 for a better understanding of the Cron Expression argument 
// temporarily */1 * * * * which runs every minute for testing purposes.  0 05 * * 1
cron.schedule('0 05 * * 1', async () => {
  console.log('--- Starting Monday Weekly Report Batch ---');

  try {
    // fetch all users who should receive reports
    const users = await User.find();

    for (const user of users) {
      try {
        // pass user settings to the worker
        await generateAutomaticWeeklyReportsForUsers(user._id, user.timezone);
      } catch (userError) {
        console.error(`Failed report for user ${user._id}: `, userError)
      }
    }
  } catch (error) {
    console.error(`Batch report generation failed:  `, error)
  }
}, {
  scheduled: true,
  timezone: "Europe/Stockholm"// Set the server's scheduling timezone
})

/**########################################################## PUSH NOTIFICATIONS POLLING ########################################################## */
const webpush = require('web-push');
const PendingNotification = require('./models/pendingNotification');

webpush.setVapidDetails(
  'mailto:contact@techtonic.se', 
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);
/**
 * So the idea here is to check the notification collection in the db every 30 seconds
 * and if we find a notification that is expired, we send it to the user and delete it from the collection.
 * This will allow us to send push notifications to users even when the app is not on screen.
 */
// Poll every 30 seconds for expired timers
// I will approve this code for now, but I am not sure this is scalable, we should consider using a message queue system.
cron.schedule('*/30 * * * * *', async () => {
  const now = new Date();
  try {
    const expired = await PendingNotification.find({ finishTime: { $lte: now } }).populate('user');
    
    for (const notification of expired) {
      if (notification.user && notification.user.pushSubscription) {
        try {
          await webpush.sendNotification(
            notification.user.pushSubscription,
            JSON.stringify(notification.payload)
          );
          console.log(`Push notification sent to ${notification.user.email}`);
        } catch (err) {
          console.error(`Failed to send push to ${notification.user.email}:`, err.message);
          // If subscription is invalid/expired, we might want to clear it
          if (err.statusCode === 410 || err.statusCode === 404) {
            notification.user.pushSubscription = null;
            await notification.user.save();
          }
        }
      }
      // Delete the notification document regardless of success (to avoid double-sending)
      await PendingNotification.findByIdAndDelete(notification._id);
    }
  } catch (err) {
    console.error('Push notification polling error:', err);
  }
});
/**XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */

/**XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */

// Import the Cron Job to start the weekly scheduler
require('./cron/goalReset');

// Connect to MongoDB using the URI stored in the .env file
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(`MongoDB Connected (${process.env.NODE_ENV})`))
  .catch(err => console.error('MongoDB connection error:', err));

// Define the port to listen on: from .env or fallback to 5000
const PORT = process.env.PORT || 5000;

// Start the Express server and log a message when it's up
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
