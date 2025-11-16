// js/app-auth.js
if (typeof firebase === 'undefined') console.error('Firebase missing. Include firebase scripts.');
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Auth helpers
async function login(email,password){ return auth.signInWithEmailAndPassword(email,password); }
async function logout(){ return auth.signOut(); }
async function registerStudent(email, pw, profile){
  const cred = await auth.createUserWithEmailAndPassword(email, pw);
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
async function isCurrentUserAdmin(){
  const u = auth.currentUser;
  if(!u) return false;
  const doc = await db.collection('admins').doc(u.uid).get();
  return doc.exists;
}
async function getCurrentProfile(){
  const u = auth.currentUser;
  if(!u) return null;
  const doc = await db.collection('students').doc(u.uid).get();
  return doc.exists ? {id: doc.id, ...doc.data()} : null;
}
