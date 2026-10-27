# 🎓 Learneo — Frontend Web Application

> Modern, responsive React Single-Page Application for **Learneo** — an AI-Enabled Adaptive Learning Platform designed for students and educators.

[![React](https://img.shields.io/badge/React-18.2-61dafb.svg)](https://react.dev/)
[![React Router](https://img.shields.io/badge/React_Router-6.21-ca4245.svg)](https://reactrouter.com/)
[![Recharts](https://img.shields.io/badge/Recharts-2.10-22c55e.svg)](https://recharts.org/)
[![Vercel Ready](https://img.shields.io/badge/Deployment-Vercel%20SPA-black.svg)](https://vercel.com/)

---

## 🌟 Key Features

### 👨‍🎓 For Students
- **Personalized Adaptive Learning**: Progressive curriculum laddering steps through fundamentals sequentially before moving forward.
- **Interactive Concept Animator**: Step-through interactive animations demonstrating code loops, branching decisions, and state machines.
- **Interactive Code Editor**: Live syntax highlighting, scratchpad execution, and self-testing.
- **Gamification & Engagement**: Real-time XP, level progression, daily streaks, and celebration modal upon mastery.
- **Live Classroom Participation**: Join teacher sessions instantly via 6-character room codes or QR code scan.

### 👩‍🏫 For Teachers & Faculty
- **Syllabus & Content Ingestion**: AI parses documents and generates structured learning modules and micro-concepts.
- **Topic & Quiz Builder**: Manage multi-format assessments (MCQs, Short Answer, Code Completion, Debugging, Code Tracing, Scenario-Based).
- **Classroom Sessions**: Host live rooms, monitor real-time attendance rosters, and export rosters directly to Excel/CSV.
- **Diagnostic Analytics**:
  - Score distribution charts (0-40%, 41-60%, 61-80%, 81-100%).
  - Cohort-wide weak topic frequency ranking.
  - Student status categorizer (`Needs Intervention`, `Developing`, `Mastered`).
  - Student profile modal showing historical attempts and specific struggle areas.

---

## 📁 Project Structure

```
frontend/
├── public/
│   ├── favicon.svg           # High-resolution vector favicon
│   ├── index.html            # HTML5 template with Google Fonts
│   └── manifest.json         # PWA web app manifest
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── CelebrationModal.js
│   │   ├── CodeSnippetEditor.js
│   │   ├── GamificationBar.js
│   │   ├── InteractiveConceptAnimator.js
│   │   └── Layout.js
│   ├── context/
│   │   └── AuthContext.js    # Global authentication & user state
│   ├── pages/
│   │   ├── admin/            # Admin dashboard & user management
│   │   ├── faculty/          # Teacher tools, content upload, room manager, analytics
│   │   └── student/          # Student dashboard, module reader, adaptive practice
│   ├── services/
│   │   ├── api.js            # Axios client with JWT interceptor & baseURL
│   │   └── adaptiveService.js# Typed adaptive learning endpoints
│   ├── App.js                # Route definitions & protected routes
│   ├── index.css             # MD3 design system tokens & responsive classes
│   └── index.js              # React DOM entry point
└── vercel.json               # SPA client-side routing rewrites for Vercel
```

---

## ⚙️ Environment Variables

Create a `.env` file in the `frontend/` directory (see `.env.example`):

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `REACT_APP_API_URL` | Full URL to the backend API | Local: `http://localhost:5000/api`<br>Production: `https://your-backend.vercel.app/api` |

> In local development with `REACT_APP_API_URL` unset, calls to `/api/*` automatically proxy to `http://localhost:5000` via package.json.

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm start
# (Runs on http://localhost:3000)

# 3. Create optimized production build
npm run build
```

---

## 🚀 Deployment to Vercel

1. Push your frontend code to GitHub.
2. Go to your [Vercel Dashboard](https://vercel.com) and click **"Add New Project"**.
3. Select your `major-project-frontend` repository.
4. Framework Preset: **Create React App** (automatically detected).
5. In **Environment Variables**, add:
   - `REACT_APP_API_URL`: The deployed URL of your backend (e.g. `https://major-project-backend.vercel.app/api`).
6. Click **Deploy**. Vercel will build and deploy the React app with full client-side routing support.
