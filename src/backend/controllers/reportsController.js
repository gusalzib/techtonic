const r2 = require('../services/r2client.js');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const Report = require('../models/report');
const Timoria = require('../models/timoria');
const { DateTime } = require('luxon');
const PDFDocument = require('pdfkit');
const { Types } = require('mongoose');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3')

// ============================================================================
// 1. REPORT GENERATION CONTROLLERS
// ============================================================================

/**
 * CONTROLLER: POST /api/reports/generate
 * Generates a PDF, uploads to R2, saves metadata.
 * Does NOT return the stats JSON, but the Report metadata.
 */
exports.generateWeeklyReport = async (req, res) => {
  try {
    const userId = req.user?.id || req.params.id;
    const userTz = req.user.userTz || 'Europe/Stockholm';

    console.log(`[Report] Starting generation for User: ${userId}`);

    // 1. Define "Weekly" Range (Last 7 Days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7);

    // 2. Fetch Data (Internal Helper)
    // We pass ISO strings because buildDateRange expects them
    const stats = await fetchTimoriaStats(
      userId,
      startDate.toISOString(),
      endDate.toISOString(),
      userTz
    );

    console.log(`[Report] Stats fetched. Total Timorias found: ${stats.totalTimorias}`);

    // 3. Generate PDF Buffer
    const buffer = await generateWeeklyReportPDF(stats, userId);

    // 4. Upload to R2
    const fileKey = `reports/${userId}/weekly-${Date.now()}.pdf`;
    
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: 'application/pdf'
    }));

    const fileUrl = `${process.env.R2_PUBLIC_BASE_URL}/${process.env.R2_BUCKET_NAME}/${fileKey}`;

    // 5. Save Metadata to DB
    const report = await Report.create({
      user: userId,
      type: 'weekly',
      periodStart: startDate,
      periodEnd: endDate,
      fileKey,
      fileUrl,
      fileSize: buffer.length
    });

    res.status(201).json(report);

  } catch (error) {
    console.error('Report generation failed:', error);
    res.status(500).json({
      message: 'Failed to generate report',
      error: error.message
    });
  }
};

/**
 * CONTROLLER: GET /api/reports
 * Lists past reports for the user.
 */
exports.getUserReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const reports = await Report.find({ user: userId })
      .sort({ createdAt: -1 })
      .select('type periodStart periodEnd createdAt fileUrl fileSize');

    res.status(200).json(reports);
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports' });
  }
};

// ============================================================================
// 2. INTERNAL LOGIC (The "Brain")
// ============================================================================

/**
 * INTERNAL HELPER
 * Fetches data from MongoDB and calculates stats.
 * This is NOT an HTTP endpoint. It is a utility for generateWeeklyReport.
 */
async function fetchTimoriaStats(userId, startDate, endDate, userTz, subjectFilter = null) {
  // 1. Sanitize User ID
  const uid = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : userId;

  // 2. Build Query Filter
  let filter = { user: uid };

  // Handle Date Range
  if (startDate && endDate) {
    const range = buildDateRange(startDate, endDate, userTz);
    if (range) {
      filter.createdAt = { $gte: range.start, $lte: range.end };
      
      // DEBUG LOGGING (Check your server console!)
      console.log('--- DEBUG REPORT QUERY ---');
      console.log('User ID (ObjectId):', uid);
      console.log('Range Start:', range.start);
      console.log('Range End:', range.end);
      console.log('--------------------------');
    }
  }

  // Handle Subject Filter
  if (subjectFilter) {
    filter.subject = subjectFilter;
  }

  // 3. Fetch Data
  const timorias = await Timoria.find(filter);
  const totalCompleted = await Timoria.countDocuments({ ...filter, status: 'done' });

  // 4. Return Standardized Object
  if (!timorias || timorias.length === 0) {
    
    // --- ADVANCED DEBUGGING BLOCK ---
    console.log('⚠️ [Report Debug] No data found in date range. Running sanity checks...');
    
    try {
      // Check 1: Do ANY documents exist for this user (ObjectId)?
      const allTimeCount = await Timoria.countDocuments({ user: uid });
      console.log(`[Report Debug] Total docs for user (All Time): ${allTimeCount}`);

      if (allTimeCount > 0) {
        // If data exists, show the most recent date
        const latest = await Timoria.findOne({ user: uid }).sort({ createdAt: -1 });
        console.log(`[Report Debug] Most recent document was created at: ${latest?.createdAt}`);
        console.log(`[Report Debug] (Make sure this date falls between Range Start and Range End above)`);
      } else {
        // Check 2: Do documents exist for this user as a STRING?
        // (This happens if data was saved without casting to ObjectId)
        const stringIdCount = await Timoria.countDocuments({ user: userId.toString() });
        console.log(`[Report Debug] Total docs using String ID "${userId}": ${stringIdCount}`);
        
        if (stringIdCount > 0) {
           console.log('[Report Debug] CRITICAL: Data found with String ID! Your Database has mixed types.');
        } else {
           console.log('[Report Debug] No data found for this user ID in any format.');
        }
      }
    } catch (debugErr) {
      console.log('[Report Debug] Error running debug checks:', debugErr.message);
    }
    // --------------------------------

    return {
      isEmpty: true,
      totalTimorias: 0,
      totalTimeSpent: 0,
      statusBreakdown: { planned: 0, ongoing: 0, done: 0 },
      timeBySubject: [],
      timeByTopic: [],
      timeByTag: [],
      completionRate: 0,
      averageDuration: 0,
      totalTopics: 0,
      totalSubjects: 0,
      generatedAt: new Date(),
      period: { start: startDate, end: endDate }
    };
  }

  return {
    isEmpty: false,
    period: { start: startDate, end: endDate },
    totalTimorias: timorias.length,
    totalCompletedTimorias: totalCompleted || 0,
    totalTimeSpent: (timorias.reduce((sum, t) => sum + t.duration, 0) / 60).toFixed(2),
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
    generatedAt: new Date()
  };
}

// ============================================================================
// 3. PDF GENERATION & HELPERS
// ============================================================================

function generateWeeklyReportPDF(stats, userId) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // --- Header ---
      doc.fontSize(24).text('Timoria Weekly Report', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(10).fillColor('grey');
      doc.text(`User ID: ${userId}`, { align: 'right' });
      doc.text(`Generated: ${stats.generatedAt.toLocaleString()}`, { align: 'right' });
      doc.moveDown(2);

      // --- Summary Section ---
      doc.fillColor('black').fontSize(16).text('Executive Summary', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(12).text(`Total Sessions: ${stats.totalTimorias}`);
      doc.text(`Total Focus Time: ${stats.totalTimeSpent} hours`);
      doc.text(`Completion Rate: ${stats.completionRate}%`);
      doc.text(`Avg Duration: ${stats.averageDuration} mins`);
      doc.moveDown(2);

      // --- Subject Breakdown ---
      doc.fontSize(16).text('Time by Subject', { underline: true });
      doc.moveDown(0.5);

      if (stats.timeBySubject && stats.timeBySubject.length > 0) {
        stats.timeBySubject.forEach(item => {
          doc.fontSize(12).text(`• ${item.subject}: ${item.hours} hours`, { indent: 20 });
        });
      } else {
        doc.fontSize(12).text('No data for this period.', { indent: 20, oblique: true });
      }
      doc.moveDown(2);

      // --- Topic Breakdown ---
      doc.fontSize(16).text('Top Topics', { underline: true });
      doc.moveDown(0.5);

      if (stats.timeByTopic && stats.timeByTopic.length > 0) {
        // Take top 10
        const topTopics = stats.timeByTopic
          .sort((a, b) => b.hours - a.hours)
          .slice(0, 10);

        topTopics.forEach(item => {
          doc.fontSize(12).text(`• ${item.topic}: ${item.hours} hours`, { indent: 20 });
        });
      } else {
        doc.fontSize(12).text('No data for this period.', { indent: 20, oblique: true });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function buildDateRange(startDate, endDate, timezone) {
  if (!startDate || !endDate) return null;
  const tz = timezone || 'Europe/Stockholm';

  const start = DateTime.fromISO(startDate, { zone: tz }).startOf('day').toUTC().toJSDate();
  const end = DateTime.fromISO(endDate, { zone: tz }).endOf('day').toUTC().toJSDate();

  return { start, end };
}



// ============================================================================
// 4. SIGNED URLS CONTROLLER
// ============================================================================



exports.getSignedURL = async (req, res) => {
    const reportId = req.params.id
    const userId = req.user.id;

    try {

    // 1. Find the report and verify ownership
    const report = await Report.findOne({ _id: reportId, user: userId });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // 2. Guard if statement 
    if (!report.fileKey) {
      console.error('Report missing fileKey:', report)
      return res.status(500).json({ error: 'Report file key missing' })
    }
  
    const command = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,   
      Key: report.fileKey
    })

    // Generate signed URL valid for 15 minutes
    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 900 })

    res.json({ signedUrl })
  } catch (err) {
    console.error('Error generating signed URL:', err)
    res.status(500).json({ error: 'Failed to generate signed URL' })
  }
}


// ============================================================================
// 5. DELETE A REPORT
// ============================================================================

exports.deleteReport = async (req, res) => {
  const reportId = req.params.id
  const userId = req.user.id

  try {
    // 1. Fetch report
    const report = await Report.findOne({ _id: reportId, user: userId })

    if (!report) {
      return res.status(404).json({ error: 'Report not found' })
    }

    // 2. Delete from R2 FIRST
    if (report.fileKey) {
      const command = new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: report.fileKey
      })

      await r2.send(command)
    }

    // 3. Delete from DB
    await report.deleteOne()

    res.json({ success: true })
  } catch (err) {
    console.error('Failed to delete report:', err)
    res.status(500).json({ error: 'Failed to delete report' })
  }
}


// --- Calculation Helpers (Pure Functions) ---

function calculateStatusBreakdown(timorias) {
  const counts = { planned: 0, ongoing: 0, done: 0 };
  timorias.forEach(t => { if(counts[t.status] !== undefined) counts[t.status]++ });
  return counts;
}

function calculateTimeBySubject(timorias) {
  const timeMap = {};
  timorias.forEach(t => { timeMap[t.subject] = (timeMap[t.subject] || 0) + t.duration; });
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

const calculateNumberOfTopics = (timorias) => new Set(timorias.map(t => t.topic)).size;
const calculateNumberOfSubjects = (timorias) => new Set(timorias.map(t => t.subject)).size;

function calculateTimeSpentPerDay(timorias) {
  const timeByDay = {};
  timorias.forEach(t => {
    const date = t.createdAt.toISOString().split('T')[0];
    timeByDay[date] = (timeByDay[date] || 0) + t.duration;
  });
  return Object.entries(timeByDay).map(([date, minutes]) => ({
    date,
    hours: (minutes / 60).toFixed(2),
  }));
}

function calculateAverageTimePerActivityDay(timorias) {
  if (!timorias || timorias.length === 0) return 0;
  const totalMinutes = timorias.reduce((sum, t) => sum + (t.duration || 0), 0);
  const activeDays = new Set();
  for (const t of timorias) {
    const dateSource = t.createdAt || t.finishedAt;
    if (dateSource) {
      const d = new Date(dateSource);
      if (!isNaN(d.getTime())) activeDays.add(d.toISOString().slice(0, 10));
    }
  }
  return activeDays.size === 0 ? 0 : Number(((totalMinutes / 60) / activeDays.size).toFixed(2));
}

function calculateAverageTimoriasPerActivityDay(timorias){
  if (!timorias || timorias.length === 0) return 0;
  const activeDays = new Set();
  for (const t of timorias) {
    const dateSource = t.createdAt || t.finishedAt;
    if (dateSource) {
      const d = new Date(dateSource);
      if (!isNaN(d.getTime())) activeDays.add(d.toISOString().slice(0, 10));
    }
  }
  return activeDays.size === 0 ? 0 : Math.round((timorias.length / activeDays.size) * 100) / 100;
}

function calculateTimeByTopic(timorias) {
  if (!timorias || timorias.length === 0) return [];
  const minutesByTopic = new Map();
  for (const t of timorias) {
    const topic = (t.topic || t.topics || 'Unknown'); 
    minutesByTopic.set(topic, (minutesByTopic.get(topic) || 0) + (t.duration || 0));
  }
  return Array.from(minutesByTopic.entries()).map(([topic, minutes]) => ({
    topic,
    minutes,
    hours: Math.round((minutes / 60) * 100) / 100
  }));
}

function calculateTimeByTag(timorias) {
  if (!timorias || timorias.length === 0) return [];
  const minutesByTag = new Map();
  for (const t of timorias) {
    let tags = parseTagsToArray(t.tag);
    if (tags.length === 0) tags = ['#unknown'];
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

function parseTagsToArray(tagString) {
  if (!tagString || typeof tagString !== 'string') return [];
  return tagString.trim().split(/\s+/).map(t => t.trim()).filter(Boolean)
    .map(t => (t.startsWith('#') ? t : `#${t}`))
    .map(t => t.toLowerCase())
    .filter((tag, idx, arr) => arr.indexOf(tag) === idx);
}