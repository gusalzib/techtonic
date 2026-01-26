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
  origin: ['http://localhost:5174', 'http://localhost:5173', 'https://techtonic-v0qp.onrender.com/']
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


app.use('/api/timoria', timoriaRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reports', reportsRoutes);



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

// Schedule: "0 21 * * 0" means 0 minutes, 21 hours (9 PM),
// any day of month, any month, Sunday (0)
// you can check https://crontab.guru/#0_21_*_*_0 for a better understanding of the Cron Expression argument 
// temporarily */1 * * * * which runs every minute for testing purposes.  0 21 * * 0
cron.schedule('45 09 * * 1', async () => {
  console.log('--- Starting Sunday Weekly Report Batch ---');

  try {
    // fetch all users who shoul receive reports
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
  schedule: true,
  timezone: "Europe/Stockholm"// Set the server's scheduling timezone
})
/**XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX */


// Connect to MongoDB using the URI stored in the .env file
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(`MongoDB Connected (${process.env.NODE_ENV})`))
  .catch(err => console.error('MongoDB connection error:', err));

// Define the port to listen on: from .env or fallback to 5000
const PORT = process.env.PORT || 5000;

// Start the Express server and log a message when it's up
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
