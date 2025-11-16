// js/firebase-config.js
// IMPORTANT: Replace these with your Firebase project's config values.
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-BcXSAcwC4ur0_qYexvWihN778WqELic",
  authDomain: "sipsathara-lms.firebaseapp.com",
  projectId: "sipsathara-lms",
  storageBucket: "sipsathara-lms.firebasestorage.app",
  messagingSenderId: "838713249800",
  appId: "1:838713249800:web:99a8eaa0e477801303c1bd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
