# Techtonic Application Specifications

## 1. Overview
**Techtonic** is a full-stack web application designed to help users track their productivity (time management) and personal finances (budget control). It includes features like session-based time tracking (Pomodoro style), goal setting, automated weekly reporting, leaderboards for gamification, and budgeting. 

The application is built on the **MEVN stack**:
- **MongoDB** & **Mongoose** for the database.
- **Express.js** & **Node.js** for the backend API.
- **Vue.js 3** (with Pinia & Vue Router) for the frontend.

## 2. Core Features & Domain Models

### 2.1. Time Tracking ("Timoria")
The core productivity feature is called "Timoria" (meaning study/work sessions).
- **Functionality**: Users can plan Timorias, execute them with a countdown timer, and log the completed sessions.
- **Fields tracked**: 
  - `subject` (e.g., University, Work, Personal)
  - `topic` (e.g., Software Engineering, Math)
  - `tag` (e.g., #reading, #coding)
  - `task` (Specific task description)
  - `duration` (Planned or actual time in minutes)
  - `status` (planned, ongoing, done)
- **Break Settings**: Users can specify break duration between sessions.
- **UI Views**: Planned Timorias, Today's Timorias, Summary/History.

### 2.2. Goals
Users can define time-based weekly goals to track their progress towards specific subjects or topics.
- **Metrics**: Goals are based on `targetMinutes` per `weekIdentifier` (e.g., "2026-W09").
- **Recurrence**: Goals can be flagged as `isRecurring`, allowing a backend cron job to reset or carry them over to the next week.
- Timorias can be linked to a specific `goalId` so that tracked time counts towards the goal's target.

### 2.3. Analytics & Automated Weekly Reports
- **Statistics**: Users get detailed breakdowns of their tracked time by subject, topic, and tags.
- **Automated PDF Reports**: 
  - Every Sunday at 9 PM (Europe/Stockholm time), a `node-cron` job automatically analyzes each user's weekly activity.
  - It uses `pdfkit` to generate a formatted PDF report with executive summaries, completion rates, and subject/topic breakdowns.
  - The PDF is uploaded directly to a Cloudflare R2 bucket (S3 API compatible) via `@aws-sdk/client-s3`.
  - Database stores the metadata and users can view/download these reports via presigned URLs.

### 2.4. Gamification (Leaderboard)
- Users can see a leaderboard comparing their productivity against others.
- Leaderboard can be filtered by:
  - **Hours**: Total time tracked.
  - **Streaks**: Consecutive days of logging completed Timorias.
  - **Completed**: Total number of finished sessions.

### 2.5. Budget Control
A personal finance tracker is built into the app to log income and expenses.
- **Transactions**: Tracked by `amount`, `description`, `receiver`, `type` (income/expense), and `payment_date`. Can also be set as `recurring`.
- **Categories**: Transactions are assigned to user-specific custom categories.

## 3. Architecture & Technical Details

### 3.1. Backend API (Node.js & Express)
- **Auth**: JWT-based authentication with `bcrypt` password hashing.
- **Middlewares**: `cors` for cross-origin handling, `morgan` for logging, custom `authenticationMiddleware` for protecting routes.
- **Database Schema (Mongoose Models)**:
  - `User`: Handles auth, roles (regular, paid, admin), timezone.
  - `Timoria`: Subject, topic, tag, task, duration, status, linked `goalId`, and timestamps. Indexes are set on subject, topic, and tag for fast queries.
  - `Goal`: Target minutes, week identifiers, recurring flags.
  - `Report`: Metadata for the generated PDFs (`fileKey`, `fileUrl`, `periodStart`, `periodEnd`).
  - `Transaction` / `TransactionCategory`: Budgeting data.
- **Scheduled Tasks**: 
  - `cron/goalReset.js` (resets/recreates recurring weekly goals).
  - App-level cron expression `0 21 * * 0` triggers weekly report generation for all users.
- **Storage Integration**: `r2client.js` configures the S3 client using `aws-sdk` to manage assets in Cloudflare R2.

### 3.2. Frontend (Vue 3)
- **State Management**: `Pinia` (e.g., `userStore.js` for holding user state and timezone preferences).
- **Routing**: `vue-router` to navigate between views like `Home`, `Timoria`, `Leaderboard`, `Stats`, `BudgetControl`, `WeeklyPlanner`, etc.
- **Internationalization (i18n)**: Uses `vue-i18n`. Accommodates RTL (Arabic) languages, as also seen by the inclusion of Arabic font processing (`arabic-persian-reshaper`) in the backend's PDF generator.
- **Data Visualization**: `vue-chartjs` and `chart.js` combined with `chartjs-chart-matrix` to render stats and heatmaps.
- **Date Management**: `luxon` is heavily used across the frontend and backend to correctly handle user-specific timezones when transforming dates or calculating streaks.
- **UX Enhancements**: `vue-toastification` for non-blocking notifications, and an "Undo Delete" stack functionality specifically implemented in the Timoria view.

## 4. Workflows & Mechanics
- **Creating a Timoria**: A user selects or types a Subject, Topic, Tag, sets a duration, and creates a "Planned" session. Datalists are used for desktop, and custom auto-complete dropdowns are used for mobile compatibility.
- **Running a Session**: From the planned list, a user clicks "Start". The Timer component takes over, running down the clock. When finished, it triggers a `ding.mp3` sound, transitions status to "done", and captures `finishedAt`.
- **Report Security**: Presigned URLs (valid for 15 minutes) are dynamically generated by the backend when a user requests to view a report to ensure secure access to the R2 storage bucket.
- **Streaks Calculation**: The backend dynamically evaluates continuous days of activity taking the user's specific timezone into consideration to ensure accuracy in the Leaderboard.

## 5. Deep Dive: Timer Component Mechanics
The `Timer.vue` component is central to the application. It employs robust architectural choices to prevent timers from drifting or being killed by browser throttling:

- **State Management & Persistence**:
  - The Timer does not rely on a simple `setInterval` decrementing a variable (which gets paused by modern browsers in background tabs). 
  - Instead, the "single source of truth" is `timerState`, which tracks: `id`, `type` ('timoria' or 'break'), `plannedMs` (total planned milliseconds), `startedAt` (epoch timestamp), `pausedAt` (epoch timestamp if paused), and `totalPausedMs` (cumulative paused time).
  - `timerState` is aggressively persisted to `localStorage('activeTimoria')`. If a user accidentally closes or refreshes the page, the `mounted()` hook reconstructs the timer exactly where it left off.
- **Time Calculation**:
  - The remaining time is dynamically calculated: `Math.max(0, plannedMs - (Date.now() - startedAt - totalPausedMs))`.
  - The `setInterval` (ticking every 1000ms) only exists to update a reactive UI heartbeat variable (`nowTs`), triggering Vue to re-evaluate the `formattedTime` computed property.
- **Pause & Resume Logic**:
  - **Pause**: Captures `Date.now()` into `pausedAt`.
  - **Resume**: Computes the elapsed time since `pausedAt` and adds it to `totalPausedMs`, then clears `pausedAt`. This perfectly "freezes" the countdown without breaking the chronological calculation.
- **Break Mechanics**:
  - Once a session finishes, the timer emits a `completed` event to the parent (`Timoria.vue`), which sends an API request to mark the session as "done".
  - The parent can then trigger the timer's `startBreak()` method.
  - A break uses the exact same core logic, but forces the `type` flag to `'break'` and uses a dummy `id`. When a break concludes, it plays a distinct `break_over.mp3` sound and fires a notification, prompting the user to start their next planned session.
- **Notifications**: The Timer integrates with the browser's native `Notification` API to send push alerts when a Timoria or a Break is finished.

The timer logic in your `Timer.vue` component is built to be robust, surviving page refreshes by relying on **timestamp math** rather than a simple counter variable.

Here is a breakdown of how the logic functions behind the scenes:

### 1. The "Single Source of Truth" (`timerState`)
Instead of incrementing a variable every second (which is prone to drifting and resets on refresh), the app uses a `timerState` object initialized by the `createTimerState` helper function. 

This object contains:
* **`startedAt`**: The exact Unix timestamp when the timer first began.
* **`plannedMs`**: The total duration the user intended to work (in milliseconds).
* **`pausedAt`**: A timestamp indicating when the user hit pause (null if active).
* **`totalPausedMs`**: A cumulative sum of all time spent in a paused state.

This object is mirrored in `localStorage` as **"activeTimoria"**, allowing the `mounted()` hook to rebuild the timer's state perfectly if the user closes the tab or refreshes the page.

### 2. Authoritative Time Calculation
The component calculates time dynamically. The "current" time is never stored; it is derived whenever needed using the following logic:

#### A. Elapsed Time
To find out how much time has passed, the app uses this logic:
$$Elapsed = (ActiveUntil - startedAt) - totalPausedMs$$
Where `ActiveUntil` is either the current `Date.now()` or the `pausedAt` timestamp if the timer is currently stopped.

#### B. Remaining Time
The display is generated by subtracting the elapsed time from the planned time:
$$Remaining = \max(0, plannedMs - Elapsed)$$

### 3. Handling Pauses and Resumes
Pausing is handled by freezing the calculation. When you hit **Pause**, the code records the current timestamp in `pausedAt`. 

When you hit **Resume**, the app calculates the duration of that specific pause:
$$\Delta_{pause} = Date.now() - pausedAt$$
This $\Delta_{pause}$ is added to `totalPausedMs`, and `pausedAt` is reset to `null`. This ensures the "Elapsed Time" calculation remains accurate by "skipping over" the time spent paused.

### 4. UI Ticking vs. Authoritative Logic
There is a clear separation between the **UI update** and the **Logic**:
* **The Logic:** Functions like `getRemainingMs()` calculate the "true" time based on the system clock.
* **The UI:** `startUiTicking()` runs a `setInterval` every 1000ms. Its only job is to update `nowTs`.
* **Reactivity:** The computed property `formattedTime` depends on `nowTs`. Every time the interval updates `nowTs`, Vue re-runs the math, causing the timer display to change on your screen.

### 5. Session Completion & Backend Sync
When `getRemainingMs()` returns $0$, the `tick()` function triggers `finishTimoriaOnce()`.
1.  **State Protection:** It immediately sets `timerState.finished = true` to prevent the completion logic from running multiple times.
2.  **Backend Update:** If the session is a "timoria", it sends a `PUT` request to your API. It converts the actual `elapsedMs` back into minutes to ensure the user gets credit for the exact time worked, even if they extended the timer or finished early.
3.  **Feedback:** It triggers the "Ding" sound, sends a browser notification, and removes the session from `localStorage`.

### 6. The "Break" State
The app distinguishes between a `timoria` and a `break` via the `timerType`. 
* **Timorias** are linked to the database via an `id`.
* **Breaks** are local-only. When a break starts, the `localTimoria` object is overwritten with dummy "Break" text, and the `id` is set to the string `'break'`. This prevents the `mounted()` hook from trying to fetch a non-existent ID from your backend on a refresh.

### Summary of Timer State
| Feature | Implementation |
| :--- | :--- |
| **Refreshes** | Handled by `localStorage` and `startedAt` timestamp. |
| **Accuracy** | Guaranteed by `Date.now()` (system clock). |
| **Pausing** | Subtractive logic using `totalPausedMs`. |
| **Persistence** | Every state change triggers `setItem('activeTimoria', ...)`. |


## 6. Future Technical Roadmap

- **Wake Lock API Implementation:** To prevent mobile devices from entering sleep mode during an active "Ongoing" Timoria, preserving the countdown integrity.
    
- **Haptic Feedback Engine:** Utilizing the Web Vibrations API to provide tactile "pulses" upon timer completion for mobile users.
    
- **Native Notification API:** Implementing service-worker-based notifications to alert users when a planned session is about to begin or when a timer has expired.
    
- **Advanced Analytics Pipelines:** Transitioning from frontend-side filtering to MongoDB Aggregation Pipelines to generate long-term productivity trends without taxing client-side memory.