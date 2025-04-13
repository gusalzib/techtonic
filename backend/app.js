// Import the Express framework for creating the server and handling routes
const express = require('express');

// Import Mongoose to connect to and interact with MongoDB using models and schemas
const mongoose = require('mongoose');

// Import CORS middleware to allow cross-origin requests (from frontend to backend)
const cors = require('cors');

// Load environment variables from a .env file into process.env
require('dotenv').config();

// Create an Express application instance
const app = express();

// Enable CORS to allow the frontend (possibly on a different port) to access the backend
app.use(cors());

// Middleware to automatically parse incoming JSON requests (req.body will be available as a JS object)
app.use(express.json());

// Define a basic test route at the root URL to confirm the server is running
app.get('/', (req, res) => {
  res.send('API is running...');
});


// Routes
const timoriaRoutes = require('./routes/timoriaRoutes') // update the path if needed

app.use('/api/timoria', timoriaRoutes)

// Connect to MongoDB using the URI stored in the .env file
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,         // Use the new URL parser instead of the deprecated one
  useUnifiedTopology: true       // Use the new server discovery and monitoring engine
})
  .then(() => console.log('MongoDB Connected')) // Log success if connected
  .catch(err => console.error(err));            // Log error if connection fails

// Define the port to listen on: from .env or fallback to 5000
const PORT = process.env.PORT || 5000;

// Start the Express server and log a message when it's up
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
