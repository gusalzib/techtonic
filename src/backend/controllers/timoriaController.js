const Timoria = require('../models/timoria')
const { Types } = require('mongoose');
const { DateTime } = require('luxon');


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
  const { subject, topic, tag, task, duration, status } = req.body;
  const userId = req.user.id;

  try {
    // Normalize the tag string into proper hashtags
    const normalizedTag = normalizeTagString(tag);  // e.g. "focus math" -> "#focus #math"

    const newTimoria = new Timoria({
      subject,
      topic,
      tag: normalizedTag,     // store back into the existing 'tag' field
      task,
      duration,
      status,
      user: userId,
    });

    await newTimoria.save();
    res.status(201).json(newTimoria);
  } catch (err) {
    console.log(err.message);
    res.status(400).json({ error: err.message });
  }
};



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

  // Europe/Stockholm as a fallback timezone if the user does not have a timezone registered
  const userTimezone = req.user.userTz || 'Europe/Stockholm';
  // console.log(userTimezone);
  

  // commented out so that we can test the dynamic timezone feature
  // const startOfDay = new Date()
  // startOfDay.setHours(0, 0, 0, 0)

  // const endOfDay = new Date()
  // endOfDay.setHours(23, 59, 59, 999)
  
  // Define "today" in the user's timezone,
  // then convert the boundaries to UTC for Mongo query.
  const startOfDay = DateTime.now()
    .setZone(userTimezone)
    .startOf('day')
    .toUTC()
    .toJSDate();

  const endOfDay = DateTime.now()
    .setZone(userTimezone)
    .endOf('day')
    .toUTC()
    .toJSDate();

  try {
    const uid = Types.ObjectId.isValid(req.user.id) ? new Types.ObjectId(req.user.id) : req.user.id;

    const todayTimorias = await Timoria.find({
      user: uid, // makes sure we only get today's timorias for the logged in user and not everyone
      finishedAt: { $gte: startOfDay, $lte: endOfDay },
      status: 'done'
    }).sort({ finishedAt: -1 })

    res.status(200).json(todayTimorias)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// get specific timoria
exports.getTimoriaByID = async (req, res) => {
  try {
    const timoria = await Timoria.findById(req.params.id)

    if (!timoria) {
      return res.status(404).json({ message: 'Timoria not found' })
    }

    res.status(200).json(timoria)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
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

  const userId = req.user.id;
  const userTz = req.user.userTz || 'Europe/Stockholm';

  let filter = { user: userId }; // ensure per-user filter here too

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
    // commented out to test dynamic timezone feature
    // const start = new Date(startDate);
    // const end = new Date(endDate);
    // filter.createdAt = { $gte: start, $lte: end };

    const range = buildDateRange(startDate, endDate, userTz);
    if (range) {
      filter.createdAt = {$gte: range.start, $lte: range.end}
    }
    
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

    // console.log('Backend received startDate:', startDate, 'endDate:', endDate); 
    
    const userId = req.user.id;
    const userTz = req.user.userTz || 'Europe/Stockholm';

    // First check if there's any data at all
    const totalCount = await Timoria.countDocuments({ user: userId });
    if (totalCount === 0) {
      return res.json({
        totalTimorias: 0,
        totalTimeSpent: 0,
        totalTopics: 0,
        totalSubjects: 0,
        statusBreakdown: { planned: 0, ongoing: 0, done: 0 },
        timeBySubject: [],
        timeByTopic: [],
        timeByTag: [],
        completionRate: 0,
        averageDuration: 0,
        averageTimePerActivityDay: 0,
        averageTimoriasPerActivityDay: 0,
        message: "No data found" // for debugging
      });
    }
    // Base filter with user and optional date range
    let filter = { user: userId };
    if (startDate && endDate) {
      // commented out to test dynamic timezone feature
      // filter.createdAt = { 
      //   $gte: new Date(startDate), 
      //   $lte: new Date(endDate) 
      // };
      const range = buildDateRange(startDate, endDate, userTz);
      if (range) {
        filter.createdAt = {$gte: range.start, $lte: range.end}
      }
    }
    if (subject) {
      filter.subject = subject;
    }

    // Get all matching timorias first
    const timorias = await Timoria.find(filter);
    const totalCompletedTimorias = await Timoria.countDocuments({ ...filter, status: 'done' }); // getting the total number of completed timorias

    //console.log('total completed timorias ', totalCompletedTimorias);
    
    // Calculate statistics
    const statistics = {
      totalTimorias: timorias.length,
      totalCompletedTimorias: totalCompletedTimorias || 0,
      totalTimeSpent: timorias.reduce((sum, t) => sum + t.duration, 0) / 60,
      statusBreakdown: calculateStatusBreakdown(timorias),
      timeBySubject: calculateTimeBySubject(timorias),
      timeByTopic: calculateTimeByTopic(timorias),
      timeByTag: calculateTimeByTag(timorias),
      completionRate: calculateCompletionRate(timorias),
      averageDuration: calculateAverageDuration(timorias),
      totalTopics: calculateNumberOfTopics(timorias),
      totalSubjects: calculateNumberOfSubjects(timorias),
      timeSpentPerDay: calculateTimeSpentPerDay(timorias),  
      averageTimePerActivityDay: calculateAverageTimePerActivityDay(timorias),
      averageTimoriasPerActivityDay: calculateAverageTimoriasPerActivityDay(timorias),

    };

    res.json(statistics);
  } catch (err) {
    res.status(500).json({ error: err.message });
    //console.log(err.message);
    
  }
};


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

exports.getTimoriaHistory = async (req, res) => {
 try {
    const userId = req.user.id;

    // Pagination params (default: page 1, 20 items per page)
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 20, 1);
    const skip = (page - 1) * limit;

    // Optional date range filters
    const { startDate, endDate } = req.query;
    const userTz = req.user.userTz || 'Europe/Stockholm';
    const filter = { user: userId };

    // commented out to test dynamic timezone feature
    // if (startDate && endDate) {
    //   filter.createdAt = {
    //     $gte: new Date(startDate),
    //     $lte: new Date(endDate),
    //   };
    // }
    if (startDate && endDate) {
      const range = buildDateRange(startDate, endDate, userTz);
      if (range) {
        filter.createdAt = { $gte: range.start, $lte: range.end };
      }
    }
    // Fetch data + total count in parallel
    const [timorias, total] = await Promise.all([
      Timoria.find(filter)
        .sort({ createdAt: -1 }) // newest first
        .skip(skip)
        .limit(limit),
      Timoria.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      timorias,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (err) {
    console.error('Error in getTimoriaHistory:', err);
    res.status(500).json({ error: err.message });
  }
}

// ########################################################################### Helper functions ##################################################################################3
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

function calculateAverageTimePerActivityDay(timorias) {
  if (!timorias || timorias.length === 0) {
    return 0; 
  }


  // total minutes across all timorias
  const totalMinutes = timorias.reduce((sum, t) => sum + (t.duration || 0), 0);

  // count distinct days that have at least one timoria based on the createdAt to match our filter
  const activeDays = new Set();

  for (const t of timorias) {
    const dateSource = t.createdAt || t.finishedAt;

    if (dateSource) {
      const d = new Date(dateSource);

      if (!isNaN(d.getTime())) {
        // YYYY-MM-DD timezone agnostic day key
        activeDays.add(d.toISOString().slice(0, 10))
      }
    }
  }

  const daysCount = activeDays.size;

  if (daysCount === 0) {
    return 0;
  }

  // convert minutes -> hours  then dividing by the number of active days
  const hoursPerActivityDay = (totalMinutes / 60) / daysCount;

  return Number(hoursPerActivityDay.toFixed(2))
}


function calculateAverageTimoriasPerActivityDay(timorias){
  if (!timorias || timorias.length === 0) {
    return 0; 
  }
  // count distinct days that have at least one timoria based on the createdAt to match our filter
  const activeDays = new Set();

  for (const t of timorias) {
    const dateSource = t.createdAt || t.finishedAt;

    if (dateSource) {
      const d = new Date(dateSource);

      if (!isNaN(d.getTime())) {
        // YYYY-MM-DD timezone agnostic day key
        activeDays.add(d.toISOString().slice(0, 10))
      }
    }
  }

  const daysCount = activeDays.size;

  if (daysCount === 0) {
    return 0;
  }


  const average = timorias.length / daysCount;
  
  return Math.round(average * 100) / 100; // 2 decimals  
}

function calculateTimeByTopic(timorias) {
  if (!timorias || timorias.length === 0) {
    return 0; 
  }

  const minutesByTopic = new Map();

  for (const t of timorias) {
    const topic = (t.topic || t.topics || 'Unknown'); 

    const minutes = t.duration || 0;
    minutesByTopic.set(topic, (minutesByTopic.get(topic) || 0) + minutes);
  }

  // Return both minutes and hours; frontend can choose
  return Array.from(minutesByTopic.entries()).map(([topic, minutes]) => ({
    topic,
    minutes,
    hours: Math.round((minutes / 60) * 100) / 100
  }));
}

function calculateTimeByTag(timorias) {
  if (!timorias || timorias.length === 0) {
    return []; // array is easier for frontend to work with
  }

  const minutesByTag = new Map();

  for (const t of timorias) {
    // Parse the single 'tag' string into individual tags
    let tags = parseTagsToArray(t.tag);

    if (tags.length === 0) {
      tags = ['#unknown']; // if the tag field is empty, fill it with the 'unkown' value
    }

    const minutes = t.duration || 0;

    for (const tag of tags) {
      minutesByTag.set(tag, (minutesByTag.get(tag) || 0) + minutes);
    }
  }

  return Array.from(minutesByTag.entries()).map(([tag, minutes]) => ({
    tag,
    minutes,
    hours: Math.round((minutes / 60) * 100) / 100,
  }));
}


// This function takes a single string of tags typed by the user 
// (for example: "focus math #DeepWork") 
// and converts it into a clean array of properly formatted tags
// (for example: ["#focus", "#math", "#deepwork"]).
//
// The purpose is to standardize tags because the database stores them 
// as one string, but we need them as separate items for statistics.
//
// Steps this function performs:
// 1. Validates that the input is a proper string.
// 2. Removes leading/trailing spaces.
// 3. Splits the string into individual words (each word is considered a tag).
// 4. Removes any empty entries that might appear due to multiple spaces.
// 5. Ensures every tag starts with a "#" character.
// 6. Converts all tags to lowercase for consistency.
// 7. Removes duplicate tags so each tag appears only once.
//
// Finally, it returns an array of cleaned tag strings.

function parseTagsToArray(tagString) {
  // if tagString is empty, null, undefined, or not a string
  // we return an empty array because there are no valid tags
  if (!tagString || typeof tagString !== 'string') {
    return [];
  } 

  return tagString
    .trim()
    /**
     * Removes leading and trainlin spaces from the whole string
     * example: "   focus math   " become "focus math"
     */
    .split(/\s+/)              // split by whitespace
    /**
     * splits the string into separate words based on ANY amount of whitespace
     * this means that it handles spaces, tabs, or even multiple spaces (between the words)
     * example: "focus    math  deepwork" becomes ["focus", "math", "deepwork"]
     */

    .map(t => t.trim())
    /**
     * ensures each individual tag has no surrounding spaces
     * usually it is not necessary after a split but it is here for safety 
     */

    .filter(Boolean)           // remove empties
    /**
     * removes any empty string that might still exist
     * Example: ["focus", "", "math"] => ["focus", "math"]
     */

    .map(t => (t.startsWith('#') ? t : `#${t}`))
    // Ensures every tag begins with a "#" sign.
    // If the user typed "math" -> "#math"
    // If user typed "#math" -> "#math" (unchanged)


    .map(t => t.toLowerCase()) // optional: normalize case
    // Converts the tag to lowercase.
    // This ensures "Math", "math", "MATH", "#Math" all become "#math".
    // Helps keep tags consistent across the entire application.

    .filter((tag, idx, arr) => arr.indexOf(tag) === idx); // dedupe
    // Removes duplicate tags.
    // Example before: ["#focus", "#math", "#focus"]
    // Example after:  ["#focus", "#math"]
    //
    // How it works:
    // - arr.indexOf(tag) gives the *first* occurrence of that tag.
    // - If the current index (idx) is NOT that first occurrence,
    //   then it's a duplicate and will be filtered out.
}

function normalizeTagString(tagString) {
  return parseTagsToArray(tagString).join(' ');
}


function buildDateRange(startDate, endDate, timezone) {
  if (!startDate || !endDate) return null;

  const tz = timezone || 'Europe/Stockholm';

  const start = DateTime.fromISO(startDate, { zone: tz })
    .startOf('day')
    .toUTC()
    .toJSDate();

  const end = DateTime.fromISO(endDate, { zone: tz })
    .endOf('day')
    .toUTC()
    .toJSDate();

  return { start, end };
}