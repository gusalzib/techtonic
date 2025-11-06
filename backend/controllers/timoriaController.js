const Timoria = require('../models/timoria')
const { Types } = require('mongoose');

// Get all (optionally filter by status)
// exports.getAllTimorias = async (req, res) => {
//   try {
//     const { status } = req.query
//     const filter = status ? { status } : {}
//     const timorias = await Timoria.find(filter).sort({ createdAt: -1 })
//     res.json(timorias)
//   } catch (err) {
//     res.status(500).json({ error: err.message })
//   }
// }


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



// Get all (with filtering options)
exports.getAllTimorias = async (req, res) => {
  const { status, subject, topic, tag, task, startDate, endDate } = req.query;

  // Build the filter object
  let filter = {};

  // Add filters based on query parameters
  if (status) {
    filter.status = status;
  }
  if (subject) {
    filter.subject = new RegExp(subject, 'i');  // Case-insensitive search for subject
  }
  if (topic) {
    filter.topic = new RegExp(topic, 'i');  // Case-insensitive search for topic
  }
  if (tag) {
    filter.tag = new RegExp(tag, 'i');  // Case-insensitive search for tag
  }
  if (task) {
    filter.task = new RegExp(task, 'i');  // Case-insensitive search for task
  }
  
  // Date range filtering
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    filter.createdAt = { $gte: start, $lte: end };
  }

  try {
    // Query the database with the constructed filter
    const timorias = await Timoria.find(filter).sort({ createdAt: -1 });

    res.json(timorias);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// Get statistics data
exports.getStatistics = async (req, res) => {
  try {
    const { startDate, endDate, subject } = req.query;
        console.log('Backend received startDate:', startDate, 'endDate:', endDate); // Add this line
    const userId = req.user.id;
    // 1. First check if there's any data at all
    const totalCount = await Timoria.countDocuments({ user: userId });
    if (totalCount === 0) {
      return res.json({
        totalTimorias: 0,
        totalTimeSpent: 0,
        totalTopics: 0,
        totalSubjects: 0,
        statusBreakdown: { planned: 0, ongoing: 0, done: 0 },
        timeBySubject: [],
        completionRate: 0,
        averageDuration: 0,
        message: "No data found" // Add this for debugging
      });
    }
    // Base filter with user and optional date range
    let filter = { user: userId };
    if (startDate && endDate) {
      filter.createdAt = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }
    if (subject) {
      filter.subject = subject;
    }

    // Get all matching timorias first
    const timorias = await Timoria.find(filter);
    const totalCompletedTimorias = await Timoria.countDocuments({ ...filter, status: 'done' }); // getting the total number of completed timorias
    console.log('total completed timorias ', totalCompletedTimorias);
    
    // Calculate statistics
    const statistics = {
      totalTimorias: timorias.length,
      totalCompletedTimorias: totalCompletedTimorias || 0,
      totalTimeSpent: timorias.reduce((sum, t) => sum + t.duration, 0) / 60,
      statusBreakdown: calculateStatusBreakdown(timorias),
      timeBySubject: calculateTimeBySubject(timorias),
      completionRate: calculateCompletionRate(timorias),
      averageDuration: calculateAverageDuration(timorias),
      totalTopics: calculateNumberOfTopics(timorias),
      totalSubjects: calculateNumberOfSubjects(timorias),
      timeSpentPerDay: calculateTimeSpentPerDay(timorias),  

    };

    res.json(statistics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper functions
function calculateStatusBreakdown(timorias) {
  const counts = { planned: 0, ongoing: 0, done: 0 };
  timorias.forEach(t => counts[t.status]++);
  return counts;
}

function calculateTimeBySubject(timorias) {
  const timeMap = {};
  timorias.forEach(t => {
    timeMap[t.subject] = (timeMap[t.subject] || 0) + t.duration;
  });
  return Object.entries(timeMap).map(([subject, minutes]) => ({
    subject,
    hours: (minutes / 60).toFixed(2)
  }));
}

function calculateCompletionRate(timorias) {
  const total = timorias.length;
  const completed = timorias.filter(t => t.status === 'done').length;
  return total > 0 ? (completed / total * 100).toFixed(1) : 0;
}

function calculateAverageDuration(timorias) {
  const total = timorias.reduce((sum, t) => sum + t.duration, 0);
  return timorias.length > 0 ? (total / timorias.length).toFixed(1) : 0;
}

// Calculate unique number of topics
const calculateNumberOfTopics = (timorias) => {
  const uniqueTopics = new Set(timorias.map(t => t.topic));
  return uniqueTopics.size;
};

// Calculate unique number of subjects
const calculateNumberOfSubjects = (timorias) => {
  const uniqueSubjects = new Set(timorias.map(t => t.subject));
  return uniqueSubjects.size;
};


// Calculate time spent per day
function calculateTimeSpentPerDay(timorias) {
  const timeByDay = {};

  timorias.forEach(t => {
    const date = t.createdAt.toISOString().split('T')[0]; // Get the date (yyyy-mm-dd)
    if (!timeByDay[date]) {
      timeByDay[date] = 0;
    }
    timeByDay[date] += t.duration; // Sum up the duration (in minutes)
  });

  // Convert the time to hours and return as an array of objects with date and hours spent
  return Object.entries(timeByDay).map(([date, minutes]) => ({
    date,
    hours: (minutes / 60).toFixed(2), // Convert to hours and fix to two decimal places
  }));
}


exports.getDistinctLists = async (req, res) => {
  try {
    const userId = req.user.id;

    /**
     * The value of the user id may look like a string here but in mongoDB is ObjectId type
     * if we query using the plain string it will be a mismatch even if the id is actually the same because the type does not 
     * match. The following line will cast the String to ObjectId. Then we store that object into a filter that contains the 
     * actual field name in the schema (user) and we query with it. 
     */
    const uid = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;

    const filter = { user: uid };

    // Each call returns an array of unique values for that field
    const subjects = await Timoria.distinct('subject', filter);
    const topics   = await Timoria.distinct('topic', filter);
    const tags     = await Timoria.distinct('tag', filter);

    res.status(200).json({
      subjects,
      topics,
      tags
    });
  } catch (err) {
    //console.error('taxonomy error:', err);
    res.status(400).json({ error: 'Failed to load lists.' });
  }
}