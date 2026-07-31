# Frontend Architecture Specification

This document provides an overview of the system architecture, state flow, and structural organization of the **SEAL Hackathon Management System Frontend** (`shm-frontend`).

---

## 🏛️ Architecture Overview

The frontend is constructed as a Single Page Application (SPA) using **React 18** and **Vite**. The architecture follows a modular, feature-oriented structure with clear separation between page controllers, shared components, network integration, and application state.

```
+-------------------------------------------------------+
|                      React Router                     |
+--------------------------+----------------------------+
                           |
            +--------------+--------------+
            |                             |
  +---------v---------+         +---------v---------+
  |   Public Pages    |         | Protected Pages   |
  | (Home, Events...) |         | (MyTeam, Dashboard|
  +---------+---------+         +---------+---------+
            |                             |
            +--------------+--------------+
                           |
                  +--------v--------+
                  |  Shared Components|
                  | (Header, Toast..|
                  +--------+--------+
                           |
                  +--------v--------+
                  |   Axios Client  |
                  +--------+--------+
                           |
                  +--------v--------+
                  | REST / WS API   |
                  +-----------------+
```

---

## 🔑 Core Modules

### 1. Routing (`src/App.jsx`)
- Uses `react-router-dom` v6 for client-side routing.
- Implements role-based access checks for protected dashboard views (Student vs Manager/Staff/Coordinator/Admin).

### 2. Networking (`src/api/axiosClient.js`)
- Centralized `axios` instance configured with base URLs and request/response interceptors.
- Automatically attaches JWT Bearer tokens from `localStorage`.
- Intercepts 401 Unauthorized errors for automatic session cleanup and login redirection.

### 3. Reusable Components (`src/components/`)
- `Header.jsx`: Site-wide header featuring brand mark, primary navigation (`Events`, `Leaderboard`, `About Us`, `My Event`), user dropdown, and mobile navigation overlay.
- `NotificationBell.jsx`: Real-time notification trigger showing unread counts and interactive dropdown.
- `Toast.jsx`: Standardized notification alert banner for success and error messages.
- `PasswordInput.jsx`: Encapsulated password input component with built-in visibility toggle icon.
- `PasswordStrengthBar.jsx`: Dynamic visual security evaluator calculating real-time password complexity.

### 4. Application Pages (`src/pages/`)
- **Public**: `Homepage.jsx`, `Events.jsx`, `EventDetail.jsx`, `Leaderboard.jsx`, `About.jsx`.
- **Participant**: `MyTeam.jsx`, `TeamExplorer.jsx`, `Submission.jsx`, `TeamChat.jsx`.
- **Management**: `Dashboard.jsx`, `EventManagement.jsx`, `Grading.jsx`, `UserManagement.jsx`, `AuditLogs.jsx`.

---

## 🎨 Design Tokens & Utilities

- Modern pastel dark/light contrast theme.
- Responsive breakpoints tailored for mobile (`sm`), tablet (`md`), and desktop (`lg`/`xl`).
- Dynamic status helpers in `src/utils/hackathon.js` for phase determination (`registration`, `running`, `upcoming`, `ended`).
