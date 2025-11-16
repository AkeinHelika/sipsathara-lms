// js/app-auth.js

// Ensure firebase-config.js is loaded before this
if (typeof firebase === 'undefined') {
  console.error('Firebase missing. Include firebase scripts.');
}

// Initialize Firebase app only once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Firestore & Auth instances
const db = firebase.firestore();
const auth = firebase.auth();

/**
 * Login user with email & password
 * @param {string} email 
 * @param {string} password 
 */
async function login(email, password) {
  if (!auth) throw new Error('Firebase Auth not initialized');
  return auth.signInWithEmailAndPassword(email, password);
}

/**
 * Logout current user
 */
async function logout() {
  if (!auth) throw new Error('Firebase Auth not initialized');
  return auth.signOut();
}

/**
 * Register student and create Firestore profile
 * @param {string} email 
 * @param {string} password 
 * @param {object} profile 
 */
async function registerStudent(email, password, profile) {
  if (!auth || !db) throw new Error('Firebase not initialized');

  const cred = await auth.createUserWithEmailAndPassword(email, password);
  const uid = cred.user.uid;

  await db.collection('students').doc(uid).set({
    email,
    name: profile.name || '',
    grade: profile.grade || '',
    phone: profile.phone || '',
    whatsapp: profile.whatsapp || '',
    school: profile.school || '',
    address: profile.address || '',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  return cred;
}

/**
 * Check if current user is admin
 */
async function isCurrentUserAdmin() {
  const u = auth.currentUser;
  if (!u) return false;
  const doc = await db.collection('admins').doc(u.uid).get();
  return doc.exists;
}

/**
 * Get current student's Firestore profile
 */
async function getCurrentProfile() {
  const u = auth.currentUser;
  if (!u) return null;
  const doc = await db.collection('students').doc(u.uid).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}
