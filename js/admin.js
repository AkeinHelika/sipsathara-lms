// js/admin.js

const adminCoursesList = document.getElementById('adminCoursesList');
const createCourseBtn = document.getElementById('createCourseBtn');

const courseNameInput = document.getElementById('courseName');
const courseDescInput = document.getElementById('courseDesc');
const courseDateInput = document.getElementById('courseDate');
const courseTimeInput = document.getElementById('courseTime');
const courseFeeInput = document.getElementById('courseFee');
const courseTeacherInput = document.getElementById('courseTeacher');

const newAdminEmail = document.getElementById('newAdminEmail');
const newAdminUid = document.getElementById('newAdminUid');
const addAdminBtn = document.getElementById('addAdminBtn');

const courseModal = document.getElementById('courseModal');
const closeCourseModal = document.getElementById('closeCourseModal');
const courseModalTitle = document.getElementById('courseModalTitle');
const monthsAdminList = document.getElementById('monthsAdminList');
const addMonthBtn = document.getElementById('addMonthBtn');
const viewCourseRequests = document.getElementById('viewCourseRequests');

// Add Course
createCourseBtn.onclick = async () => {
  const name = courseNameInput.value.trim();
  if(!name) return alert('Course name is required.');
  const payload = {
    name,
    description: courseDescInput.value.trim(),
    courseDate: courseDateInput.value,
    courseTime: courseTimeInput.value,
    courseFee: courseFeeInput.value,
    teacher: courseTeacherInput.value.trim(),
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  try {
    await db.collection('courses').add(payload);
    alert('Course added.');
    courseNameInput.value=''; courseDescInput.value=''; courseDateInput.value=''; courseTimeInput.value='';
    courseFeeInput.value=''; courseTeacherInput.value='';
    loadAdminCourses();
  } catch(e){ alert('Error adding course: '+e.message); }
};

// Register Admin
addAdminBtn.onclick = async () => {
  const email = newAdminEmail.value.trim();
  const uid = newAdminUid.value.trim();
  if(!email || !uid) return alert('Provide email and UID after creating auth user in Firebase Console.');
  try {
    await db.collection('admins').doc(uid).set({email, createdAt: firebase.firestore.FieldValue.serverTimestamp()});
    alert('Admin registered.');
    newAdminEmail.value=''; newAdminUid.value='';
  } catch(e){ alert('Error registering admin: '+e.message); }
};

// Load admin courses list
async function loadAdminCourses() {
  adminCoursesList.innerHTML = '<div class="muted">Loading...</div>';
  try {
    const snap = await db.collection('courses').orderBy('createdAt','desc').get();
    adminCoursesList.innerHTML = '';
    snap.forEach(doc => {
      const d = doc.data();
      const card = document.createElement('div'); card.className='card';
      const h = document.createElement('h4'); h.textContent = d.name;
      const p = document.createElement('p'); p.textContent = d.description || '';
      const meta = document.createElement('div'); meta.className='muted';
      meta.textContent = `${d.teacher || ''} • ${d.courseDate || ''} • ${d.courseTime || ''}`;
      const actions = document.createElement('div'); actions.style.marginTop='8px';
      const openBtn = document.createElement('button'); openBtn.className='btn primary'; openBtn.textContent='Open';
      openBtn.onclick = () => openCourseModal(doc.id, d.name);
      const delBtn = document.createElement('button'); delBtn.className='btn ghost'; delBtn.textContent='Delete';
      delBtn.onclick = () => deleteCourse(doc.id);
      actions.appendChild(openBtn); actions.appendChild(delBtn);
      card.appendChild(h); card.appendChild(p); card.appendChild(meta); card.appendChild(actions);
      adminCoursesList.appendChild(card);
    });
  } catch(e){ adminCoursesList.innerHTML='<div class="muted">Error loading courses.</div>'; }
}
loadAdminCourses();

// Open course modal
async function openCourseModal(courseId, courseName) {
  courseModal.style.display='flex';
  courseModalTitle.textContent = courseName;
  monthsAdminList.innerHTML = '<div class="muted">Loading months...</div>';

  try {
    const monthsSnap = await db.collection('courses').doc(courseId).collection('months').orderBy('createdAt','asc').get();
    monthsAdminList.innerHTML='';
    monthsSnap.forEach(m => {
      const md = m.data();
      const card = document.createElement('div'); card.className='card';
      const title = document.createElement('strong'); title.textContent = md.monthName;
      const actions = document.createElement('div'); actions.style.marginTop='8px';

      const addDayBtn = document.createElement('button'); addDayBtn.className='btn primary'; addDayBtn.textContent='Add Day';
      addDayBtn.onclick = () => addDay(courseId, m.id);

      const viewReqBtn = document.createElement('button'); viewReqBtn.className='btn ghost'; viewReqBtn.textContent='Requests';
      viewReqBtn.onclick = () => viewMonthRequests(courseId, m.id);

      const delMonthBtn = document.createElement('button'); delMonthBtn.className='btn ghost'; delMonthBtn.textContent='Delete';
      delMonthBtn.onclick = () => deleteMonth(courseId, m.id);

      actions.appendChild(addDayBtn); actions.appendChild(viewReqBtn); actions.appendChild(delMonthBtn);
      card.appendChild(title); card.appendChild(actions); monthsAdminList.appendChild(card);
    });
  } catch(e){ monthsAdminList.innerHTML='<div class="muted">Error loading months.</div>'; }

  // Add month
  addMonthBtn.onclick = async () => {
    const monthName = prompt('Enter month name (e.g., JANUARY)');
    if(!monthName) return;
    try {
      await db.collection('courses').doc(courseId).collection('months').add({
        monthName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      openCourseModal(courseId, courseName);
    } catch(e){ alert('Error adding month: '+e.message); }
  };

  // View course requests
  viewCourseRequests.onclick = async () => {
    try {
      const reqsSnap = await db.collection('courses').doc(courseId).collection('permissions').get();
      if(reqsSnap.empty) return alert('No course requests.');
      for(const r of reqsSnap.docs){
        const grant = confirm(`Grant course access to ${r.id}? (OK to grant)`);
        if(grant){
          await db.collection('courses').doc(courseId).collection('permissions').doc(r.id).set({
            granted:true,
            grantedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, {merge:true});
        }
      }
      alert('Processed requests.');
    } catch(e){ alert('Error processing requests: '+e.message); }
  };
}

// Close modal
closeCourseModal.onclick = () => courseModal.style.display='none';

// Delete course
async function deleteCourse(id){
  if(!confirm('Delete course?')) return;
  try {
    await db.collection('courses').doc(id).delete();
    alert('Deleted.');
    loadAdminCourses();
  } catch(e){ alert('Error deleting course: '+e.message); }
}

// Delete month
async function deleteMonth(courseId, monthId){
  if(!confirm('Delete month?')) return;
  try {
    await db.collection('courses').doc(courseId).collection('months').doc(monthId).delete();
    alert('Deleted month.');
    loadAdminCourses();
  } catch(e){ alert('Error deleting month: '+e.message); }
}

// Add day to month
async function addDay(courseId, monthId){
  const dayLabel = prompt('Day label (e.g., Day_01)');
  if(!dayLabel) return;
  const live = prompt('Live (Zoom) URL (leave blank if none)');
  const rec = prompt('Recording URL (leave blank)');
  const assignment = prompt('Assignment URL (leave blank)');
  const mcq = prompt('MCQ URL (leave blank)');
  try {
    await db.collection('courses').doc(courseId).collection('months').doc(monthId).collection('days').add({
      dayLabel,
      liveUrl: live || '',
      recordingUrl: rec || '',
      assignmentUrl: assignment || '',
      mcqUrl: mcq || '',
      dayIndex: Date.now(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert('Day added.');
    openCourseModal(courseId, courseNameInput.value);
  } catch(e){ alert('Error adding day: '+e.message); }
}

// View month requests
async function viewMonthRequests(courseId, monthId){
  try {
    const snap = await db.collection('courses').doc(courseId).collection('months').doc(monthId).collection('permissions').get();
    if(snap.empty) return alert('No month requests.');
    for(const r of snap.docs){
      const grant = confirm(`Grant month access to ${r.id}? (OK to grant)`);
      if(grant){
        await db.collection('courses').doc(courseId).collection('months').doc(monthId).collection('permissions').doc(r.id).set({
          granted:true,
          grantedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, {merge:true});
      }
    }
    alert('Processed month requests.');
  } catch(e){ alert('Error processing requests: '+e.message); }
}

// Admin logout
document.getElementById('adminLogout').onclick = async () => {
  await logout();
  location.href = '/';
};
