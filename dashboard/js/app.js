/* ═══════════════════════════════════════════════════════
   DEFFENSO ADMIN DASHBOARD — Core JavaScript
   All data arrays are empty — ready for backend integration
═══════════════════════════════════════════════════════ */
'use strict';

/* ── Icon helper: returns Lucide icon SVG inline ── */
function icon(name, size) {
  size = size || 16;
  return `<i data-lucide="${name}" style="width:${size}px;height:${size}px"></i>`;
}
function refreshIcons() {
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/* ── Empty Data Store — no dummy data ── */
const STORE = {
  students: [],
  courses: [],
  batches: [],
  certifications: [],
  events: [],
  instructors: [],
  activity: [],
  gallery: [],
  notifications_log: []
};

/* ── State ── */
let currentModule = 'home';
let searchTimeout = null;
let currentStudentSort = { col: 'name', asc: true };

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initClock();
  initRouter();
  navigateTo('home');
});

/* ── Sidebar ── */
function initSidebar() {
  const hamburger = document.getElementById('topbar-hamburger');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (hamburger) hamburger.addEventListener('click', () => sidebar.classList.toggle('open'));
  if (overlay) overlay.addEventListener('click', () => sidebar.classList.remove('open'));
  document.querySelectorAll('.sidebar-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const mod = item.dataset.module;
      if (mod) { navigateTo(mod); sidebar.classList.remove('open'); }
    });
  });
}

/* ── Clock ── */
function initClock() {
  const el = document.getElementById('topbar-clock');
  if (!el) return;
  function tick() {
    const n = new Date();
    el.textContent = `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')} IST`;
  }
  tick(); setInterval(tick, 1000);
}

/* ── Router ── */
function initRouter() {
  window.addEventListener('hashchange', () => navigateTo(window.location.hash.slice(1) || 'home'));
}

function navigateTo(mod) {
  currentModule = mod;
  window.location.hash = mod;
  document.querySelectorAll('.sidebar-nav-item').forEach(i => i.classList.toggle('active', i.dataset.module === mod));
  const titles = { home:'Dashboard',students:'Students',courses:'Courses',instructors:'Instructors',batches:'Batches',certifications:'Certifications',events:'Events',gallery:'Gallery',notifications:'Notifications',analytics:'Analytics',settings:'Settings' };
  const t = document.getElementById('topbar-title');
  if (t) t.textContent = titles[mod] || 'Dashboard';
  const main = document.getElementById('main-content');
  if (!main) return;
  main.innerHTML = getSkeletonHTML();
  setTimeout(() => {
    const renderers = { home:renderHome, students:renderStudents, courses:renderCourses, instructors:renderInstructors, batches:renderBatches, certifications:renderCertifications, events:renderEvents, gallery:renderGallery, notifications:renderNotifications, analytics:renderAnalytics, settings:renderSettings };
    const fn = renderers[mod] || renderHome;
    main.innerHTML = fn();
    refreshIcons();
    if (mod === 'students') initStudentHandlers();
    if (mod === 'analytics') initCharts();
  }, 280);
}

function getSkeletonHTML() {
  return `<div class="kpi-grid" style="margin-bottom:28px">${'<div class="skeleton skeleton-card"></div>'.repeat(5)}</div><div class="skeleton skeleton-card" style="height:200px;margin-bottom:16px"></div><div class="skeleton skeleton-card" style="height:160px"></div>`;
}

/* ═══ EMPTY STATE HELPER ═══ */
function emptyState(iconName, title, text) {
  return `<div class="empty-state"><div class="empty-state-icon">${icon(iconName, 40)}</div><div class="empty-state-title">${title}</div><div class="empty-state-text">${text}</div></div>`;
}

/* ═══ HOME ═══ */
function renderHome() {
  const active = STORE.students.filter(s => s.status === 'active').length;
  const pending = STORE.students.filter(s => s.status === 'pending').length;
  const upBatches = STORE.batches.filter(b => b.status === 'upcoming' || b.status === 'active').length;
  const certs = STORE.certifications.length;
  const evts = STORE.events.filter(e => e.status === 'published').length;

  const activityHTML = STORE.activity.length
    ? STORE.activity.map(a => `<div class="activity-item"><span class="activity-dot"></span><div><div class="activity-text">${a.text}</div><div class="activity-time">${a.time}</div></div></div>`).join('')
    : emptyState('activity', 'No Recent Activity', 'Actions will appear here as you manage the academy');

  return `
    <div class="section-hdr"><span class="shdr-blink"></span><span class="shdr-id">SYS.OVERVIEW</span><span class="shdr-title">Academy Command Center</span></div>
    <div class="kpi-grid">
      <div class="kpi-tile" onclick="navigateTo('students')"><span class="kpi-icon">${icon('users',22)}</span><div class="kpi-label">Total Active Students</div><div class="kpi-value">${active}</div></div>
      <div class="kpi-tile" onclick="navigateTo('students')"><span class="kpi-icon">${icon('clipboard-list',22)}</span><div class="kpi-label">Pending Enrollments</div><div class="kpi-value">${pending}${pending > 0 ? ` <span class="kpi-badge">${pending} pending</span>` : ''}</div></div>
      <div class="kpi-tile" onclick="navigateTo('batches')"><span class="kpi-icon">${icon('calendar',22)}</span><div class="kpi-label">Active Batches</div><div class="kpi-value">${upBatches}</div></div>
      <div class="kpi-tile" onclick="navigateTo('certifications')"><span class="kpi-icon">${icon('award',22)}</span><div class="kpi-label">Certificates This Month</div><div class="kpi-value">${certs}</div></div>
      <div class="kpi-tile" onclick="navigateTo('events')"><span class="kpi-icon">${icon('bell',22)}</span><div class="kpi-label">Published Events</div><div class="kpi-value">${evts}</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div class="card"><div class="card-header"><span class="shdr-blink"></span><span class="card-title">Quick Actions</span></div>
        <div class="card-body"><div class="quick-actions" style="flex-direction:column">
          <button class="quick-action-btn" onclick="openModal('add-student-modal')">${icon('user-plus',14)} Add New Student</button>
          <button class="quick-action-btn" onclick="navigateTo('batches')">${icon('plus',14)} Create Batch</button>
          <button class="quick-action-btn" onclick="navigateTo('gallery')">${icon('upload',14)} Upload Gallery Image</button>
          <button class="quick-action-btn" onclick="navigateTo('notifications')">${icon('send',14)} Send Notification</button>
          <button class="quick-action-btn" onclick="navigateTo('events')">${icon('calendar-plus',14)} Create Event</button>
        </div></div>
      </div>
      <div class="card"><div class="card-header"><span class="shdr-blink"></span><span class="card-title">Recent Activity</span></div>
        <div class="card-body"><div class="activity-feed">${activityHTML}</div></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-top:24px">
      ${STORE.courses.length ? STORE.courses.map(c => `<div class="card"><div class="card-body" style="text-align:center"><div class="kpi-label">${c.name}</div><div style="font-family:var(--font-d);font-size:32px;color:var(--cream);margin:8px 0">${c.students||0}</div><span class="badge badge-active">${c.status}</span></div></div>`).join('') : ''}
    </div>`;
}

/* ═══ STUDENTS ═══ */
function renderStudents() {
  const pending = STORE.students.filter(s => s.status === 'pending').length;
  return `
    <div class="section-hdr"><span class="shdr-blink"></span><span class="shdr-id">MOD.01</span><span class="shdr-title">Student Management — Enrollment & Profiles</span></div>
    <div class="tabs">
      <button class="tab-btn active" data-tab="all-students">All Students</button>
      <button class="tab-btn" data-tab="pending-approvals">Pending Approvals${pending ? ` <span class="badge badge-pending" style="margin-left:6px">${pending}</span>` : ''}</button>
      <button class="tab-btn" data-tab="graduated">Graduated</button>
    </div>
    <div class="filters-bar">
      <input type="text" class="form-input search-input" id="student-search" placeholder="Search by name, email, or ID...">
      <select class="form-input filter-select" id="filter-course"><option value="">All Courses</option>${STORE.courses.map(c=>`<option value="${c.name}">${c.name}</option>`).join('')}</select>
      <select class="form-input filter-select" id="filter-status"><option value="">All Status</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="pending">Pending</option><option value="graduated">Graduated</option></select>
      <button class="btn btn-primary btn-sm" onclick="openModal('add-student-modal')">${icon('user-plus',12)} Add Student</button>
      <button class="btn btn-outline-b btn-sm" onclick="exportCSV('students')">${icon('download',12)} Export CSV</button>
    </div>
    <div id="students-table-wrap"></div>`;
}

function renderStudentTable(students) {
  const arrow = (col) => currentStudentSort.col===col ? (currentStudentSort.asc?'↑':'↓') : '';
  if (!students || !students.length) return emptyState('users', 'No Students Found', 'Add students or adjust your filters to see results here');
  return `<div class="data-table-wrap"><table class="data-table">
    <thead><tr><th data-sort="id">ID <span class="sort-arrow">${arrow('id')}</span></th><th data-sort="name">Name <span class="sort-arrow">${arrow('name')}</span></th><th data-sort="course">Course</th><th>Batch</th><th data-sort="status">Status</th><th data-sort="attendance_pct">Attendance</th><th>Actions</th></tr></thead>
    <tbody>${students.map(s => {
      const bc = s.status==='active'?'badge-active':s.status==='pending'?'badge-pending':s.status==='graduated'?'badge-blue':'badge-inactive';
      const esc = getEscalationClass(s);
      return `<tr class="${esc}"><td data-label="ID">${s.id}</td><td data-label="Name"><strong style="color:var(--cream)">${s.name}</strong><br><span style="font-size:11px;color:var(--cream-3)">${s.email}</span></td><td data-label="Course">${s.course}</td><td data-label="Batch">${s.batch}</td><td data-label="Status"><span class="badge ${bc}">${s.status}</span></td><td data-label="Attendance">${s.attendance_pct}%</td><td data-label="Actions"><button class="btn btn-ghost btn-sm">${icon('eye',12)}</button>${s.status==='pending'?`<button class="btn btn-primary btn-sm" onclick="approveStudent('${s.id}')">${icon('check',12)} Approve</button><button class="btn btn-danger btn-sm" onclick="openDenyModal('${s.id}')">${icon('x',12)} Deny</button>`:''}</td></tr>`;
    }).join('')}</tbody></table></div>
    <div class="pagination"><div class="pagination-info">Showing ${students.length} of ${STORE.students.length} students</div><div class="pagination-controls"><button class="pagination-btn" disabled>${icon('chevron-left',12)}</button><button class="pagination-btn active">1</button><button class="pagination-btn" disabled>${icon('chevron-right',12)}</button></div></div>`;
}

function getEscalationClass(s) {
  if (s.status !== 'pending') return '';
  const h = (Date.now() - new Date(s.enrollment_date).getTime()) / 3600000;
  return h > 72 ? 'escalation-red' : h > 48 ? 'escalation-amber' : '';
}

function initStudentHandlers() {
  const wrap = document.getElementById('students-table-wrap');
  if (wrap) { wrap.innerHTML = renderStudentTable(STORE.students); refreshIcons(); }
  const s = document.getElementById('student-search');
  if (s) s.addEventListener('input', () => { clearTimeout(searchTimeout); searchTimeout = setTimeout(filterStudents, 300); });
  ['filter-course','filter-status'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('change', filterStudents); });
  document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
    const tab = btn.dataset.tab;
    const fs = document.getElementById('filter-status');
    if (fs) fs.value = tab==='pending-approvals'?'pending':tab==='graduated'?'graduated':'';
    filterStudents();
  }));
  document.addEventListener('click', (e) => { const th = e.target.closest('th[data-sort]'); if (th) { const c = th.dataset.sort; if (currentStudentSort.col===c) currentStudentSort.asc=!currentStudentSort.asc; else { currentStudentSort.col=c; currentStudentSort.asc=true; } filterStudents(); }});
}

function filterStudents() {
  const q = (document.getElementById('student-search')?.value||'').toLowerCase();
  const cf = document.getElementById('filter-course')?.value||'';
  const sf = document.getElementById('filter-status')?.value||'';
  let f = STORE.students.filter(s => (!q||s.name.toLowerCase().includes(q)||s.email.toLowerCase().includes(q)||s.id.toLowerCase().includes(q)) && (!cf||s.course===cf) && (!sf||s.status===sf));
  f.sort((a,b) => { let va=a[currentStudentSort.col]||'',vb=b[currentStudentSort.col]||''; if(typeof va==='number') return currentStudentSort.asc?va-vb:vb-va; return currentStudentSort.asc?String(va).localeCompare(String(vb)):String(vb).localeCompare(String(va)); });
  const w = document.getElementById('students-table-wrap');
  if (w) { w.innerHTML = renderStudentTable(f); refreshIcons(); }
}

function approveStudent(id) {
  const s = STORE.students.find(x => x.id===id); if (!s) return;
  if (!confirm(`Approve enrollment for ${s.name}?`)) return;
  s.status = 'active'; s.last_active = new Date().toISOString().slice(0,10);
  showToast(`${s.name} approved and enrolled successfully`, 'success');
  filterStudents(); updateBadgeCounts();
}

function openDenyModal(id) {
  const s = STORE.students.find(x => x.id===id); if (!s) return;
  const r = prompt(`Deny reason for ${s.name} (min 10 characters):`);
  if (!r || r.length < 10) { showToast('Denial reason must be at least 10 characters', 'error'); return; }
  s.status = 'inactive';
  showToast(`${s.name} enrollment denied`, 'warning');
  filterStudents(); updateBadgeCounts();
}

/* ═══ COURSES ═══ */
function renderCourses() {
  return `<div class="section-hdr"><span class="shdr-blink"></span><span class="shdr-id">MOD.02</span><span class="shdr-title">Course Management — Content & Structure</span></div>
    <div class="filters-bar"><input type="text" class="form-input search-input" placeholder="Search courses..."><button class="btn btn-primary btn-sm">${icon('plus',12)} Add Course</button></div>
    ${STORE.courses.length ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">${STORE.courses.map(c => `<div class="card"><div class="card-header"><span class="card-title">${c.name}</span><span class="badge badge-active" style="margin-left:auto">${c.status}</span></div><div class="card-body"><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12px;color:var(--cream-2)"><div><span class="kpi-label">ID</span>${c.id}</div><div><span class="kpi-label">Level</span>${c.level}</div><div><span class="kpi-label">Instructor</span>${c.instructor}</div><div><span class="kpi-label">Modules</span>${c.modules}</div></div><div style="margin-top:16px;display:flex;gap:8px"><button class="btn btn-outline-b btn-sm">View Details</button><button class="btn btn-ghost btn-sm">Edit</button></div></div></div>`).join('')}</div>` : emptyState('book-open', 'No Courses Yet', 'Add your first course to get started')}`;
}

/* ═══ INSTRUCTORS ═══ */
function renderInstructors() {
  return `<div class="section-hdr"><span class="shdr-blink"></span><span class="shdr-id">MOD.03</span><span class="shdr-title">Instructor Management</span></div>
    <div class="filters-bar"><input type="text" class="form-input search-input" placeholder="Search instructors..."><button class="btn btn-primary btn-sm">${icon('user-plus',12)} Add Instructor</button></div>
    ${STORE.instructors.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Specialization</th><th>Courses</th><th>Visibility</th><th>Actions</th></tr></thead><tbody>${STORE.instructors.map(i => `<tr><td data-label="Name"><strong style="color:var(--cream)">${i.name}</strong></td><td data-label="Email">${i.email}</td><td data-label="Specialization">${i.specialization}</td><td data-label="Courses">${(i.courses||[]).join(', ')}</td><td data-label="Visibility"><span class="badge ${i.visibility==='Public'?'badge-active':'badge-inactive'}">${i.visibility}</span></td><td><button class="btn btn-ghost btn-sm">${icon('eye',12)}</button><button class="btn btn-ghost btn-sm">${icon('pencil',12)}</button></td></tr>`).join('')}</tbody></table></div>` : emptyState('user-check', 'No Instructors Yet', 'Add instructors to assign them to courses')}`;
}

/* ═══ BATCHES ═══ */
function renderBatches() {
  return `<div class="section-hdr"><span class="shdr-blink"></span><span class="shdr-id">MOD.04</span><span class="shdr-title">Batch Management — Scheduling & Cohorts</span></div>
    <div class="filters-bar"><input type="text" class="form-input search-input" placeholder="Search batches..."><select class="form-input filter-select"><option value="">All Status</option><option>Active</option><option>Upcoming</option><option>Completed</option></select><button class="btn btn-primary btn-sm">${icon('plus',12)} Create Batch</button></div>
    ${STORE.batches.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>ID</th><th>Course</th><th>Instructor</th><th>Start</th><th>End</th><th>Enrolled/Max</th><th>Mode</th><th>Status</th><th>Actions</th></tr></thead><tbody>${STORE.batches.map(b => { const bc = b.status==='active'?'badge-active':b.status==='upcoming'?'badge-pending':'badge-inactive'; return `<tr><td data-label="ID">${b.id}</td><td data-label="Course">${b.course}</td><td data-label="Instructor">${b.instructor}</td><td data-label="Start">${b.start}</td><td data-label="End">${b.end}</td><td data-label="Enrolled">${b.enrolled}/${b.max}</td><td data-label="Mode"><span class="badge badge-blue">${b.mode}</span></td><td data-label="Status"><span class="badge ${bc}">${b.status}</span></td><td><button class="btn btn-ghost btn-sm">${icon('eye',12)}</button><button class="btn btn-ghost btn-sm">${icon('pencil',12)}</button></td></tr>`; }).join('')}</tbody></table></div>` : emptyState('clipboard-list', 'No Batches Yet', 'Create your first batch to schedule a cohort')}`;
}

/* ═══ CERTIFICATIONS ═══ */
function renderCertifications() {
  return `<div class="section-hdr"><span class="shdr-blink"></span><span class="shdr-id">MOD.05</span><span class="shdr-title">Certification System — Issue & Verify</span></div>
    <div class="filters-bar"><input type="text" class="form-input search-input" placeholder="Search certificates..."><button class="btn btn-primary btn-sm">${icon('award',12)} Issue Certificate</button></div>
    ${STORE.certifications.length ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Certificate ID</th><th>Student</th><th>Course</th><th>Date Issued</th><th>Status</th><th>Actions</th></tr></thead><tbody>${STORE.certifications.map(c => `<tr><td data-label="ID"><span style="font-family:var(--font-m);color:var(--blue)">${c.id}</span></td><td data-label="Student"><strong style="color:var(--cream)">${c.student}</strong></td><td data-label="Course">${c.course}</td><td data-label="Date">${c.date}</td><td data-label="Status"><span class="badge badge-active">${c.status}</span></td><td><button class="btn btn-ghost btn-sm">${icon('download',12)}</button><button class="btn btn-ghost btn-sm">${icon('mail',12)}</button><button class="btn btn-danger btn-sm">${icon('shield-off',12)} Revoke</button></td></tr>`).join('')}</tbody></table></div>` : emptyState('award', 'No Certificates Issued', 'Issue certificates to students who complete their courses')}`;
}

/* ═══ EVENTS ═══ */
function renderEvents() {
  return `<div class="section-hdr"><span class="shdr-blink"></span><span class="shdr-id">MOD.06</span><span class="shdr-title">Event Management — Website Sync</span></div>
    <div class="filters-bar"><input type="text" class="form-input search-input" placeholder="Search events..."><select class="form-input filter-select"><option value="">All Status</option><option>Draft</option><option>Published</option><option>Completed</option></select><button class="btn btn-primary btn-sm">${icon('calendar-plus',12)} Create Event</button></div>
    ${STORE.events.length ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px">${STORE.events.map(e => `<div class="card"><div class="card-header">${e.featured?`<span style="color:var(--amber);margin-right:6px">${icon('star',14)}</span>`:''}<span class="card-title">${e.title}</span></div><div class="card-body"><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px;color:var(--cream-2);margin-bottom:14px"><div><span class="kpi-label">Type</span>${e.type}</div><div><span class="kpi-label">Date</span>${e.date}</div><div><span class="kpi-label">Location</span>${e.location}</div><div><span class="kpi-label">Registrations</span>${e.registered}/${e.seats}</div></div><div style="display:flex;align-items:center;justify-content:space-between"><span class="badge ${e.status==='published'?'badge-active':e.status==='draft'?'badge-pending':'badge-inactive'}">${e.status}</span><div style="display:flex;gap:6px"><button class="btn btn-ghost btn-sm">${icon('pencil',12)} Edit</button>${e.status==='draft'?`<button class="btn btn-primary btn-sm">${icon('globe',12)} Publish</button>`:''}</div></div></div></div>`).join('')}</div>` : emptyState('calendar', 'No Events Yet', 'Create events to display on your website')}`;
}

/* ═══ GALLERY ═══ */
function renderGallery() {
  const cats = ['ALL','TRAINING','COMPETITION','EVENTS','NETWORKING','GRADUATION'];
  return `<div class="section-hdr"><span class="shdr-blink"></span><span class="shdr-id">MOD.07</span><span class="shdr-title">Gallery Management — Firebase Storage</span></div>
    <div class="filters-bar">${cats.map(c => `<button class="btn ${c==='ALL'?'btn-primary':'btn-outline-b'} btn-sm">${c}</button>`).join('')}<button class="btn btn-primary btn-sm" style="margin-left:auto">${icon('upload',12)} Upload Image</button></div>
    ${emptyState('image', 'Gallery Empty', 'Upload images to manage your website gallery. Supported: JPG, PNG, WebP (max 5MB)')}`;
}

/* ═══ NOTIFICATIONS ═══ */
function renderNotifications() {
  return `<div class="section-hdr"><span class="shdr-blink"></span><span class="shdr-id">MOD.08</span><span class="shdr-title">Notifications — Multi-Channel Communications</span></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div class="card"><div class="card-header"><span class="card-title">Compose Notification</span></div><div class="card-body">
        <div class="form-group"><label class="form-label">Audience</label><select class="form-input"><option>All Students</option><option>Specific Course</option><option>Specific Batch</option><option>Individual</option><option>All Instructors</option></select></div>
        <div class="form-group"><label class="form-label">Channel</label><select class="form-input"><option>Email (EmailJS)</option><option>In-App</option><option>Both</option></select></div>
        <div class="form-group"><label class="form-label">Subject</label><input type="text" class="form-input" placeholder="Notification subject..."></div>
        <div class="form-group"><label class="form-label">Message</label><textarea class="form-input" rows="5" placeholder="Write your notification message..."></textarea></div>
        <div style="display:flex;gap:10px"><button class="btn btn-primary">${icon('send',12)} Send Now</button><button class="btn btn-outline-b">${icon('clock',12)} Schedule</button><button class="btn btn-ghost">${icon('eye',12)} Preview</button></div>
      </div></div>
      <div class="card"><div class="card-header"><span class="card-title">Notification Log</span></div><div class="card-body">
        ${STORE.notifications_log.length ? '' : emptyState('mail', 'No Notifications Sent', 'Sent notifications will appear here with timestamps and delivery status')}
      </div></div>
    </div>`;
}

/* ═══ ANALYTICS ═══ */
function renderAnalytics() {
  return `<div class="section-hdr"><span class="shdr-blink"></span><span class="shdr-id">MOD.09</span><span class="shdr-title">Analytics & Reports — Intelligence Center</span></div>
    <div class="filters-bar"><button class="btn btn-primary btn-sm">Last 7 Days</button><button class="btn btn-outline-b btn-sm">Last 30 Days</button><button class="btn btn-outline-b btn-sm">Last 3 Months</button><button class="btn btn-outline-b btn-sm">Last 12 Months</button><button class="btn btn-outline-b btn-sm" style="margin-left:auto">${icon('download',12)} Export All CSV</button></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div class="card"><div class="card-header"><span class="card-title">Enrollment by Course</span></div><div class="card-body"><canvas id="chart-enrollment"></canvas></div></div>
      <div class="card"><div class="card-header"><span class="card-title">Students Over Time</span></div><div class="card-body"><canvas id="chart-students-time"></canvas></div></div>
      <div class="card"><div class="card-header"><span class="card-title">Batch Completion Rates</span></div><div class="card-body"><canvas id="chart-batch-completion"></canvas></div></div>
      <div class="card"><div class="card-header"><span class="card-title">Active vs Inactive</span></div><div class="card-body"><canvas id="chart-active-inactive"></canvas></div></div>
    </div>`;
}

function initCharts() {
  ['chart-enrollment','chart-students-time','chart-batch-completion','chart-active-inactive'].forEach(id => {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 260;
    ctx.fillStyle = '#0A0A0A'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#5A5249'; ctx.font = '12px Satoshi, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('No data available — connect your data source', canvas.width/2, canvas.height/2);
  });
}

/* ═══ SETTINGS ═══ */
function renderSettings() {
  return `<div class="section-hdr"><span class="shdr-blink"></span><span class="shdr-id">SYS.CONFIG</span><span class="shdr-title">System Settings — Super Admin Only</span></div>
    <div class="card"><div class="card-header"><span class="card-title">System Configuration</span></div><div class="card-body">
      <div class="form-group"><label class="form-label">Academy Name</label><input type="text" class="form-input" value="Deffenso Hackers Academy"></div>
      <div class="form-row"><div class="form-group"><label class="form-label">Session Timeout (hours)</label><input type="number" class="form-input" value="8"></div><div class="form-group"><label class="form-label">Max Upload Size (MB)</label><input type="number" class="form-input" value="5"></div></div>
      <div class="form-group"><label class="form-label">Inactivity Flag (days)</label><input type="number" class="form-input" value="30"></div>
      <div style="margin-top:20px"><button class="btn btn-primary">${icon('save',12)} Save Settings</button></div>
    </div></div>`;
}

/* ═══ UTILITIES ═══ */
function updateBadgeCounts() {
  const p = STORE.students.filter(s => s.status === 'pending').length;
  const b = document.getElementById('badge-students');
  if (b) { b.textContent = p; b.style.display = p > 0 ? 'flex' : 'none'; }
}

function showToast(message, type) {
  const c = document.getElementById('toast-container'); if (!c) return;
  const t = document.createElement('div');
  t.className = `toast toast-${type||'info'}`;
  t.textContent = message;
  c.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function openModal(id) { const m = document.getElementById(id); if (m) { m.classList.add('open'); refreshIcons(); } }
function closeModal(id) { const m = document.getElementById(id); if (m) m.classList.remove('open'); }

document.addEventListener('keydown', (e) => { if (e.key==='Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open')); });
document.addEventListener('click', (e) => { if (e.target.classList.contains('modal-overlay')) e.target.classList.remove('open'); });

function exportCSV(type) {
  const data = STORE[type];
  if (!data||!data.length) { showToast('No data to export','warning'); return; }
  const h = Object.keys(data[0]);
  const csv = [h.join(','),...data.map(r => h.map(k => `"${r[k]||''}"`).join(','))].join('\n');
  const blob = new Blob([csv],{type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`${type}_export.csv`; a.click();
  URL.revokeObjectURL(url);
  showToast(`${type} exported as CSV`, 'success');
}

window.addEventListener('resize', () => { if (currentModule==='analytics') initCharts(); });
