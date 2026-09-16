/* ================= School Discount Codes ================= *
 * Depends on globals defined in app.js: db, save, uid, logAction, currentRole,
 * currentActorName, faDigits, numFmt, afn, todayISO, toJalali, paginateList,
 * renderPaginationControls, downloadWorkbookFromRows, openModal, closeModal.
 * -------------------------------------------------------------------------- */

const DC_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const DC_LENGTH = 8;

function dcCanManage(){ return currentRole === 'shareholder' || currentRole === 'manager'; }

/* Cryptographically secure random code (falls back to Math.random only if needed) */
function dcRandomCode(){
  let out = '';
  const n = DC_ALPHABET.length;
  if (window.crypto && window.crypto.getRandomValues){
    const buf = new Uint32Array(DC_LENGTH);
    window.crypto.getRandomValues(buf);
    for (let i = 0; i < DC_LENGTH; i++) out += DC_ALPHABET[buf[i] % n];
  } else {
    for (let i = 0; i < DC_LENGTH; i++) out += DC_ALPHABET[Math.floor(Math.random() * n)];
  }
  return out;
}

/* Exact, case-sensitive lookup (case is part of the code's entropy) */
function findDiscountCode(codeStr){
  if(!codeStr) return null;
  const c = String(codeStr).trim();
  return (db.discountCodes || []).find(x => x.code === c) || null;
}

/* The gross tuition the discount/commission percentages apply to (from the enrollment that used the code) */
function dcEnrollmentFee(dc){
  if(!dc || !dc.usedEnrollmentId) return 0;
  const s = (db.students || []).find(x => x.id === dc.usedEnrollmentId);
  return s ? (Number(s.feeAmount) || 0) : 0;
}
function dcDiscountAmount(dc){ return Math.round(dcEnrollmentFee(dc) * (Number(dc.discountPercent)||0) / 100); }
function dcCommissionAmount(dc){ return Math.round(dcEnrollmentFee(dc) * (Number(dc.commissionPercent)||0) / 100); }

/* ---------------- Live validation feedback in the student form ---------------- */
function onSchoolCodeInput(){
  const input = document.getElementById('f-st-school-code');
  const msg = document.getElementById('f-st-school-code-msg');
  if(!input || !msg) return;
  const val = input.value.trim();
  if(!val){ msg.style.display = 'none'; msg.textContent = ''; return; }
  msg.style.display = 'block';
  const dc = findDiscountCode(val);
  if(!dc){
    msg.style.color = 'var(--cost, #e05656)';
    msg.textContent = '✕ کد نامعتبر است.';
  } else if(dc.status === 'used'){
    msg.style.color = 'var(--cost, #e05656)';
    msg.textContent = `✕ این کد قبلاً استفاده شده است (${dc.usedByStudentName || '—'}).`;
  } else if(dc.status === 'void'){
    msg.style.color = 'var(--cost, #e05656)';
    msg.textContent = '✕ این کد باطل شده است.';
  } else {
    msg.style.color = 'var(--income, #2ea043)';
    const school = dc.schoolName ? ` · ${dc.schoolName}` : '';
    msg.textContent = `✓ معتبر — ${faDigits(dc.discountPercent||0)}٪ تخفیف روی شهریه اعمال می‌شود${school}`;
  }
}

/* ---------------- Filter state ---------------- */
const dcFilter = { status: 'all', school: 'all', q: '' };
function onDiscountFilterChange(){
  const st = document.getElementById('dc-filter-status');
  const sc = document.getElementById('dc-filter-school');
  const q  = document.getElementById('dc-search');
  dcFilter.status = st ? st.value : 'all';
  dcFilter.school = sc ? sc.value : 'all';
  dcFilter.q = q ? q.value.trim().toLowerCase() : '';
  paginationState['discountCodes'] = 1;
  renderDiscountCodes();
}

function dcFilteredList(){
  let list = (db.discountCodes || []).slice();
  if(dcFilter.status !== 'all') list = list.filter(c => (c.status||'unused') === dcFilter.status);
  if(dcFilter.school !== 'all') list = list.filter(c => (c.schoolName||'') === dcFilter.school);
  if(dcFilter.q){
    const q = dcFilter.q;
    list = list.filter(c =>
      (c.code||'').toLowerCase().includes(q) ||
      (c.usedByStudentName||'').toLowerCase().includes(q) ||
      (c.schoolName||'').toLowerCase().includes(q) ||
      (c.managerName||'').toLowerCase().includes(q)
    );
  }
  // Unused first, then used, then void; stable-ish by code
  const rank = { unused:0, used:1, void:2 };
  return list.sort((a,b)=> (rank[a.status]??0)-(rank[b.status]??0) || (a.code>b.code?1:-1));
}

/* ---------------- Main render ---------------- */
function renderDiscountCodes(){
  const statsEl = document.getElementById('dc-stats');
  const tbody = document.getElementById('dc-table');
  if(!statsEl || !tbody) return; // view not in DOM

  const all = db.discountCodes || [];
  const unused = all.filter(c => (c.status||'unused')==='unused').length;
  const used = all.filter(c => c.status==='used');
  const voided = all.filter(c => c.status==='void').length;
  const totalDiscount = used.reduce((a,c)=> a + dcDiscountAmount(c), 0);
  const totalCommission = used.reduce((a,c)=> a + dcCommissionAmount(c), 0);

  statsEl.innerHTML = `
    <div class="card c-info"><div class="label">مجموع کدها</div><div class="value info">${faDigits(all.length)}</div></div>
    <div class="card c-income"><div class="label">استفاده‌نشده (فعال)</div><div class="value income">${faDigits(unused)}</div></div>
    <div class="card c-info"><div class="label">استفاده‌شده</div><div class="value info">${faDigits(used.length)}${voided?` · باطل: ${faDigits(voided)}`:''}</div></div>
    <div class="card c-cost"><div class="label">مجموع تخفیف داده‌شده</div><div class="value cost">${afn(totalDiscount)}</div></div>
    <div class="card c-profit"><div class="label">کمیشن قابل پرداخت به مدیران</div><div class="value profit">${afn(totalCommission)}</div></div>
  `;

  // Management panel + school filter options (only meaningful for managers)
  const managePanel = document.getElementById('dc-manage-panel');
  if(managePanel) managePanel.style.display = dcCanManage() ? 'block' : 'none';

  const schoolSel = document.getElementById('dc-filter-school');
  if(schoolSel){
    const schools = Array.from(new Set(all.map(c=>c.schoolName).filter(Boolean))).sort();
    const cur = dcFilter.school;
    schoolSel.innerHTML = '<option value="all">همه</option>' +
      schools.map(s=>`<option value="${s}" ${s===cur?'selected':''}>${s}</option>`).join('');
    if(cur!=='all' && !schools.includes(cur)) { dcFilter.school='all'; schoolSel.value='all'; }
  }

  const list = dcFilteredList();
  const emptyEl = document.getElementById('dc-empty');
  if(emptyEl) emptyEl.style.display = list.length ? 'none' : 'block';

  const { pageItems, totalPages } = paginateList('discountCodes', list);
  const canManage = dcCanManage();
  tbody.innerHTML = pageItems.map(c=>{
    const status = c.status || 'unused';
    const tag = status==='unused'
      ? '<span class="tag income">استفاده‌نشده</span>'
      : status==='used' ? '<span class="tag info">استفاده‌شده</span>'
      : '<span class="tag cost">باطل‌شده</span>';
    const schoolManager = [c.schoolName, c.managerName].filter(Boolean).join(' · ') || '—';
    const usedBy = status==='used' ? (c.usedByStudentName||'—') : '—';
    const dateStr = c.usedAt ? toJalali(c.usedAt) : (c.createdAt ? toJalali(c.createdAt) : '—');
    let actions = '';
    if(canManage){
      if(status==='unused'){
        actions = `<button class="btn ghost small" onclick="assignDiscountCode('${c.id}')">تخصیص</button>
                   <button class="btn ghost small" onclick="voidDiscountCode('${c.id}')">باطل</button>`;
      } else if(status==='void'){
        actions = `<button class="btn ghost small" onclick="reactivateDiscountCode('${c.id}')">فعال‌سازی</button>
                   <button class="btn ghost small" onclick="deleteDiscountCode('${c.id}')">حذف</button>`;
      } else {
        actions = `<button class="btn ghost small" onclick="releaseDiscountCode('${c.id}')">آزادسازی</button>`;
      }
    }
    return `<tr>
      <td><code class="code-badge" style="cursor:default;">${c.code}</code></td>
      <td>${faDigits(c.discountPercent||0)}٪</td>
      <td>${faDigits(c.commissionPercent||0)}٪</td>
      <td>${schoolManager}</td>
      <td>${tag}</td>
      <td>${usedBy}</td>
      <td style="white-space:nowrap;">${dateStr}</td>
      <td style="white-space:nowrap;">${actions}</td>
    </tr>`;
  }).join('');

  renderPaginationControls('dc-pagination', 'discountCodes', totalPages, 'renderDiscountCodes');
}

/* ---------------- Generate a new batch ---------------- */
function generateDiscountCodesUI(){
  if(!dcCanManage()){ alert('فقط سهامدار یا مدیر شعبه می‌تواند کد بسازد.'); return; }
  const count = Math.max(1, Math.min(5000, Number(document.getElementById('f-dc-count').value)||0));
  const discount = Math.max(0, Math.min(100, Number(document.getElementById('f-dc-discount').value)||0));
  const commission = Math.max(0, Math.min(100, Number(document.getElementById('f-dc-commission').value)||0));
  const school = document.getElementById('f-dc-school').value.trim();
  const manager = document.getElementById('f-dc-manager').value.trim();
  if(!count){ alert('تعداد کد را وارد کنید.'); return; }
  if(!confirm(`ساخت ${count} کد جدید با ${discount}٪ تخفیف و ${commission}٪ کمیشن${school?` برای «${school}»`:''}؟`)) return;

  const existing = new Set((db.discountCodes||[]).map(c=>c.code));
  const batch = 'batch-' + todayISO() + (school ? '-' + school : '');
  const created = [];
  let guard = 0;
  while(created.length < count && guard < count * 50){
    guard++;
    const code = dcRandomCode();
    if(existing.has(code)) continue;
    existing.add(code);
    created.push({
      id: 'dc_' + code, code,
      discountPercent: discount, commissionPercent: commission,
      schoolName: school, managerName: manager,
      status: 'unused', usedByProfileId:'', usedByStudentName:'', usedAt:'', usedByActor:'', usedEnrollmentId:'',
      batch, createdAt: todayISO(),
    });
  }
  db.discountCodes = (db.discountCodes||[]).concat(created);
  db.discountCodeSettings = { defaultDiscount: discount, defaultCommission: commission };
  logAction('ساخت کد تخفیف', 'کد تخفیف مکتب', `${created.length} کد · ${discount}٪ تخفیف · ${commission}٪ کمیشن${school?` · ${school}`:''}`);
  save();
  alert(`${created.length} کد ساخته شد. برای چاپ و تحویل به مدیر مکتب از دکمهٔ «چاپ کدهای استفاده‌نشده» استفاده کنید.`);
}

/* ---------------- Assign / void / release / delete ---------------- */
function assignDiscountCode(id){
  const c = (db.discountCodes||[]).find(x=>x.id===id); if(!c) return;
  openModal(`
    <h3>تخصیص کد به مکتب</h3>
    <p class="sub">کد <code class="code-badge" style="cursor:default;">${c.code}</code> را به یک مکتب یا مدیر اختصاص دهید.</p>
    <div class="field"><label>نام مکتب</label><input id="f-dc-assign-school" value="${c.schoolName||''}"></div>
    <div class="field"><label>نام مدیر/مسئول</label><input id="f-dc-assign-manager" value="${c.managerName||''}"></div>
    <div class="field-row">
      <div class="field"><label>درصد تخفیف</label><input id="f-dc-assign-discount" type="number" min="0" max="100" value="${c.discountPercent||0}"></div>
      <div class="field"><label>درصد کمیشن</label><input id="f-dc-assign-commission" type="number" min="0" max="100" value="${c.commissionPercent||0}"></div>
    </div>
    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">انصراف</button>
      <button class="btn" onclick="saveDiscountCodeAssignment('${id}')">ذخیره</button>
    </div>
  `);
}
function saveDiscountCodeAssignment(id){
  const c = (db.discountCodes||[]).find(x=>x.id===id); if(!c) return;
  c.schoolName = document.getElementById('f-dc-assign-school').value.trim();
  c.managerName = document.getElementById('f-dc-assign-manager').value.trim();
  c.discountPercent = Math.max(0, Math.min(100, Number(document.getElementById('f-dc-assign-discount').value)||0));
  c.commissionPercent = Math.max(0, Math.min(100, Number(document.getElementById('f-dc-assign-commission').value)||0));
  logAction('تخصیص کد تخفیف', 'کد تخفیف مکتب', `${c.code} · ${c.schoolName||'—'}`);
  closeModal(); save();
}
function voidDiscountCode(id){
  const c = (db.discountCodes||[]).find(x=>x.id===id); if(!c) return;
  if(c.status!=='unused') return;
  if(!confirm(`کد ${c.code} باطل شود؟ پس از ابطال دیگر در ثبت‌نام پذیرفته نمی‌شود.`)) return;
  c.status='void';
  logAction('ابطال کد تخفیف', 'کد تخفیف مکتب', c.code);
  save();
}
function reactivateDiscountCode(id){
  const c = (db.discountCodes||[]).find(x=>x.id===id); if(!c) return;
  if(c.status!=='void') return;
  c.status='unused';
  logAction('فعال‌سازی کد تخفیف', 'کد تخفیف مکتب', c.code);
  save();
}
function releaseDiscountCode(id){
  const c = (db.discountCodes||[]).find(x=>x.id===id); if(!c) return;
  if(c.status!=='used') return;
  if(!confirm(`علامت «استفاده‌شده» از کد ${c.code} برداشته شود؟ تخفیف اعمال‌شده روی ثبت‌نام مربوطه دستی باقی می‌ماند.`)) return;
  c.status='unused'; c.usedByProfileId=''; c.usedByStudentName=''; c.usedAt=''; c.usedByActor=''; c.usedEnrollmentId='';
  logAction('آزادسازی کد تخفیف', 'کد تخفیف مکتب', c.code);
  save();
}
function deleteDiscountCode(id){
  const c = (db.discountCodes||[]).find(x=>x.id===id); if(!c) return;
  if(!confirm(`کد ${c.code} برای همیشه حذف شود؟`)) return;
  db.discountCodes = db.discountCodes.filter(x=>x.id!==id);
  logAction('حذف کد تخفیف', 'کد تخفیف مکتب', c.code);
  save();
}

/* ---------------- Export / Print ---------------- */
function exportDiscountCodesExcel(){
  const rows = (db.discountCodes||[]).map(c=>({
    'کد': c.code,
    'درصد تخفیف': c.discountPercent||0,
    'درصد کمیشن': c.commissionPercent||0,
    'مکتب': c.schoolName||'',
    'مدیر/مسئول': c.managerName||'',
    'وضعیت': c.status==='used'?'استفاده‌شده':c.status==='void'?'باطل‌شده':'استفاده‌نشده',
    'استفاده‌کننده': c.usedByStudentName||'',
    'تاریخ استفاده': c.usedAt?toJalali(c.usedAt):'',
    'ثبت‌شده توسط': c.usedByActor||'',
    'مبلغ تخفیف (افغانی)': dcDiscountAmount(c),
    'کمیشن (افغانی)': dcCommissionAmount(c),
    'دسته': c.batch||'',
  }));
  downloadWorkbookFromRows({ 'کدهای تخفیف': rows }, 'discount-codes');
}
function printDiscountCodes(){
  const unused = (db.discountCodes||[]).filter(c=>(c.status||'unused')==='unused');
  if(!unused.length){ alert('کد استفاده‌نشده‌ای برای چاپ وجود ندارد.'); return; }
  const win = window.open('', '_blank');
  if(!win){ alert('لطفاً اجازهٔ باز شدن پنجرهٔ چاپ را بدهید.'); return; }
  const cells = unused.map(c=>`<div class="code-cell"><div class="c">${c.code}</div><div class="d">${c.discountPercent||0}% تخفیف</div>${c.schoolName?`<div class="s">${c.schoolName}</div>`:''}</div>`).join('');
  win.document.write(`<!doctype html><html dir="rtl" lang="fa"><head><meta charset="utf-8"><title>کدهای تخفیف هدف</title>
    <style>
      body{font-family:Tahoma,Arial,sans-serif;padding:16px;}
      h1{font-size:16px;text-align:center;}
      .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
      .code-cell{border:1px dashed #888;border-radius:8px;padding:10px;text-align:center;}
      .code-cell .c{font-family:monospace;font-size:18px;font-weight:bold;letter-spacing:1px;}
      .code-cell .d{font-size:11px;color:#333;margin-top:4px;}
      .code-cell .s{font-size:10px;color:#666;margin-top:2px;}
      @media print{ button{display:none;} }
    </style></head><body>
    <h1>کدهای تخفیف آموزشگاه هدف — ${faDigits(unused.length)} کد استفاده‌نشده</h1>
    <p style="text-align:center;font-size:11px;color:#666;">هر کد فقط یک‌بار قابل استفاده است.</p>
    <button onclick="window.print()" style="display:block;margin:0 auto 12px;padding:8px 16px;">چاپ</button>
    <div class="grid">${cells}</div>
  </body></html>`);
  win.document.close();
}

/* Initial paint (this script loads after app.js, so the DOM & globals are ready) */
if (typeof renderDiscountCodes === 'function') renderDiscountCodes();
