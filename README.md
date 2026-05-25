<div align="center">
  <h1> Techtonic - Timoria</h1>
  <p>A comprehensive, full-stack productivity and personal finance tracker.</p>

  <p>
    <strong>Live Deployment:</strong> <a href="https://www.techtonic.se">www.techtonic.se</a>
  </p>

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/Status-Deployed-success?style=for-the-badge" alt="Status: Deployed" />
    <img src="https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vue.js&logoColor=4FC08D" alt="Vue.js" />
    <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js" />
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/Pinia-F6D365?style=for-the-badge&logo=pinia&logoColor=black" alt="Pinia" />
    <img src="https://img.shields.io/badge/Cloudflare_R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare R2" />
    <img src="https://img.shields.io/badge/JWT_Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  </p>
</div>

##  Overview

**Techtonic** is a powerful MEVN-stack web application designed to help users master their time management and take control of their personal finances. From executing Pomodoro-style work sessions and setting weekly goals, to tracking budget flows and gamifying productivity with leaderboards, Techtonic serves as a centralized hub for personal growth.

*Note: This repository serves as a portfolio showcase. The application is actively maintained and deployed, but source code contributions are not open to the public.*

##  Core Features

###  Time Tracking ("Timoria")
- **Session Execution:** Plan, execute, and log "Timoria" (work/study sessions) with a robust, anti-drift countdown timer.
- **Deep Categorization:** Track sessions by `Subject`, `Topic`, and `Tag`.

###  Goal Management
- **Weekly Targets:** Set time-based weekly goals to maintain focus on specific subjects or topics.
- **Automated Recurrence:** Flag goals as recurring to have them seamlessly carry over to subsequent weeks via scheduled cron jobs.

###  Analytics & Automated Reports
- **Deep Insights:** Visualize productivity trends using comprehensive breakdowns and heatmaps (`vue-chartjs`, `chartjs-chart-matrix`).
- **Weekly PDF Briefings:** Every Sunday, the system automatically aggregates activity and generates a formatted PDF report via `pdfkit`.
- **Cloud Storage:** Reports are securely stored in Cloudflare R2 buckets, accessible via dynamically generated, time-limited presigned URLs.

###  Gamification
- **Leaderboards:** Compare your productivity metrics (total hours, daily streaks, completed sessions) against other users to stay motivated.

###  Budget Control
- **Finance Tracking:** Monitor income and expenses with customizable categories.
- **Recurring Transactions:** Automate your budget flows for effortless financial overview.

##  Architectural & Technical Highlights

As a solo developer, I built Techtonic to solve real-world problems while implementing robust, scalable architectural patterns:

### 1. Resilient Timer Mechanics (Frontend)
The core timer (`Timer.vue`) abandons simple `setInterval` countdowns, which are prone to drift and get throttled by modern browsers when tabs are backgrounded. 
- **Single Source of Truth:** Relies on system timestamps (`startedAt`, `pausedAt`, `totalPausedMs`).
- **State Persistence:** Aggressively syncs with `localStorage`. If a user accidentally closes or refreshes the page, the component perfectly reconstructs the timer state exactly where it left off.
- **Absolute Accuracy:** Guarantees absolute chronological accuracy regardless of tab suspensions or accidental reloads.

### 2. Secure Asynchronous Reporting (Backend & Cloud Infra)
Weekly reporting is handled by a backend `node-cron` job that safely generates and uploads PDF summaries.
- **Automated CRON Jobs:** Background workers automatically parse weekly user data and generate reports.
- **R2 Integration:** Utilizes the `@aws-sdk/client-s3` to securely interface with Cloudflare R2.
- **Security-First Access:** To maintain strict privacy, users access these files via dynamically generated presigned URLs that expire after 15 minutes, ensuring that storage buckets remain completely private.

### 3. Localization & Date Management
- **Timezone Awareness:** Uses `luxon` extensively across both frontend and backend to correctly calculate end-of-day streaks and cron-job triggers based on the user's specific local timezone.
- **i18n & RTL Support:** Implemented `vue-i18n` to accommodate multiple languages, including advanced backend text processing (`arabic-persian-reshaper`) to correctly render Arabic text within the generated PDF reports.

##  Technology Stack

| Domain | Technologies |
| --- | --- |
| **Frontend** | Vue 3, Pinia (State), Vue Router, Chart.js / vue-chartjs, Luxon, Vue-i18n |
| **Backend** | Node.js, Express.js, JWT Auth, pdfkit, node-cron, bcrypt |
| **Database** | MongoDB, Mongoose |
| **Cloud/Infra**| Cloudflare R2 (S3 API), AWS SDK |

##  Future Roadmap
- **Wake Lock API Implementation** to prevent mobile devices from sleeping during active sessions.
- **Service Worker Notifications** for robust, system-level push notifications.
- **Advanced MongoDB Aggregation Pipelines** to optimize long-term productivity trend generation without taxing client-side memory.

---
<div align="center">
  <i>Designed, developed, and maintained for structured productivity and finances.</i>
</div>
