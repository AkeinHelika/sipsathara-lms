// js/student.js

const coursesGrid = document.getElementById('coursesGrid');
const monthsGrid = document.getElementById('monthsGrid');
const daysGrid = document.getElementById('daysGrid');

const pageCourses = document.getElementById('pageCourses');
const pageMonths = document.getElementById('pageMonths');
const pageMonthContent = document.getElementById('pageMonthContent');

const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const studentGreeting = document.getElementById('studentGreeting');

let currentCourseId = null;
let currentCourseName = '';
let currentMonthId = null;
let currentMonthName = '';

// Auth state observer
firebase.auth().onAuthStateChanged(async user => {
  if (!user) {
    studentGreeting.textContent = 'Student Dashboard';
    showPage('courses');
    loadPublicCourses();
    return;
  }
  const profile = await getCurrentProfile();
  studentGreeting.textContent = profile?.name ? `Hi, ${profile.name}` : 'Student Dashboard';
  loadStudentCourses();
});

// Load all courses
async function loadPublicCourses() {
  coursesGrid.innerHTML = '<div class="muted">Loading courses...</div>';
  const snap = await db.collection('courses').orderBy('createdAt', 'desc').get();
  renderCourses(snap);
}

async function loadStudentCourses() {
  coursesGrid.innerHTML = '<div class="muted">Loading courses...</div>';
  const snap = await db.collection('courses').orderBy('createdAt', 'desc').get();
  renderCourses(snap);
}

// Render courses grid
function renderCourses(snap) {
  coursesGrid.innerHTML = '';
  snap.forEach(doc => {
    const d = doc.data();
    const card = document.createElement('div'); card.className = 'card';
    const title = document.createElement('h3'); title.textContent = d.name;
    const desc = document.createElement('p'); desc.textContent = d.description || '';
    const meta = document.createElement('div'); meta.className = 'muted';
    meta.textContent = `${d.teacher || ''} • ${d.courseDate || ''} • ${d.courseTime || ''} • Fee: ${d.courseFee || ''}`;

    const actions = document.createElement('div'); actions.style.marginTop = '8px';
    const uid = firebase.auth().currentUser?.uid || null;

    if (uid) {
      db.collection('courses').doc(doc.id).collection('permissions').doc(uid).get().then(pDoc => {
        if (pDoc.exists && pDoc.data().granted) {
          const active = document.createElement('span'); active.textContent = 'Activated ✓'; active.className = 'muted';
          const viewBtn = document.createElement('button'); viewBtn.className = 'btn primary'; viewBtn.textContent = 'View Class';
          viewBtn.onclick = () => openMonths(doc.id, d.name);
          actions.appendChild(active); actions.appendChild(viewBtn);
        } else {
          const reqBtn = document.createElement('button'); reqBtn.className = 'btn ghost'; reqBtn.textContent = 'Request Permission';
          reqBtn.onclick = async () => {
            await db.collection('courses').doc(doc.id).collection('permissions').doc(uid).set({
              requestedAt: firebase.firestore.FieldValue.serverTimestamp(),
              granted: false,
              studentId: uid
            });
            alert('Requested. Admin will review.');
            loadStudentCourses();
          };
          actions.appendChild(reqBtn);
        }
      });
    } else {
      const loginReq = document.createElement('span'); loginReq.className = 'muted'; loginReq.textContent = 'Login to request access';
      actions.appendChild(loginReq);
    }

    card.appendChild(title); card.appendChild(desc); card.appendChild(meta); card.appendChild(actions);
    coursesGrid.appendChild(card);
  });
}

// Open months for course
async function openMonths(courseId, courseName) {
  currentCourseId = courseId; currentCourseName = courseName;
  document.getElementById('courseHeader').textContent = courseName;
  showPage('months');
  monthsGrid.innerHTML = '<div class="muted">Loading months...</div>';
  const snap = await db.collection('courses').doc(courseId).collection('months').orderBy('createdAt','asc').get();
  monthsGrid.innerHTML = '';

  const uid = firebase.auth().currentUser?.uid || null;
  snap.forEach(doc => {
    const md = doc.data();
    const card = document.createElement('div'); card.className = 'card';
    const title = document.createElement('h4'); title.textContent = md.monthName;
    const actions = document.createElement('div'); actions.style.marginTop = '8px';

    if(uid){
      db.collection('courses').doc(courseId).collection('months').doc(doc.id).collection('permissions').doc(uid).get().then(mperm => {
        if(mperm.exists && mperm.data().granted){
          const active = document.createElement('span'); active.textContent='Activated ✓'; active.className='muted';
          const viewBtn = document.createElement('button'); viewBtn.className='btn primary'; viewBtn.textContent='View';
          viewBtn.onclick = () => openMonthContent(courseId, doc.id, md.monthName);
          actions.appendChild(active); actions.appendChild(viewBtn);
        } else {
          const reqBtn = document.createElement('button'); reqBtn.className='btn ghost'; reqBtn.textContent='Request Month';
          reqBtn.onclick = async () => {
            await db.collection('courses').doc(courseId).collection('months').doc(doc.id).collection('permissions').doc(uid).set({
              requestedAt: firebase.firestore.FieldValue.serverTimestamp(),
              granted: false,
              studentId: uid
            });
            alert('Month access requested.');
            openMonths(courseId, courseName);
          };
          actions.appendChild(reqBtn);
        }
      });
    } else {
      const info = document.createElement('span'); info.className='muted'; info.textContent='Login required';
      actions.appendChild(info);
    }

    card.appendChild(title); card.appendChild(actions); monthsGrid.appendChild(card);
  });
}

// Open month content
async function openMonthContent(courseId, monthId, monthName) {
  currentMonthId = monthId; currentMonthName = monthName;
  document.getElementById('monthHeader').textContent = `${currentCourseName} · ${monthName}`;
  showPage('monthContent');
  daysGrid.innerHTML = '<div class="muted">Loading content...</div>';

  const snap = await db.collection('courses').doc(courseId).collection('months').doc(monthId).collection('days').orderBy('dayIndex','asc').get();
  daysGrid.innerHTML = '';
  const uid = firebase.auth().currentUser?.uid || null;

  const permDoc = uid ? await db.collection('courses').doc(courseId).collection('months').doc(monthId).collection('permissions').doc(uid).get() : null;
  const hasAccess = permDoc?.exists && permDoc.data().granted;

  snap.forEach(doc => {
    const d = doc.data();
    const card = document.createElement('div'); card.className='card';
    const title = document.createElement('h4'); title.textContent = d.dayLabel || 'Day';
    const items = document.createElement('div'); items.style.marginTop='8px';

    if(d.liveUrl){
      const liveBtn = document.createElement('button'); liveBtn.className='btn primary'; liveBtn.textContent='Live Class';
      liveBtn.onclick = () => {
        if(!hasAccess) return alert('Month not activated for you.');
        window.open(d.liveUrl, '_blank');
      };
      items.appendChild(liveBtn);
    }
    if(d.recordingUrl){ const a = document.createElement('a'); a.href=d.recordingUrl; a.target='_blank'; a.textContent='Recording'; a.style.display='block'; items.appendChild(a); }
    if(d.assignmentUrl){ const a = document.createElement('a'); a.href=d.assignmentUrl; a.target='_blank'; a.textContent='Assignment'; a.style.display='block'; items.appendChild(a); }
    if(d.mcqUrl){ const a = document.createElement('a'); a.href=d.mcqUrl; a.target='_blank'; a.textContent='MCQ'; a.style.display='block'; items.appendChild(a); }

    if(!hasAccess){
      const note = document.createElement('div'); note.className='muted'; note.textContent='Unlock month to access content';
      items.appendChild(note);
    }

    card.appendChild(title); card.appendChild(items); daysGrid.appendChild(card);
  });
}

// Show/hide pages
function showPage(name) {
  pageCourses.classList.toggle('hidden', name !== 'courses');
  pageMonths.classList.toggle('hidden', name !== 'months');
  pageMonthContent.classList.toggle('hidden', name !== 'monthContent');
}

// Navigation buttons
document.getElementById('backToCourses').onclick = () => showPage('courses');
document.getElementById('backToMonths').onclick = () => showPage('months');

// Login button
loginBtn.onclick = async () => {
  try {
    await login(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value);
    location.hash = '';
    location.reload();
  } catch(e){ alert('Login failed: '+e.message); }
};

// Register button
registerBtn.onclick = async () => {
  try {
    await registerStudent(document.getElementById('regEmail').value, document.getElementById('regPassword').value, {
      name: document.getElementById('regName').value,
      grade: document.getElementById('regGrade').value,
      phone: document.getElementById('regPhone').value,
      whatsapp: document.getElementById('regWhatsapp').value,
      school: document.getElementById('regSchool').value,
      address: document.getElementById('regAddress').value
    });
    alert('Account created. Please login.');
    location.hash = '#login';
    location.reload();
  } catch(e){ alert('Register failed: '+e.message); }
};

// Logout
logoutBtn.onclick = async () => { await logout(); location.href = '/'; };
