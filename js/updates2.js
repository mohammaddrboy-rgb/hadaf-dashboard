/* ================= updates2.js =================
 * Depends on app.js globals: db, save, uid, logAction, currentRole, currentActorName,
 * currentStudentId, faDigits, afn, moneyNum, formatMoneyInput, todayISO, toJalali,
 * jalaliPicker, jalaliPickerValue, profileById, profileEnrollments, className, classBranch,
 * classStatus, studentNetFee, studentRemaining, studentAttendanceTotals,
 * studentParticipationTotals, openTeacherProfileModal, printStudentProfile, renderMyIncome.
 * -------------------------------------------------------------------------- */

/* ---------------- Teacher salary advance requests ---------------- */
/* Shareholder-facing block in the personnel profile modal */
function teacherAdvanceAdminHtml(t){
  if(currentRole!=='shareholder') return '';
  const pending = (db.advanceRequests||[]).filter(r=>r.teacherId===t.id && r.status==='pending');
  const pendRows = pending.map(r=>`
    <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; border-top:1px solid var(--border-soft); padding:8px 0; flex-wrap:wrap;">
      <span>${afn(r.amount)} <small style="color:var(--text-dim);">${esc(r.reason?('· '+r.reason):'')} · ${toJalali(r.date)}</small></span>
      <span style="display:flex; gap:6px;">
        <button class="btn small" onclick="approveAdvanceRequest('${escJs(r.id)}')">تأیید</button>
        <button class="btn ghost small" onclick="rejectAdvanceRequest('${escJs(r.id)}')">رد</button>
      </span>
    </div>`).join('');
  return `<div class="panel" style="background:var(--panel-2); padding:12px 14px; margin-bottom:16px;">
    <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px;">
      <input type="checkbox" style="width:auto;" ${t.canRequestAdvance?'checked':''} onchange="toggleAdvancePermission('${escJs(t.id)}', this.checked)">
      اجازهٔ ثبت «درخواست پیش‌پرداخت حقوق» برای این شخص
    </label>
    ${pending.length ? `<div style="margin-top:10px;"><b style="font-size:12.5px;">درخواست‌های در انتظار تأیید:</b>${pendRows}</div>` : '<p class="hint" style="margin:8px 0 0;">درخواست در انتظاری وجود ندارد.</p>'}
  </div>`;
}
function toggleAdvancePermission(teacherId, checked){
  if(currentRole!=='shareholder') return;
  const t = db.teachers.find(x=>x.id===teacherId); if(!t) return;
  t.canRequestAdvance = !!checked;
  logAction(checked?'فعال‌سازی':'غیرفعال‌سازی', 'اجازهٔ پیش‌پرداخت', t.name);
  save();
}
function approveAdvanceRequest(id){
  if(currentRole!=='shareholder') return;
  const r = (db.advanceRequests||[]).find(x=>x.id===id); if(!r || r.status!=='pending') return;
  const t = db.teachers.find(x=>x.id===r.teacherId);
  if(!confirm(`درخواست پیش‌پرداخت ${afn(r.amount)} برای «${t?t.name:''}» تأیید شود؟ این مبلغ به‌عنوان پیش‌پرداخت ثبت و از حقوق او کسر می‌شود.`)) return;
  r.status='approved'; r.decidedBy=currentActorName; r.decidedAt=todayISO();
  db.teacherAdvances.unshift({ id: uid(), teacherId:r.teacherId, amount:Number(r.amount)||0, date: todayISO(), settled:false, note:'از درخواست پیش‌پرداخت' + (r.reason?(' · '+r.reason):'') });
  logAction('تأیید پیش‌پرداخت', 'پرسنل', `${t?t.name:''} · ${afn(r.amount)}`);
  save();
  if(document.getElementById('overlay') && document.getElementById('overlay').classList.contains('active')) openTeacherProfileModal(r.teacherId);
}
function rejectAdvanceRequest(id){
  if(currentRole!=='shareholder') return;
  const r = (db.advanceRequests||[]).find(x=>x.id===id); if(!r || r.status!=='pending') return;
  if(!confirm('این درخواست رد شود؟')) return;
  r.status='rejected'; r.decidedBy=currentActorName; r.decidedAt=todayISO();
  logAction('رد پیش‌پرداخت', 'پرسنل', (db.teachers.find(x=>x.id===r.teacherId)||{}).name||'');
  save();
  if(document.getElementById('overlay') && document.getElementById('overlay').classList.contains('active')) openTeacherProfileModal(r.teacherId);
}

/* Teacher-facing request form + history (shown inside «درآمد من») */
function teacherAdvanceRequestHtml(t){
  const requests = (db.advanceRequests||[]).filter(r=>r.teacherId===t.id).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  const reqRows = requests.length ? requests.map(r=>`
    <tr><td class="num">${afn(r.amount)}</td><td>${esc(r.reason||'-')}</td><td>${toJalali(r.date)}</td>
    <td><span class="tag ${r.status==='approved'?'income':r.status==='rejected'?'cost':'info'}">${r.status==='approved'?'تأییدشده':r.status==='rejected'?'ردشده':'در انتظار'}</span></td></tr>`).join('')
    : '<tr><td colspan="4" class="empty">درخواستی ثبت نشده است.</td></tr>';
  const form = t.canRequestAdvance ? `
    <div class="field-row" style="margin-top:8px;">
      <div class="field"><label>مبلغ درخواستی (افغانی) *</label><input id="f-adv-req-amount" class="money-input" oninput="formatMoneyInput(this)" placeholder="۰"></div>
      <div class="field"><label>دلیل (اختیاری)</label><input id="f-adv-req-reason" placeholder="مثلاً: نیاز فوری"></div>
    </div>
    <button class="btn" onclick="submitAdvanceRequest('${escJs(t.id)}')">ثبت درخواست پیش‌پرداخت</button>
  ` : `<p class="hint">در حال حاضر اجازهٔ ثبت «درخواست پیش‌پرداخت» برای شما فعال نیست. برای فعال‌سازی با سهامداران هماهنگ کنید.</p>`;
  return `
    <div class="sectiontitle" style="margin-top:18px;">پیش‌پرداخت حقوق</div>
    ${form}
    <div class="table-scroll" style="margin-top:12px;"><table>
      <thead><tr><th class="num">مبلغ</th><th>دلیل</th><th>تاریخ</th><th>وضعیت</th></tr></thead>
      <tbody>${reqRows}</tbody>
    </table></div>`;
}
function submitAdvanceRequest(teacherId){
  const t = db.teachers.find(x=>x.id===teacherId); if(!t) return;
  if(!t.canRequestAdvance){ alert('اجازهٔ ثبت درخواست برای شما فعال نیست.'); return; }
  const amount = moneyNum('f-adv-req-amount');
  if(!amount || amount<=0){ alert('لطفاً مبلغ درخواستی را وارد کنید.'); return; }
  const reasonEl = document.getElementById('f-adv-req-reason');
  const reason = reasonEl ? reasonEl.value.trim() : '';
  db.advanceRequests.unshift({ id: uid(), teacherId, amount, reason, date: todayISO(), status:'pending', decidedBy:'', decidedAt:'' });
  logAction('ثبت درخواست پیش‌پرداخت', 'پرسنل', `${t.name} · ${afn(amount)}`);
  save();
  alert('درخواست شما ثبت شد و در انتظار تأیید سهامداران است.');
  if(typeof renderMyIncome==='function') renderMyIncome();
}

/* ---------------- Teacher discipline (present / tardy / absent) ---------------- */
function teacherDisciplineRecord(date){ return (db.teacherAttendance||[]).find(r=>r.date===date); }
function teacherDisciplineTotals(teacherId){
  let present=0, tardy=0, absent=0;
  (db.teacherAttendance||[]).forEach(r=>{ const v=r.marks?r.marks[teacherId]:undefined; if(v==='present')present++; else if(v==='tardy')tardy++; else if(v==='absent')absent++; });
  return { present, tardy, absent };
}
function setTeacherDiscipline(date, teacherId, status){
  if(currentRole!=='shareholder' && currentRole!=='manager') return;
  let rec = teacherDisciplineRecord(date);
  if(!rec){ rec = { date, marks:{} }; db.teacherAttendance.push(rec); }
  if(!rec.marks) rec.marks = {};
  if(rec.marks[teacherId]===status) delete rec.marks[teacherId]; else rec.marks[teacherId]=status;
  logAction('ثبت انضباط', 'پرسنل', `${(db.teachers.find(t=>t.id===teacherId)||{}).name||''} · ${toJalali(date)}`);
  save();
  renderTeacherDiscipline();
}
let teacherDisciplineDate = todayISO();
function loadTeacherDisciplineDate(){ teacherDisciplineDate = jalaliPickerValue('tdisc-date'); renderTeacherDiscipline(); }
function renderTeacherDiscipline(){
  const root = document.getElementById('teacher-discipline-root'); if(!root) return;
  if(currentRole!=='shareholder' && currentRole!=='manager'){
    root.innerHTML = `<div class="panel"><p style="color:var(--text-dim); text-align:center; padding:12px;">این بخش فقط برای سهامداران و مدیران شعبه است.</p></div>`;
    return;
  }
  const personnel = db.teachers || [];
  const rec = teacherDisciplineRecord(teacherDisciplineDate);
  const rowFor = t=>{
    const cur = rec && rec.marks ? rec.marks[t.id] : undefined;
    const btn=(st,label)=>`<button class="btn ${cur===st?'':'ghost'} small" onclick="setTeacherDiscipline('${escJs(teacherDisciplineDate)}','${escJs(t.id)}','${escJs(st)}')">${esc(label)}</button>`;
    const tot = teacherDisciplineTotals(t.id);
    return `<tr>
      <td>${esc(t.name)} <small style="color:var(--text-dim);">(${esc(t.role||'مدرس')})</small></td>
      <td><div style="display:flex; gap:6px; flex-wrap:wrap;">${btn('present','حاضر')}${btn('tardy','ناوقت')}${btn('absent','غیرحاضر')}</div></td>
      <td class="num"><span style="color:var(--income);">${faDigits(tot.present)}</span> / <span style="color:var(--gold-soft,#c9a227);">${faDigits(tot.tardy)}</span> / <span style="color:var(--cost);">${faDigits(tot.absent)}</span></td>
    </tr>`;
  };
  root.innerHTML = `<div class="panel">
    <div class="panel-head"><h2>انضباط پرسنل (حاضر / ناوقت / غیرحاضر)</h2></div>
    <p style="font-size:12.5px; color:var(--text-dim); margin:0 0 12px;">برای هر تاریخ، وضعیت هر مدرس/پرسنل را با کلیک روی «حاضر»، «ناوقت» یا «غیرحاضر» ثبت کنید. ستون آخر مجموع کل را نشان می‌دهد.</p>
    <div style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap; margin-bottom:12px;">
      <div class="field" style="margin:0;"><label>تاریخ</label>${jalaliPicker('tdisc-date', teacherDisciplineDate)}</div>
      <button class="btn ghost" onclick="loadTeacherDisciplineDate()">نمایش این تاریخ</button>
      <span class="hint">تاریخ فعال: ${toJalali(teacherDisciplineDate)}</span>
    </div>
    <div class="table-scroll"><table>
      <thead><tr><th>نام</th><th>وضعیت این تاریخ</th><th class="num">مجموع (حاضر/ناوقت/غیرحاضر)</th></tr></thead>
      <tbody>${personnel.length ? personnel.map(rowFor).join('') : '<tr><td colspan="3" class="empty">پرسنلی ثبت نشده است.</td></tr>'}</tbody>
    </table></div>
  </div>`;
}
/* Teacher-facing discipline summary (shown inside «درآمد من») */
function teacherDisciplineSummaryHtml(t){
  const tot = teacherDisciplineTotals(t.id);
  return `<div class="sectiontitle" style="margin-top:18px;">انضباط زمانی من</div>
    <div class="cards" style="grid-template-columns:repeat(3,1fr);">
      <div class="card c-income"><div class="label">حاضر</div><div class="value income">${faDigits(tot.present)}</div></div>
      <div class="card c-info"><div class="label">ناوقت (دیرحاضر)</div><div class="value info">${faDigits(tot.tardy)}</div></div>
      <div class="card c-cost"><div class="label">غیرحاضر</div><div class="value cost">${faDigits(tot.absent)}</div></div>
    </div>`;
}

/* ---------------- Student self profile (student login) ---------------- */
function renderStudentSelf(){
  const root = document.getElementById('student-self-root'); if(!root) return;
  if(currentRole!=='student' || !currentStudentId){
    root.innerHTML = `<div class="panel"><p style="color:var(--text-dim); text-align:center; padding:12px;">این بخش برای شاگردان است.</p></div>`;
    return;
  }
  const p = profileById(currentStudentId);
  if(!p){ root.innerHTML = `<div class="panel"><p style="color:var(--text-dim); text-align:center; padding:12px;">اطلاعات یافت نشد.</p></div>`; return; }
  const val = v => (v!=='' && v!==undefined && v!==null) ? faDigits(v) : '-';
  const rows = profileEnrollments(p.id);
  const histRows = rows.length ? rows.map(s=>{
    const att = studentAttendanceTotals(s.classId, s.id);
    const part = studentParticipationTotals(s.classId, s.id);
    const cls = db.classes.find(c=>c.id===s.classId) || {};
    return `<tr>
      <td>${esc(className(s.classId))}</td><td>${esc(classBranch(s.classId))}</td><td>${toJalali(s.registerDate)}</td>
      <td>${esc(classStatus(cls))}</td>
      <td class="num">${afn(studentNetFee(s))}</td><td class="num">${afn(studentRemaining(s))}</td>
      <td class="num">${faDigits(att.present)} / ${faDigits(att.absent)}</td>
      <td class="num"><span style="color:var(--income);">+${faDigits(part.plus)}</span> / <span style="color:var(--cost);">−${faDigits(part.minus)}</span></td>
      <td class="num">${esc(val(s.activityScore))}</td><td class="num">${esc(val(s.midtermScore))}</td><td class="num">${esc(val(s.examScore))}</td>
      <td>${esc(s.result || 'در حال آموزش')}</td>
    </tr>`;
  }).join('') : '<tr><td colspan="12" class="empty">هنوز در صنفی ثبت‌نام نشده‌اید.</td></tr>';
  root.innerHTML = `<div class="panel">
    <div class="panel-head" style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
      <h2>پروندهٔ ${esc(p.name)} <span style="font-size:12px; color:var(--text-dim);">(${esc(p.code||'-')})</span></h2>
      <button class="btn secondary" onclick="printStudentProfile('${escJs(p.id)}')">چاپ پرونده</button>
    </div>
    <div style="font-size:13px; color:var(--text-dim); margin-bottom:14px;">پایه/سن: ${esc(p.grade||'-')} · سرپرست: ${esc(p.guardianName||'-')} · تماس: ${esc(p.guardianPhone||'-')}</div>
    <div class="table-scroll"><table>
      <thead><tr><th>صنف</th><th>شعبه</th><th>تاریخ ثبت‌نام</th><th>وضعیت</th><th class="num">شهریهٔ نهایی</th><th class="num">باقیمانده</th><th>حاضر/غایب</th><th>فعالیت (+/−)</th><th class="num">فعالیت صنفی</th><th class="num">میان‌ترم</th><th class="num">فاینل</th><th>نتیجه</th></tr></thead>
      <tbody>${histRows}</tbody>
    </table></div>
  </div>`;
}

/* ---------------- Login-page notifications (Dari changelog) ---------------- */
const HADAF_CHANGELOG = [
  { date:'۱۴۰۵/۰۶/۲۸', text:'شاگردان اکنون می‌توانند با کد شاگردی (نام کاربری) و شمارهٔ تماس (رمز عبور) وارد شوند و پروندهٔ خود را ببینند.' },
  { date:'۱۴۰۵/۰۶/۲۸', text:'بخش جدید «انضباط پرسنل» برای ثبت حاضر/ناوقت/غیرحاضر مدرسان (ویژهٔ سهامداران و مدیران شعبه).' },
  { date:'۱۴۰۵/۰۶/۲۸', text:'امکان ثبت «درخواست پیش‌پرداخت حقوق» توسط مدرسان با اجازهٔ سهامداران.' },
  { date:'۱۴۰۵/۰۶/۲۸', text:'افزودن نمرات میان‌ترم و فاینل و «فعالیت روزانه (+/−)» در بخش حضور و غیاب و پروندهٔ شاگرد.' },
  { date:'۱۴۰۵/۰۶/۲۶', text:'افزودن دکمهٔ «چاپ پرونده» شاگرد با انتخاب اندازهٔ کاغذ.' },
  { date:'۱۴۰۵/۰۶/۲۵', text:'افزودن مالیات حقوق پرسنل و گزارش مالیاتی شهریه (ویژهٔ سهامداران).' },
];
function renderGateNotifications(){
  const box = document.getElementById('gate-notifications'); if(!box) return;
  if(!HADAF_CHANGELOG.length){ box.style.display='none'; return; }
  box.innerHTML = '<div class="gate-notif-title">🔔 تازه‌ترین تغییرات سامانه</div>' +
    HADAF_CHANGELOG.map(n=>`<div class="gate-notif-item"><span class="gate-notif-date">${esc(n.date)}</span> ${esc(n.text)}</div>`).join('');
}

/* Initial paint (loaded after app.js) */
if (typeof renderTeacherDiscipline === 'function') renderTeacherDiscipline();
if (typeof renderStudentSelf === 'function') renderStudentSelf();
if (typeof renderGateNotifications === 'function') renderGateNotifications();
