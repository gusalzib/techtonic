const { Types } = require('mongoose');
const Timoria = require('../models/timoria');
const User = require('../models/user');
const { DateTime } = require("luxon");

// exports.getleaderboard = async (req, res) => {
//   try {
//     const leaderboard = await Timoria.aggregate([
//       { $match: { status: "done" } }, // count only completed Timorias
//       { $group: { _id: "$user", totalTimorias: { $sum: 1 } } }, // group by user ID
//       { $sort: { totalTimorias: -1 } },
//       { $limit: 10 },
//       // join with user collection to get username
//       {
//         $lookup: {
//           from: "users", // collection name in MongoDB (usually lowercase plural)
//           localField: "_id",
//           foreignField: "_id",
//           as: "userInfo"
//         }
//       },
//       { $unwind: "$userInfo" },
//       { $project: { _id: 1, username: "$userInfo.username", totalTimorias: 1 } }
//     ]);

//     res.status(200).json(leaderboard);
//   } catch (err) {
//     console.error("Leaderboard fetch failed:", err);
//     res.status(500).json({ message: "Failed to fetch leaderboard" });
//   }
// };

// exports.getleaderboard = async (req, res) => {
//   const { type } = req.query; // 'completed', 'hours', 'streaks'

//   try {
//     let leaderboard = [];

//     if (type === 'hours') {
//       leaderboard = await Timoria.aggregate([
//         { $match: { status: 'done' } },
//         { $group: { _id: "$user", totalMinutes: { $sum: "$duration" } } },
//         { $sort: { totalMinutes: -1 } },
//         { $limit: 10 },
//         {
//           $lookup: {
//             from: "users",
//             localField: "_id",
//             foreignField: "_id",
//             as: "userInfo"
//           }
//         },
//         { $unwind: "$userInfo" },
//         {
//           $project: {
//             _id: 1,
//             username: "$userInfo.username",
//             totalHours: { $divide: ["$totalMinutes", 60] } // convert minutes to hours here
//           }
//         }
//       ]);
//     } else if (type === 'streaks') {
//       const users = await User.find().select('_id username');
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);

//       for (const user of users) {
//         const timorias = await Timoria.find({
//           user: user._id,
//           status: 'done'
//         }).sort({ finishedAt: -1 }).select('finishedAt');

//         let streak = 0;
//         let lastDate = null;

//         for (const t of timorias) {
//           const tDate = new Date(t.finishedAt);
//           tDate.setHours(0, 0, 0, 0);

//           if (lastDate === null) lastDate = today;

//           const diff = Math.floor((lastDate - tDate) / (1000 * 60 * 60 * 24));

//           if (diff === 0 || diff === 1) {
//             streak++;
//             lastDate = new Date(tDate);
//             lastDate.setDate(lastDate.getDate() - 1);
//           } else {
//             break;
//           }
//         }

//         leaderboard.push({ _id: user._id, username: user.username, streak });
//       }

//       // Sort by streak descending and limit top 10
//       leaderboard = leaderboard.sort((a, b) => b.streak - a.streak).slice(0, 10);

//     } else { // completed
//       leaderboard = await Timoria.aggregate([
//         { $match: { status: 'done' } },
//         { $group: { _id: "$user", totalTimorias: { $sum: 1 } } },
//         { $sort: { totalTimorias: -1 } },
//         { $limit: 10 },
//         {
//           $lookup: {
//             from: "users",
//             localField: "_id",
//             foreignField: "_id",
//             as: "userInfo"
//           }
//         },
//         { $unwind: "$userInfo" },
//         { $project: { _id: 1, username: "$userInfo.username", totalTimorias: 1 } }
//       ]);
//     }

//     res.status(200).json(leaderboard);
//   } catch (err) {
//     console.error("Leaderboard fetch failed:", err);
//     res.status(500).json({ message: "Failed to fetch leaderboard" });
//   }
// };


exports.getleaderboard = async (req, res) => {
  const { type } = req.query; // 'completed', 'hours', 'streaks'

  try {
    let leaderboard = [];

    if (type === "hours") {
      leaderboard = await Timoria.aggregate([
        { $match: { status: "done" } },
        { $group: { _id: "$user", totalMinutes: { $sum: "$duration" } } },
        { $sort: { totalMinutes: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        { $unwind: "$userInfo" },
        {
          $project: {
            _id: 1,
            username: "$userInfo.username",
            // Convert minutes to hours and round to 1 decimal for cleanliness
            totalHours: { $round: [{ $divide: ["$totalMinutes", 60] }, 1] },
          },
        },
      ]);
    } else if (type === "streaks") {
      // 1. Aggregation: Get all unique dates where users finished a task
      const userActivity = await Timoria.aggregate([
        { $match: { status: "done" } },
        // Project the date as a string YYYY-MM-DD to handle same-day tasks automatically
        {
          $project: {
            user: 1,
            dateStr: {
              $dateToString: { format: "%Y-%m-%d", date: "$finishedAt" },
            },
          },
        },
        // Group by User + Date to remove duplicates (multiple tasks same day)
        {
          $group: {
            _id: { user: "$user", date: "$dateStr" },
          },
        },
        // Group by User to get an array of unique active dates
        {
          $group: {
            _id: "$_id.user",
            dates: { $push: "$_id.date" },
          },
        },
        // Join with User info to get username and timezone
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        { $unwind: "$userInfo" },
      ]);

      // 2. JavaScript: Calculate streaks for each user
      leaderboard = userActivity.map((entry) => {
        // Sort dates descending (newest first): ['2023-12-25', '2023-12-24'...]
        const dates = entry.dates.sort().reverse();
        const userTimezone = entry.userInfo.timezone || "Europe/Stockholm";

        // Determine "Today" and "Yesterday" in the user's specific timezone
        const now = DateTime.now().setZone(userTimezone);
        const today = now.toISODate();
        const yesterday = now.minus({ days: 1 }).toISODate();

        let streak = 0;
        let currentCheck = dates[0]; // The most recent active day

        // Rule: To have an active streak, the last activity must be Today OR Yesterday.
        if (currentCheck === today || currentCheck === yesterday) {
          streak = 1; // Start counting
          
          // Loop through the rest of the history
          // We start checking against the day before the 'currentCheck'
          let expectedDate = DateTime.fromISO(currentCheck).minus({ days: 1 }).toISODate();

          for (let i = 1; i < dates.length; i++) {
            if (dates[i] === expectedDate) {
              streak++;
              // Move expected date back one more day
              expectedDate = DateTime.fromISO(dates[i]).minus({ days: 1 }).toISODate();
            } else {
              // Gap found, streak ends
              break;
            }
          }
        }

        return {
          _id: entry._id,
          username: entry.userInfo.username,
          streak: streak,
        };
      });

      // 3. Sort by streak and take top 10
      leaderboard = leaderboard
        .filter(u => u.streak > 0) // Optional: Hide users with 0 streak
        .sort((a, b) => b.streak - a.streak)
        .slice(0, 10);

    } else {
      // Completed Timorias (Default)
      leaderboard = await Timoria.aggregate([
        { $match: { status: "done" } },
        { $group: { _id: "$user", totalTimorias: { $sum: 1 } } },
        { $sort: { totalTimorias: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        { $unwind: "$userInfo" },
        {
          $project: {
            _id: 1,
            username: "$userInfo.username",
            totalTimorias: 1,
          },
        },
      ]);
    }

    res.status(200).json(leaderboard);
  } catch (err) {
    console.error("Leaderboard fetch failed:", err);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
};



