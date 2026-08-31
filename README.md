# AttendAI

AttendAI is a polished, static Vite + React demo for AI-powered student attendance intelligence. It includes separate student and teacher workspaces, deterministic Indian university-style demo data, local attendance editing, transparent scoring, anomaly flags, AI chat, recovery math, responsive layouts, and CSV exports.

## Run locally

```bash
npm install
npm run dev
```

Build the deployable static site with:

```bash
npm run build
```

The output is written to `dist/`. Upload the contents of `dist/` to cPanel `public_html` or any static hosting provider. Vite is configured with `base: './'` so relative assets work from a subdirectory.

## Demo access

- Student: `student001@demo.attendai` / `password`
- Teacher: `teacher001@demo.attendai` / `password`

The login is intentionally demo authentication only. The active session and local attendance edits are stored under versioned `localStorage` keys beginning with `attendai:v1`.

## Architecture

The frontend is organized into `client/src/data`, `client/src/services`, `client/src/context`, and the main `client/src/App.jsx`. Attendance calculations live in `analyticsService.js`; demo AI behavior lives in `aiService.js`; local persistence and CSV generation live in `appServices.js`. The service functions are shaped so a future backend can replace the demo implementations through `VITE_API_BASE_URL` without exposing secrets in frontend code.

## Environment

Use `.env.development.example` or `.env.production.example` as a reference for local configuration. Only public `VITE_*` configuration belongs in the frontend. Never add API keys, database passwords, JWT secrets, or other private credentials to Vite environment variables because they are visible in the built website.

## Included routes

Student routes include dashboard, attendance history, subjects, analytics, peer score, AI assistant, and profile. Teacher routes include dashboard, classes, attendance register, student directory, analytics, AI insights, anomaly review, reports, and profile. Role mismatches safely fall back to the correct workspace.

## Notes

AI insights are estimates grounded in deterministic demo records. Anomaly cards explicitly use review language and do not claim misconduct. Google sign-in is a UI placeholder in demo mode and does not perform OAuth.
