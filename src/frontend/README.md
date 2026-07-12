<div align="center">
  <h1> Techtonic</h1>
  <p>A comprehensive, full-stack productivity and personal finance tracker.</p>

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D" alt="Vue.js" />
    <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  </p>
</div>

##  Overview

**Techtonic** is a powerful MEVN-stack web application designed to help users master their time management and take control of their personal finances. From executing Pomodoro-style work sessions and setting weekly goals, to tracking budget flows and gamifying productivity with leaderboards, Techtonic serves as a centralized hub for personal growth.

##  Core Features

###  Time Tracking ("Timoria")
- **Session Execution:** Plan, execute, and log "Timoria" (work/study sessions) with a robust, anti-drift countdown timer.
- **Deep Categorization:** Track sessions by `Subject`, `Topic`, and `Tag`.
- **Intelligent Timer:** Built with a resilient architecture utilizing `localStorage` and timestamp math to survive page refreshes and browser throttling.

###  Goal Management
- **Weekly Targets:** Set time-based weekly goals to maintain focus on specific subjects or topics.
- **Automated Recurrence:** Flag goals as recurring to have them seamlessly carry over to subsequent weeks via scheduled cron jobs.

###  Analytics & Automated Reports
- **Deep Insights:** Visualize productivity trends using comprehensive breakdowns and heatmaps.
- **Weekly PDF Briefings:** Every Sunday, the system automatically aggregates activity and generates a formatted PDF report. 
- **Cloud Storage:** Reports are securely stored in Cloudflare R2 buckets, accessible via time-limited presigned URLs.

###  Gamification
- **Leaderboards:** Compare your productivity metrics (total hours, daily streaks, completed sessions) against other users to stay motivated.

###  Budget Control
- **Finance Tracking:** Monitor income and expenses with customizable categories.
- **Recurring Transactions:** Automate your budget flows for effortless financial overview.

##  Technology Stack

| Domain | Technologies |
| --- | --- |
| **Frontend** | Vue 3, Pinia (State), Vue Router, Chart.js / vue-chartjs, Luxon |
| **Backend** | Node.js, Express.js, JWT Auth, pdfkit, node-cron |
| **Database** | MongoDB, Mongoose |
| **Cloud/Infra**| Cloudflare R2 (S3 API), AWS SDK |

##  Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [MongoDB](https://www.mongodb.com/) (Local instance or Atlas cluster)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/techtonic.git
   cd techtonic
   ```

2. **Backend Setup:**
   ```bash
   cd src/backend
   npm install
   # Configure your .env variables (MongoDB URI, JWT Secret, Cloudflare R2 credentials)
   npm start
   ```

3. **Frontend Setup:**
   ```bash
   cd src/frontend
   npm install
   npm run serve
   ```

4. **Access the application:**
   Open your browser and navigate to `http://localhost:8080` (or your configured frontend port).

##  Architectural Highlights

### Resilient Timer Mechanics
The core timer (`Timer.vue`) abandons simple `setInterval` countdowns which are prone to drift. Instead, it relies on a single source of truth based on system timestamps (`startedAt`, `pausedAt`, `totalPausedMs`) synced with `localStorage`. This guarantees absolute chronological accuracy regardless of tab suspensions or accidental reloads.

### Secure Asynchronous Reporting
Weekly reporting is handled by a backend `node-cron` job that safely generates and uploads PDF summaries to Cloudflare R2. To maintain privacy, users access these files via dynamically generated, expiring presigned URLs.

##  Future Roadmap
- **Wake Lock API Implementation** to prevent mobile devices from sleeping during active sessions.
- **Service Worker Notifications** for robust, system-level alerts.
- **Advanced MongoDB Aggregation** to optimize long-term productivity trend generation.

---
<div align="center">
  <i>Built to structure productivity and finances.</i>
</div>
