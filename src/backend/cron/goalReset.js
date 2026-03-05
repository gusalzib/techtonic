const cron = require('node-cron');
const Goal = require('../models/goal');
const { DateTime } = require('luxon');

let isRunning = false;

// Run every Monday at 06:00 AM
cron.schedule('0 6 * * 1', async () => {
  /**
   * without the isRunning flag, the cron job will fire on every second of the minute when the jon is supposed to happen
   */
  if (isRunning) {
    return;
  }

  isRunning = true;

  console.log('--- Running Weekly Goal Reset ---');
  
  try {
    const lastWeek = DateTime.now().minus({ weeks: 1 }).toFormat("kkkk-'W'WW");
    const currentWeek = DateTime.now().toFormat("kkkk-'W'WW");

    // 1. Find all recurring goals from the week that just ended
    const recurringGoals = await Goal.find({ 
      isRecurring: true, 
      weekIdentifier: lastWeek 
    });
      
      if (recurringGoals.length === 0) {
        console.log('--- No recurring goals from last week were found ---');
      }

    for (const oldGoal of recurringGoals) {
        console.log('--- Lopping Through Weekly Goals ---');
      // 2. Check if a goal for this week already exists (to avoid duplicates)
      const exists = await Goal.findOne({
        user: oldGoal.user,
        title: oldGoal.title,
        weekIdentifier: currentWeek
      });

      if (!exists) {
        // 3. Clone the goal
        const newGoal = new Goal({
          title: oldGoal.title,
          user: oldGoal.user,
          targetMinutes: oldGoal.targetMinutes,
          subject: oldGoal.subject,
          topic: oldGoal.topic,
          tag: oldGoal.tag,
          isRecurring: true,
          weekIdentifier: currentWeek,
          status: 'active'
        });
        await newGoal.save();
        console.log(`Cloned goal: ${oldGoal.title} for user ${oldGoal.user}`);
      } else {
        console.log(`⏭️ Skipped: "${oldGoal.title}" (Already exists for this week)`);
      }
    }
  } catch (err) {
    console.error('Error in Goal Reset Cron:', err);
  }
});