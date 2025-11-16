# Sipsathara LMS (Client-only, no Cloud Functions)

This is the full LMS frontend built with HTML, CSS and JavaScript. It uses Firebase Authentication and Firestore **on the client** (no Cloud Functions required).

## Important
- No Firebase Cloud Functions are used (so no billing required).
- Admin creation is a manual two-step process (create auth user in Firebase Console, then add their UID to `admins` collection in Firestore). This is intentional to avoid needing server-side privileges.

## Setup
1. Create a Firebase project (Spark free tier).
2. Add a Web app and copy the config -> paste into `js/firebase-config.js`.
3. Enable Authentication (Email/Password).
4. Create Firestore (Native mode).
5. Create admin user in Firebase Auth:
   - Email: `akein.admin@slp.lms`
   - Password: `adminslp1`
   - Note the UID and create document `admins/{UID}` with `{ email: "akein.admin@slp.lms", createdAt: serverTimestamp() }`.
6. (Optional) Paste rules from `firebase-firestore-rules.txt` in Firestore Rules.

## Deploy
- Push repo to GitHub and deploy to Vercel (static site).
- No server-side code or functions needed.

## Features
- Student register/login, edit profile
- Admin add/edit/delete courses, add months and days
- Students can request course/month access; admin grants access
- Live class links, recordings, assignments, MCQs via URL fields
