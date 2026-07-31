# SEAL Hackathon Management System - Frontend

Welcome to the frontend application for the **SEAL Hackathon Management System** (`shm-frontend`). This web application powers the entire hackathon experience for students, team leaders, mentors, judges, coordinators, and system administrators.

---

## 🚀 Features

- **Public Landing & Events Page**: Browse upcoming, ongoing, and past hackathons, explore tracks, schedules, and prize details.
- **Participant & Team Management**:
  - Form teams (Public or Private with PIN protection).
  - Invite members, request to join open teams, and manage squad roles (Leader vs Member).
  - Track team submission statuses across multiple competition rounds.
- **Project Submissions**:
  - Upload project repository/Drive documentation links.
  - Track round-by-round deadlines and matrix requirements.
- **Leaderboard & Results**:
  - Real-time scoring updates and overall standings.
  - Transparent audit trail for grade modifications.
- **Role-Based Dashboards**:
  - Dedicated portals for Students, Mentors, Judges, Staff, Coordinators, and System Admins.
- **Notification System**:
  - Real-time in-app alerts and web socket updates for team requests and grading announcements.

---

## 🛠️ Technology Stack

- **Framework**: React 18 (Vite)
- **Routing**: React Router DOM v6
- **Styling**: TailwindCSS & Vanilla CSS
- **HTTP Client**: Axios with interceptors
- **Icons & Graphics**: Lucide React / SVG Assets

---

## 📦 Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd shm-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in a `.env` file at the root:
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api/v1
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

---

## 📁 Directory Structure

```
shm-frontend/
├── public/              # Static assets
├── src/
│   ├── api/             # Axios client configuration & API helper functions
│   ├── assets/          # Images, logos, and illustrations
│   ├── components/      # Reusable UI components (Header, Footer, Toast, Modal, etc.)
│   ├── context/         # React Context providers (Auth, Notifications)
│   ├── pages/           # Application routes (Homepage, Events, MyTeam, Dashboard, etc.)
│   ├── utils/           # Helper functions & data formatters
│   ├── App.jsx          # Main App entry with route definitions
│   └── main.jsx         # Application entry point
├── package.json
└── vite.config.js
```

---

## 🛡️ License

Confidential - FPT University SEAL Hackathon Platform. All Rights Reserved.
