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

createCourseBtn.onclick = async ()=>{
  const payload = {
    name: courseNameInput.value,
    description: courseDescInput.value,
    courseDate: courseDateInput.value,
    courseTime: courseTimeInput.value,
    courseFee: courseFeeInput.value,
    teacher: courseTeacherInput.value,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  await db.collection('courses').add(payload);
  alert('Course added.');
  loadAdminCourses();
  // clear
  courseNameInput.value=''; courseDescInput.value='';
};

addAdminBtn.onclick = async ()=>{
  const email = newAdminEmail.value.trim();
  const uid = newAdminUid.value.trim();
  if(!email || !uid) return alert('Provide email and UID after creating auth user in Firebase Console.');
  await db.collection('admins').doc(uid).set({email, createdAt: firebase.firestore.FieldValue.serverTimestamp()});
  alert('Admin registered.');
  newAdminEmail.value=''; newAdminUid.value='';
};

async function loadAdminCourses(){
  adminCoursesList.innerHTML = '<div class="muted">Loading...</div>';
  const snap = await db.collection('courses').orderBy('createdAt','desc').get();
  adminCoursesList.innerHTML = '';
  snap.forEach(doc=>{
    const d = doc.data();
    const card = document.createElement('div'); card.className='card';
    const h = document.createElement('h4'); h.textContent = d.name;
    const p = document.createElement('p'); p.textContent = d.description || '';
    const meta = document.createElement('div'); meta.className='muted'; meta.textContent = `${d.teacher || ''} • ${d.courseDate || ''} • ${d.courseTime || ''}`;
    const actions = document.createElement('div'); actions.style.marginTop='8px';
    const openBtn = document.createElement('button'); openBtn.className='btn primary'; openBtn.textContent='Open'; openBtn.onclick = ()=> openCourseModal(doc.id, d.name);
    const delBtn = document.createElement('button'); delBtn.className='btn ghost'; delBtn.textContent='Delete'; delBtn.onclick = ()=> deleteCourse(doc.id);
    actions.appendChild(openBtn); actions.appendChild(delBtn);
    card.appendChild(h); card.appendChild(p); card.appendChild(meta); card.appendChild(actions);
    adminCoursesList.appendChild(card);
  });
}
loadAdminCourses();

async function openCourseModal(courseId, courseName){
  courseModal.style.display = 'flex';
  courseModalTitle.textContent = courseName;
  monthsAdminList.innerHTML = '<div class="muted">Loading months...</div>';
  const monthsSnap = await db.collection('courses').doc(courseId).collection('months').orderBy('createdAt','asc').get();
  monthsAdminList.innerHTML = '';
  monthsSnap.forEach(m=>{
    const md = m.data();
    const card = document.createElement('div'); card.className='card';
    const title = document.createElement('strong'); title.textContent = md.monthName;
    const actions = document.createElement('div'); actions.style.marginTop='8px';
    const addDayBtn = document.createElement('button'); addDayBtn.className='btn primary'; addDayBtn.textContent='Add Day';
    addDayBtn.onclick = ()=> addDay(courseId, m.id);
    const viewReqBtn = document.createElement('button'); viewReqBtn.className='btn ghost'; viewReqBtn.textContent='Requests';
    viewReqBtn.onclick = ()=> viewMonthRequests(courseId, m.id);
    const delMonthBtn = document.createElement('button'); delMonthBtn.className='btn ghost'; delMonthBtn.textContent='Delete';
    delMonthBtn.onclick = ()=> deleteMonth(courseId, m.id);
    actions.appendChild(addDayBtn); actions.appendChild(viewReqBtn); actions.appendChild(delMonthBtn);
    card.appendChild(title); card.appendChild(actions); monthsAdminList.appendChild(card);
  });

  // Add month action
  addMonthBtn.onclick = async ()=> {
    const monthName = prompt('Enter month name (e.g., JANUARY)');
    if(!monthName) return;
    await db.collection('courses').doc(courseId).collection('months').add({
      monthName,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    openCourseModal(courseId, courseName);
  };

  viewCourseRequests.onclick = async ()=> {
    const reqs = await db.collection('courses').doc(courseId).collection('permissions').get();
    if(reqs.empty) return alert('No course requests.');
    const list = [];
    reqs.forEach(r=> list.push({id:r.id, data: r.data()}));
    for(const r of list){
      const grant = confirm(`Grant course access to ${r.id}? (OK to grant)`);
      if(grant){
        await db.collection('courses').doc(courseId).collection('permissions').doc(r.id).set({granted:true,grantedAt:firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
      }
    }
    alert('Processed requests.');
  };
}
closeCourseModal.onclick = ()=> courseModal.style.display = 'none';

async function deleteCourse(id){
  if(!confirm('Delete course?')) return;
  await db.collection('courses').doc(id).delete();
  alert('Deleted.');
  loadAdminCourses();
}
async function deleteMonth(courseId, monthId){
  if(!confirm('Delete month?')) return;
  await db.collection('courses').doc(courseId).collection('months').doc(monthId).delete();
  alert('Deleted month.');
  loadAdminCourses();
}
async function addDay(courseId, monthId){
  const dayLabel = prompt('Day label (e.g., day_01)');
  if(!dayLabel) return;
  const live = prompt('Live (Zoom) URL (leave blank if none)');
  const rec = prompt('Recording URL (leave blank)');
  const assignment = prompt('Assignment URL (leave blank)');
  const mcq = prompt('MCQ URL (leave blank)');
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
  loadAdminCourses();
}
async function viewMonthRequests(courseId, monthId){
  const snap = await db.collection('courses').doc(courseId).collection('months').doc(monthId).collection('permissions').get();
  if(snap.empty) return alert('No month requests.');
  for(const r of snap.docs){
    const grant = confirm(`Grant month access to ${r.id}? (OK to grant)`);
    if(grant){
      await db.collection('courses').doc(courseId).collection('months').doc(monthId).collection('permissions').doc(r.id).set({
        granted:true, grantedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, {merge:true});
    }
  }
  alert('Processed month requests.');
}

document.getElementById('adminLogout').onclick = async ()=> { await logout(); location.href = '/'; };
