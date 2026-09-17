/* ---------------- Theme & UI Management ---------------- */
function getCurrentTheme() {
  return document.documentElement.getAttribute('data-theme') || localStorage.getItem('hadaf_theme') || 'dark';
}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('hadaf_theme', theme); } catch(e) {}
  updateThemeUI(theme);
}
function updateThemeUI(theme) {
  const sun = document.getElementById('theme-icon-sun');
  const moon = document.getElementById('theme-icon-moon');
  const lbl = document.getElementById('theme-btn-label');
  if (theme === 'dark') {
    if (sun) sun.style.display = 'inline-block';
    if (moon) moon.style.display = 'none';
    if (lbl) lbl.textContent = 'تم روشن';
  } else {
    if (sun) sun.style.display = 'none';
    if (moon) moon.style.display = 'inline-block';
    if (lbl) lbl.textContent = 'تم تاریک';
  }
  document.querySelectorAll('.gate-theme-sun').forEach(s => s.style.display = theme === 'dark' ? 'inline-block' : 'none');
  document.querySelectorAll('.gate-theme-moon').forEach(m => m.style.display = theme === 'dark' ? 'none' : 'inline-block');
  document.querySelectorAll('.gate-theme-label').forEach(l => l.textContent = theme === 'dark' ? 'تم روشن' : 'تم تاریک');
}
function toggleTheme() {
  const next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

function toggleMobileNav(force) {
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('mobile-nav-backdrop');
  if (!sidebar) return;
  const isOpen = force !== undefined ? force : !sidebar.classList.contains('mobile-open');
  if (isOpen) {
    sidebar.classList.add('mobile-open');
    if (backdrop) backdrop.classList.add('active');
  } else {
    sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
  }
}

function switchGateTab(role) {
  document.querySelectorAll('.gate-tab').forEach(t => {
    const isActive = t.getAttribute('data-role') === role;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  ['shareholder', 'manager', 'teacher', 'employee'].forEach(r => {
    const el = document.getElementById('gate-role-' + r);
    if (el) el.style.display = (r === role ? 'flex' : 'none');
    const err = document.getElementById('gate-error-' + r);
    if (err) { err.style.display = 'none'; err.textContent = ''; }
  });
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPw = input.type === 'password';
  input.type = isPw ? 'text' : 'password';
  btn.innerHTML = isPw
    ? `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>`
    : `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
}

const VIEW_TITLES = {
  dashboard: { title: 'داشبورد', sub: 'نمای کلی وضعیت آموزشی و مالی آموزشگاه هدف' },
  classes: { title: 'صنف‌ها', sub: 'انواع صنف‌ها، مدرس مربوطه، تاریخ آغاز و پایان و ظرفیت' },
  seminars: { title: 'سمینار / وبینار / کارگاه', sub: 'رویدادهای علمی و تخصصی آموزشگاه هدف' },
  students: { title: 'شاگردها', sub: 'ثبت‌نام شاگردها، وضعیت شهریه و اطلاعات تماس' },
  attendance: { title: 'حضور و غیاب', sub: 'ثبت و پیگیری حضور و غیاب صنف‌های فعال' },
  teachers: { title: 'پرسنل و مدرسان', sub: 'مدیریت اساتید، کارکنان و محاسبه حقوق ماهانه' },
  donations: { title: 'سایر درآمدها', sub: 'ثبت درآمدهای متفرقه، کمک‌ها و درآمدهای جانبی' },
  books: { title: 'کتاب و مطبوعات', sub: 'خرید کتاب، فروش کتاب و کارت شاگردی، و سود مطبوعات' },
  expenses: { title: 'هزینه‌های روزانه', sub: 'ثبت و دسته‌بندی هزینه‌های جاری و عملیاتی' },
  report: { title: 'گزارش جامع مالی و عملیاتی', sub: 'تحلیل دقیق سود، درآمد، مقایسه فصلی و شعبات' },
  projects: { title: 'پروژه‌ها', sub: 'برنامه‌ها و فعالیت‌های توسعه‌ای آموزشگاه' },
  meetings: { title: 'جلسات هفتگی', sub: 'صورت‌جلسات، تصمیم‌گیری‌ها و پیگیری امور معوق' },
  shareholders: { title: 'سهامداران', sub: 'مدیریت سهامداران و فرمول تقسیم سود مؤسسه' },
  activityLog: { title: 'گزارش فعالیت‌ها', sub: 'تاریخچه و لاگ تغییرات اطلاعات سیستم' },
  discountCodes: { title: 'کدهای تخفیف مکاتب', sub: 'مدیریت کدهای تخفیف توزیع‌شده در مکاتب، کمیشن مدیران و وضعیت استفاده' },
  myIncome: { title: 'درآمد من', sub: 'درآمد شما از هر صنف و مجموع صنف‌ها، و حقوق پرداخت‌شده به شما' },
  assets: { title: 'دارایی‌های هدف', sub: 'ثبت و مدیریت دارایی‌های آموزشگاه هدف (ویژهٔ سهامداران)' },
  taxReport: { title: 'گزارش مالیاتی (شهریه)', sub: 'گزارش نقدی درآمد شهریه و هزینه‌های مرتبط برای ادارهٔ مالیات (ویژهٔ سهامداران)' },
  settings: { title: 'تنظیمات سامانه', sub: 'پشتیبان‌گیری، بازگردانی و تنظیمات تخفیف' }
};

/* ---------------- Storage ---------------- */
const STORE_KEY = 'hadaf_dashboard_v1';
let db = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
if(!db){
  db = window.HADAF_SEED;
}
['classes','students','teachers','donations','expenses','projects','meetings','seminars','teacherAdvances','studentProfiles','shareholders','bookPurchases','attendance','activityLog','discountCodes','assets'].forEach(k=>{ if(!db[k]) db[k]=[]; });
if(!db.accessPins) db.accessPins = { shareholder:'4545', manager:'2026', teacher:'1010' };
if(!db.referralSettings) db.referralSettings = { referrerDiscount:5, refereeDiscount:10 };
if(!db.discountCodeSettings) db.discountCodeSettings = { defaultDiscount:10, defaultCommission:5 };
if(db.teacherTaxPercent===undefined) db.teacherTaxPercent = 5; // income tax withheld from each teacher's salary (editable by shareholders)
// One-time load of the 1000 pre-generated school discount codes shipped in the seed
if(!db.discountCodesSeeded){
  if((!db.discountCodes || !db.discountCodes.length) && window.HADAF_SEED && window.HADAF_SEED.discountCodes){
    db.discountCodes = window.HADAF_SEED.discountCodes.map(c=>Object.assign({}, c));
  }
  db.discountCodesSeeded = true;
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch(e) {}
}
function migrateLegacyData(){
  let changed = false;
  db.teachers.forEach(t=>{
    if(!t.role){ t.role='مدرس'; changed=true; }
    if(!t.code){ t.code = generatePersonnelCode(t.role, t.createdAt||todayISO()); changed=true; }
    if(t.photo===undefined){ t.photo=''; changed=true; }
    if(t.idPhoto===undefined){ t.idPhoto=''; changed=true; }
    if(t.contractStart===undefined){ t.contractStart = t.createdAt||''; changed=true; }
    if(t.contractEnd===undefined){ t.contractEnd=''; changed=true; }
    if(!t.password){ t.password = generateUniquePassword(); changed=true; migrationGeneratedPasswords.push({name:t.name, code:t.code, role:t.role, password:t.password}); }
  });
  db.students.forEach(s=>{
    if(!s.profileId){
      const profile = {
        id: uid(), code: generateStudentCode(s.registerDate),
        name: s.name || 'بدون‌نام', grade: s.grade||'', guardianName: s.guardianName||'',
        guardianPhone: s.guardianPhone||'', photo:'', idPhoto:'', note:'', createdAt: s.registerDate||todayISO(),
      };
      db.studentProfiles.push(profile);
      s.profileId = profile.id;
      delete s.name; delete s.grade; delete s.guardianName; delete s.guardianPhone;
      changed = true;
    }
    if(s.result===undefined){ s.result=''; changed=true; }
    if(s.activityScore===undefined){ s.activityScore=''; changed=true; }
    if(s.examScore===undefined){ s.examScore=''; changed=true; }
    if(s.bookTitle===undefined){ s.bookTitle=''; s.bookPrice=0; s.bookPaid=false; changed=true; }
    if(s.idCardPrice===undefined){ s.idCardPrice=0; s.idCardPaid=false; changed=true; }
    if(s.referralDiscountPercent===undefined){ s.referralDiscountPercent=0; changed=true; }
    if(s.familyDiscountPercent===undefined){ s.familyDiscountPercent=0; changed=true; }
    if(s.schoolCodeDiscountPercent===undefined){ s.schoolCodeDiscountPercent=0; changed=true; }
    if(s.schoolCode===undefined){ s.schoolCode=''; changed=true; }
    if(s.referredBy===undefined){ s.referredBy=''; changed=true; }
  });
  db.studentProfiles.forEach(p=>{
    if(p.familyId===undefined){ p.familyId=''; changed=true; }
  });
  db.bookPurchases.forEach(b=>{
    if(b.paidAmount===undefined){ b.paidAmount=0; changed=true; }
    if(b.paidDate===undefined){ b.paidDate=''; changed=true; }
    if(b.dueDate===undefined){ b.dueDate=''; changed=true; }
  });
  if(!db.shareholders.length){
    const sh = [
      { name:'Mohammad Hanif Mahdiyar', sharePercent:40 },
      { name:'Ali Hussain Elham', sharePercent:40 },
      { name:'Habibullah Kakar', sharePercent:10 },
      { name:'مشتاق میرزایی', sharePercent:10 },
    ];
    sh.forEach(x=>{
      db.shareholders.push({
        id: uid(), code: generateShareholderCode(todayISO()), name:x.name, sharePercent:x.sharePercent,
        phone:'', photo:'', idPhoto:'', password: generateUniquePassword(), note:'', createdAt: todayISO(),
      });
    });
    changed = true;
  }
  db.shareholders.forEach(sh=>{
    if(!sh.password){ sh.password = generateUniquePassword(); changed = true; migrationGeneratedPasswords.push({name:sh.name, code:sh.code, role:'سهامدار', password:sh.password}); }
  });
  // One-time 2026 shareholder restructure: rename, re-weight shares, add new partner
  if(!db.shareholderRestructure2026){
    const ali = db.shareholders.find(s=> s.name==='Alireza Elham');
    if(ali){ ali.name = 'Ali Hussain Elham'; }
    const setShare = (name, pct)=>{ const s = db.shareholders.find(x=>x.name===name); if(s) s.sharePercent = pct; };
    setShare('Mohammad Hanif Mahdiyar', 40);
    setShare('Ali Hussain Elham', 40);
    setShare('Habibullah Kakar', 10);
    if(!db.shareholders.some(s=> s.name==='مشتاق میرزایی')){
      const pwd = generateUniquePassword();
      const rec = { id: uid(), code: generateShareholderCode(todayISO()), name:'مشتاق میرزایی', sharePercent:10, phone:'', photo:'', idPhoto:'', password: pwd, note:'', createdAt: todayISO() };
      db.shareholders.push(rec);
      migrationGeneratedPasswords.push({name:rec.name, code:rec.code, role:'سهامدار', password:pwd});
    }
    db.shareholderRestructure2026 = true;
    changed = true;
  }
  // Set Mushtaq Mirzayi's login password to the value chosen by the owner
  if(!db.mushtaqPasswordSet){
    const mushtaq = db.shareholders.find(s=> s.name==='مشتاق میرزایی');
    if(mushtaq){ mushtaq.password = '084597'; changed = true; }
    db.mushtaqPasswordSet = true;
  }
  if(!db.bookPurchases.length){
    const samples = [
      { title:'General English Coursebook 1', source:'مطبعهٔ آریانا', branch:BRANCHES[0], quantity:30, unitCost:250, paidRatio:1 },
      { title:'IELTS Cambridge Practice Tests', source:'کتاب‌فروشی سعیدی', branch:BRANCHES[1], quantity:20, unitCost:450, paidRatio:0.5 },
      { title:'Kids English Starter', source:'مطبعهٔ آریانا', branch:BRANCHES[2], quantity:25, unitCost:180, paidRatio:1 },
      { title:'TOEFL iBT Prep Book', source:'کتاب‌فروشی سعیدی', branch:BRANCHES[1], quantity:15, unitCost:400, paidRatio:0 },
    ];
    const base = new Date(); base.setDate(base.getDate()-14);
    samples.forEach((x,i)=>{
      const total = x.quantity*x.unitCost;
      const d = new Date(base); d.setDate(d.getDate()+i*2);
      const dateStr = d.toISOString().slice(0,10);
      db.bookPurchases.push({
        id: uid(), title:x.title, source:x.source, branch:x.branch, quantity:x.quantity, unitCost:x.unitCost, totalCost: total,
        date: dateStr, paidAmount: Math.round(total*x.paidRatio), paidDate: x.paidRatio>0?dateStr:'', dueDate: x.paidRatio<1?todayISO():'', note:'',
      });
    });
    changed = true;
  }
  if(changed){ localStorage.setItem(STORE_KEY, JSON.stringify(db)); }
}
let migrationGeneratedPasswords = [];
migrateLegacyData();
function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(db)); renderAll(); }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,7); }

/* ---------------- Backup / Restore ---------------- */
function exportBackup(){
  const blob = new Blob([JSON.stringify(db, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hadaf-dashboard-${todayISO()}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
function importBackup(input){
  const file = input.files[0]; if(!file) return;
  if(!confirm('بازگردانی، تمام داده‌های فعلی را با محتوای این فایل جایگزین می‌کند. ادامه می‌دهید؟')){ input.value=''; return; }
  const reader = new FileReader();
  reader.onload = e=>{
    try{
      const parsed = JSON.parse(e.target.result);
      db = Object.assign({ classes:[], students:[], teachers:[], donations:[], expenses:[], projects:[], meetings:[], seminars:[], teacherAdvances:[], studentProfiles:[], shareholders:[], bookPurchases:[], attendance:[], activityLog:[], discountCodes:[], assets:[], accessPins:{shareholder:'4545',manager:'2026',teacher:'1010'}, referralSettings:{referrerDiscount:5, refereeDiscount:10}, discountCodeSettings:{defaultDiscount:10, defaultCommission:5} }, parsed);
      save();
      alert('بازگردانی با موفقیت انجام شد.');
    }catch(err){
      alert('فایل معتبر نیست.');
    }
    input.value='';
  };
  reader.readAsText(file);
}

/* ---------------- Helpers ---------------- */
function numFmt(n){
  n = Math.round(Number(n)||0);
  const neg = n<0; n = Math.abs(n);
  const grouped = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const withSign = (neg?'-':'') + grouped;
  return withSign.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
}
function afn(n){ return numFmt(n) + ' افغانی'; }
function formatMoneyInput(el){
  const raw = el.value.replace(/[^\d]/g,'');
  el.value = raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
}
function moneyNum(id){
  const el = document.getElementById(id);
  if(!el) return 0;
  return Number((el.value||'').replace(/,/g,'')) || 0;
}
function todayISO(){ return new Date().toISOString().slice(0,10); }

/* ---------------- Dari (Solar Hijri) calendar ---------------- */
const AFG_MONTHS=['حمل','ثور','جوزا','سرطان','اسد','سنبله','میزان','عقرب','قوس','جدی','دلو','حوت'];
const FA_DIGITS='۰۱۲۳۴۵۶۷۸۹';
function faDigits(n){ return String(n).replace(/\d/g, d=>FA_DIGITS[d]); }

/* ---------------- Pagination ---------------- */
const PAGE_SIZE = 20;
const paginationState = {};
function paginateList(key, list){
  if(!paginationState[key]) paginationState[key] = 1;
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  if(paginationState[key] > totalPages) paginationState[key] = totalPages;
  const page = paginationState[key];
  const start = (page-1)*PAGE_SIZE;
  return { pageItems: list.slice(start, start+PAGE_SIZE), page, totalPages, total:list.length };
}
function renderPaginationControls(containerId, key, totalPages, renderFnName){
  const el = document.getElementById(containerId);
  if(!el) return;
  if(totalPages<=1){ el.innerHTML=''; return; }
  const page = paginationState[key]||1;
  el.innerHTML = `
    <button class="btn ghost small" ${page<=1?'disabled':''} onclick="changePage('${key}',${page-1},'${renderFnName}')">‹ قبلی</button>
    <span class="pagination-info">صفحهٔ ${faDigits(page)} از ${faDigits(totalPages)}</span>
    <button class="btn ghost small" ${page>=totalPages?'disabled':''} onclick="changePage('${key}',${page+1},'${renderFnName}')">بعدی ›</button>
  `;
}
function changePage(key, newPage, renderFnName){
  paginationState[key] = newPage;
  window[renderFnName]();
}

function g2jParts(gregStr){
  let d = new Date(gregStr+'T00:00:00');
  let gy=d.getFullYear(), gm=d.getMonth()+1, gd=d.getDate();
  let g_d_m=[0,31,59,90,120,151,181,212,243,273,304,334];
  let jy = (gy<=1600)?0:979; gy -= (gy<=1600)?621:1600;
  let gy2 = (gm>2)?(gy+1):gy;
  let days = (365*gy) + parseInt((gy2+3)/4) - parseInt((gy2+99)/100) + parseInt((gy2+399)/400) - 80 + gd + g_d_m[gm-1];
  jy += 33*parseInt(days/12053); days %= 12053;
  jy += 4*parseInt(days/1461); days %= 1461;
  if(days > 365){ jy += parseInt((days-1)/365); days = (days-1)%365; }
  let jm, jd;
  if(days < 186){ jm = 1 + parseInt(days/31); jd = 1 + (days%31); }
  else { jm = 7 + parseInt((days-186)/30); jd = 1 + ((days-186)%30); }
  return [jy, jm, jd];
}
function j2gISO(jy, jm, jd){
  jy = Number(jy); jm = Number(jm); jd = Number(jd);
  jy += 1595;
  let days = -355668 + (365*jy) + (parseInt(jy/33)*8) + parseInt((jy%33+3)/4) + jd + ((jm<7) ? (jm-1)*31 : ((jm-7)*30)+186);
  let gy = 400*parseInt(days/146097); days %= 146097;
  if(days > 36524){ days--; gy += 100*parseInt(days/36524); days %= 36524; if(days>=365) days++; }
  gy += 4*parseInt(days/1461); days %= 1461;
  if(days > 365){ gy += parseInt((days-1)/365); days = (days-1)%365; }
  let gd = days+1;
  const isLeap = (gy%4===0 && gy%100!==0) || (gy%400===0);
  const sal=[0,31,isLeap?29:28,31,30,31,30,31,31,30,31,30,31];
  let gm=0;
  for(gm=1; gm<=12; gm++){ if(gd<=sal[gm]) break; gd -= sal[gm]; }
  const pad = n=>String(n).padStart(2,'0');
  return `${gy}-${pad(gm)}-${pad(gd)}`;
}
function toJalali(gregStr){
  if(!gregStr) return '-';
  const [jy,jm,jd] = g2jParts(gregStr);
  return `${faDigits(jd)} ${AFG_MONTHS[jm-1]} ${faDigits(jy)}`;
}
function jalaliPicker(idPrefix, gregStr){
  const [jy,jm,jd] = g2jParts(gregStr || todayISO());
  let dayOpts=''; for(let d=1; d<=31; d++) dayOpts += `<option value="${d}" ${d===jd?'selected':''}>${faDigits(d)}</option>`;
  let monthOpts = AFG_MONTHS.map((m,i)=>`<option value="${i+1}" ${i+1===jm?'selected':''}>${m}</option>`).join('');
  let yearOpts=''; for(let y=jy-5; y<=jy+5; y++) yearOpts += `<option value="${y}" ${y===jy?'selected':''}>${faDigits(y)}</option>`;
  return `<div style="display:grid; grid-template-columns:0.8fr 1.4fr 1fr; gap:6px;" id="${idPrefix}-wrap">
    <select id="${idPrefix}-d">${dayOpts}</select>
    <select id="${idPrefix}-m">${monthOpts}</select>
    <select id="${idPrefix}-y">${yearOpts}</select>
  </div>`;
}
function jalaliPickerValue(idPrefix){
  const y = document.getElementById(idPrefix+'-y'), m = document.getElementById(idPrefix+'-m'), d = document.getElementById(idPrefix+'-d');
  if(!y||!m||!d) return todayISO();
  return j2gISO(y.value, m.value, d.value);
}

/* ---------------- Unique ID codes ---------------- */
function nextSeqForPrefix(list, prefix, field){
  let max = 0;
  list.forEach(x=>{
    const c = x[field];
    if(c && c.indexOf(prefix)===0){
      const seq = parseInt(c.slice(prefix.length), 10);
      if(!isNaN(seq) && seq>max) max = seq;
    }
  });
  return max+1;
}
function generateStudentCode(regDateISO){
  const [jy,jm] = g2jParts(regDateISO || todayISO());
  const prefix = `S${jy}${String(jm).padStart(2,'0')}`;
  const seq = nextSeqForPrefix(db.studentProfiles, prefix, 'code');
  return `${prefix}${String(seq).padStart(4,'0')}`;
}
function generatePersonnelCode(role, createdAtISO){
  const letter = role==='مدیریت' ? 'M' : role==='کارمند' ? 'E' : 'T';
  const [jy,jm] = g2jParts(createdAtISO || todayISO());
  const prefix = `${letter}${jy}${String(jm).padStart(2,'0')}`;
  const seq = nextSeqForPrefix(db.teachers, prefix, 'code');
  return `${prefix}${String(seq).padStart(4,'0')}`;
}
function generateShareholderCode(createdAtISO){
  const [jy,jm] = g2jParts(createdAtISO || todayISO());
  const prefix = `SH${jy}${String(jm).padStart(2,'0')}`;
  const seq = nextSeqForPrefix(db.shareholders, prefix, 'code');
  return `${prefix}${String(seq).padStart(4,'0')}`;
}
function generateUniquePassword(){
  const used = new Set([
    ...db.shareholders.map(s=>s.password),
    ...db.teachers.map(t=>t.password),
  ].filter(Boolean));
  let pwd;
  do { pwd = String(Math.floor(100000 + Math.random()*900000)); } while(used.has(pwd));
  return pwd;
}
function regeneratePersonnelPassword(teacherId){
  const t = db.teachers.find(x=>x.id===teacherId); if(!t) return;
  if(!confirm(`رمز عبور فعلی «${t.name}» غیرفعال شده و رمز جدیدی ساخته می‌شود. ادامه می‌دهید؟`)) return;
  t.password = generateUniquePassword();
  logAction('تولید رمز جدید', 'پرسنل', `${t.name} (${t.code})`);
  save();
  openTeacherProfileModal(teacherId);
}
function regenerateShareholderPassword(shId){
  const sh = db.shareholders.find(x=>x.id===shId); if(!sh) return;
  if(!confirm(`رمز عبور فعلی «${sh.name}» غیرفعال شده و رمز جدیدی ساخته می‌شود. ادامه می‌دهید؟`)) return;
  sh.password = generateUniquePassword();
  logAction('تولید رمز جدید', 'سهامدار', `${sh.name} (${sh.code})`);
  save();
  openShareholderProfileModal(shId);
}
function readImageAsDataURL(inputEl, onDone){
  const file = inputEl.files && inputEl.files[0]; if(!file) return;
  if(file.size > 4*1024*1024){ alert('حجم فایل زیاد است؛ لطفاً عکسی کوچک‌تر از ۴ مگابایت انتخاب کنید.'); return; }
  const reader = new FileReader();
  reader.onload = ()=> onDone(reader.result);
  reader.readAsDataURL(file);
}

/* ---------------- Access control (client-side gate · see settings note) ---------------- */
const ROLE_LABELS = { shareholder:'سهامدار', manager:'مدیر شعبه', teacher:'مدرس', employee:'کارمند' };
let currentRole = sessionStorage.getItem('hadaf_role') || '';
let currentTeacherId = sessionStorage.getItem('hadaf_teacher_id') || '';
let currentActorName = sessionStorage.getItem('hadaf_actor_name') || '';
function navAllowed(view){
  if(view==='myIncome') return currentRole==='teacher'; // personal income page — teachers only
  if(currentRole==='shareholder') return true;
  if(currentRole==='manager') return view!=='shareholders' && view!=='activityLog' && view!=='assets' && view!=='taxReport';
  if(currentRole==='teacher') return view==='classes' || view==='attendance' || view==='myIncome';
  if(currentRole==='employee') return view==='classes' || view==='students' || view==='seminars' || view==='books' || view==='discountCodes';
  return false;
}
function applyRoleVisibility(){
  document.querySelectorAll('.navbtn').forEach(b=>{
    b.style.display = navAllowed(b.dataset.view) ? '' : 'none';
  });
  document.querySelectorAll('.nav-group').forEach(grp=>{
    const visibleButtons = Array.from(grp.querySelectorAll('.navbtn')).some(b=>b.style.display !== 'none');
    grp.style.display = visibleButtons ? '' : 'none';
  });
  const badge = document.getElementById('role-badge');
  if(badge) badge.textContent = currentRole ? `${ROLE_LABELS[currentRole]} · ${currentActorName}` : 'وارد نشده';
  const sideRole = document.getElementById('sidebar-role-text');
  if(sideRole) sideRole.textContent = currentRole ? `${ROLE_LABELS[currentRole]} · ${currentActorName}` : 'ورود نشده';
}
function showAccessGate(){
  document.getElementById('access-gate').classList.add('active');
}
function hideAccessGate(){
  document.getElementById('access-gate').classList.remove('active');
}
function attemptLogin(role){
  const errEl = document.getElementById('gate-error-' + role);
  if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
  const pinInput = document.getElementById('gate-pin-' + role);
  const pin = pinInput ? pinInput.value.trim() : '';
  let actorName = '';
  let realPassword = '';

  const showError = (msg) => {
    if (errEl) {
      errEl.textContent = msg;
      errEl.style.display = 'block';
    }
  };

  if(role==='teacher'){
    const sel = document.getElementById('gate-teacher-select');
    const tid = sel ? sel.value : '';
    if(!tid){ showError('لطفاً نام خود را انتخاب کنید.'); return; }
    const t = db.teachers.find(x=>x.id===tid);
    if(!t) return;
    realPassword = t.password || '';
    if(pin !== realPassword){ showError('رمز عبور واردشده نادرست است.'); return; }
    currentTeacherId = tid;
    sessionStorage.setItem('hadaf_teacher_id', tid);
    actorName = t.name;
  } else if(role==='shareholder'){
    const sel = document.getElementById('gate-shareholder-select');
    const shid = sel ? sel.value : '';
    if(!shid){ showError('لطفاً نام خود را انتخاب کنید.'); return; }
    const sh = db.shareholders.find(x=>x.id===shid);
    if(!sh) return;
    realPassword = sh.password || '';
    if(pin !== realPassword){ showError('رمز عبور واردشده نادرست است.'); return; }
    actorName = sh.name;
  } else if(role==='manager'){
    const sel = document.getElementById('gate-manager-select');
    const mid = sel ? sel.value : '';
    if(!mid){ showError('لطفاً نام خود را انتخاب کنید.'); return; }
    const m = db.teachers.find(x=>x.id===mid);
    if(!m) return;
    realPassword = m.password || '';
    if(pin !== realPassword){ showError('رمز عبور واردشده نادرست است.'); return; }
    actorName = m.name;
  } else if(role==='employee'){
    const sel = document.getElementById('gate-employee-select');
    const eid = sel ? sel.value : '';
    if(!eid){ showError('لطفاً نام خود را انتخاب کنید.'); return; }
    const e = db.teachers.find(x=>x.id===eid);
    if(!e) return;
    realPassword = e.password || '';
    if(pin !== realPassword){ showError('رمز عبور واردشده نادرست است.'); return; }
    actorName = e.name;
  }
  currentRole = role;
  currentActorName = actorName;
  sessionStorage.setItem('hadaf_role', role);
  sessionStorage.setItem('hadaf_actor_name', actorName);
  logAction('ورود', 'نشست', `${ROLE_LABELS[role]} · ${actorName}`);
  hideAccessGate();
  applyRoleVisibility();

  // Navigate to hash view if valid for this role, else default role view
  const hash = window.location.hash.replace(/^#\/?/, '');
  const defaultView = role==='teacher' ? 'classes' : role==='employee' ? 'students' : 'dashboard';
  const targetView = (hash && VIEW_TITLES[hash] && navAllowed(hash)) ? hash : defaultView;
  switchView(targetView, true);
}

function logoutRole(){
  if(currentRole) logAction('خروج', 'نشست', `${ROLE_LABELS[currentRole]} · ${currentActorName}`);
  sessionStorage.removeItem('hadaf_role'); sessionStorage.removeItem('hadaf_teacher_id'); sessionStorage.removeItem('hadaf_actor_name');
  currentRole=''; currentTeacherId=''; currentActorName='';
  showAccessGate();
  renderQuickLoginCards();
  renderGateAllPasswords();
}

function renderQuickLoginCards() {
  const container = document.getElementById('gate-quick-list');
  if (!container) return;
  const cards = [];

  const sh = db.shareholders && db.shareholders[0];
  if (sh) {
    cards.push(`
      <div class="quick-login-card">
        <div class="quick-login-info">
          <b>${sh.name}</b>
          <span class="quick-login-code">سهامدار اصلی · رمز: <code>${sh.password || '4545'}</code></span>
        </div>
        <button type="button" class="btn small" onclick="quickLoginAs('shareholder', '${sh.id}', '${sh.password || '4545'}')">ورود آزمایشی</button>
      </div>
    `);
  }

  const mgr = db.teachers && db.teachers.find(t => t.role === 'مدیریت');
  if (mgr) {
    cards.push(`
      <div class="quick-login-card">
        <div class="quick-login-info">
          <b>${mgr.name}</b>
          <span class="quick-login-code">مدیر شعبه · رمز: <code>${mgr.password || '2026'}</code></span>
        </div>
        <button type="button" class="btn small secondary" onclick="quickLoginAs('manager', '${mgr.id}', '${mgr.password || '2026'}')">ورود آزمایشی</button>
      </div>
    `);
  }

  const tchr = db.teachers && db.teachers.find(t => t.role === 'مدرس');
  if (tchr) {
    cards.push(`
      <div class="quick-login-card">
        <div class="quick-login-info">
          <b>${tchr.name}</b>
          <span class="quick-login-code">مدرس · رمز: <code>${tchr.password || '1010'}</code></span>
        </div>
        <button type="button" class="btn small secondary" onclick="quickLoginAs('teacher', '${tchr.id}', '${tchr.password || '1010'}')">ورود آزمایشی</button>
      </div>
    `);
  }

  const emp = db.teachers && db.teachers.find(t => t.role === 'کارمند');
  if (emp) {
    cards.push(`
      <div class="quick-login-card">
        <div class="quick-login-info">
          <b>${emp.name}</b>
          <span class="quick-login-code">کارمند پذیرش · رمز: <code>${emp.password || '1234'}</code></span>
        </div>
        <button type="button" class="btn small secondary" onclick="quickLoginAs('employee', '${emp.id}', '${emp.password || '1234'}')">ورود آزمایشی</button>
      </div>
    `);
  }

  container.innerHTML = cards.join('');
}

function toggleGateDemoLogins() {
  const box = document.getElementById('gate-quick-list');
  const chevron = document.getElementById('gate-quick-chevron');
  if (!box) return;
  const isHidden = box.style.display === 'none';
  box.style.display = isHidden ? 'grid' : 'none';
  if (chevron) chevron.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
  if (isHidden) renderQuickLoginCards();
}

function quickLoginAs(role, id, password) {
  switchGateTab(role);
  const sel = document.getElementById('gate-' + role + '-select');
  if (sel) sel.value = id;
  const pinInput = document.getElementById('gate-pin-' + role);
  if (pinInput) pinInput.value = password;
  attemptLogin(role);
}

function renderGateAllPasswords(){
  const box = document.getElementById('gate-all-passwords');
  if(!box) return;
  const rows = [
    ...db.shareholders.map(sh=>`<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid var(--border-soft);"><span><b>${sh.name}</b> <small style="color:var(--text-dim);">(سهامدار · ${sh.code||'-'})</small></span> <code class="code-badge" style="cursor:default;">${sh.password||'-'}</code></div>`),
    ...db.teachers.map(t=>`<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid var(--border-soft);"><span><b>${t.name}</b> <small style="color:var(--text-dim);">(${t.role||'مدرس'} · ${t.code||'-'})</small></span> <code class="code-badge" style="cursor:default;">${t.password||'-'}</code></div>`),
  ];
  box.innerHTML = rows.length ? rows.join('') : '<div style="color:var(--text-dim); text-align:center;">هنوز کاربری ثبت نشده است.</div>';
}

function toggleGateAllPasswords(){
  const box = document.getElementById('gate-all-passwords');
  if(!box) return;
  const show = box.style.display==='none';
  box.style.display = show ? 'block' : 'none';
  if(show) renderGateAllPasswords();
}
function logAction(action, entityType, label){
  if(!db.activityLog) db.activityLog = [];
  db.activityLog.unshift({
    id: uid(), ts: new Date().toISOString(),
    role: currentRole || '(ورود نشده)', actor: currentActorName || ROLE_LABELS[currentRole] || 'ناشناس',
    action, entityType, label,
  });
  if(db.activityLog.length > 800) db.activityLog.length = 800;
}

/* ---------------- Navigation & History Routing ---------------- */
document.getElementById('nav').addEventListener('click', e=>{
  const btn = e.target.closest('.navbtn'); if(!btn) return;
  switchView(btn.dataset.view, true);
});

function switchView(name, updateHash = true){
  if(!navAllowed(name)) return;
  if(attendanceDirty && name!=='attendance') commitAttendanceSave(true);
  document.querySelectorAll('.navbtn').forEach(b=>b.classList.toggle('active', b.dataset.view===name));
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active', v.id==='view-'+name));
  
  const meta = VIEW_TITLES[name];
  const hTitle = document.getElementById('header-view-title');
  const hSub = document.getElementById('header-view-sub');
  if (hTitle && meta) hTitle.textContent = meta.title;
  if (hSub && meta) hSub.textContent = meta.sub;
  if (typeof toggleMobileNav === 'function') toggleMobileNav(false);

  // Update hash & browser history
  if (updateHash) {
    const targetHash = '#' + name;
    if (window.location.hash !== targetHash) {
      if (window.location.hash) {
        history.pushState({ view: name }, '', targetHash);
      } else {
        history.replaceState({ view: name }, '', targetHash);
      }
    }
  }

  if(name==='classes') renderClasses();
  if(name==='attendance') renderAttendanceClassOptions();
  if(name==='discountCodes' && typeof renderDiscountCodes==='function') renderDiscountCodes();
  if(name==='myIncome' && typeof renderMyIncome==='function') renderMyIncome();
  if(name==='assets' && typeof renderAssets==='function') renderAssets();
  if(name==='taxReport' && typeof renderTaxReport==='function') renderTaxReport();
}

// Handle Browser Back / Forward buttons & Hash navigation
window.addEventListener('popstate', (e) => {
  const overlay = document.getElementById('overlay');
  if (overlay && overlay.classList.contains('active')) {
    closeModal();
    return;
  }
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash && VIEW_TITLES[hash] && navAllowed(hash)) {
    switchView(hash, false);
  } else if (!hash && navAllowed('dashboard')) {
    switchView('dashboard', false);
  }
});

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash && VIEW_TITLES[hash] && navAllowed(hash)) {
    switchView(hash, false);
  }
});

/* ---------------- Modal engine ---------------- */
const overlay = document.getElementById('overlay');
const modalBody = document.getElementById('modal-body');
function openModal(html, opts){
  modalBody.innerHTML = html;
  modalBody.classList.toggle('wide', !!(opts && opts.wide));
  overlay.classList.add('active');
  try {
    history.pushState({ modalOpen: true }, '');
  } catch(e) {}
}
function closeModal(){
  overlay.classList.remove('active');
  modalBody.innerHTML='';
  modalBody.classList.remove('wide');
}
overlay.addEventListener('click', e=>{ if(e.target===overlay) closeModal(); });

/* ---------------- Computed helpers ---------------- */
const CLASS_CATEGORIES = ['جنرال انگلیسی (General English)','آیلتس (IELTS)','تافل (TOEFL)','مکالمه (Conversation)','کودکان و نوجوانان (Kids/Teens)','آماده‌سازی آزمون‌های زبان','سایر'];
const DONATION_METHODS = ['نقدی','سایر'];
const EXPENSE_CATEGORIES = ['حقوق و دستمزد مدرسان','اجارهٔ شعبه','قبض و خدمات (برق/آب/گاز/اینترنت)','لوازم آموزشی','تبلیغات و بازاریابی','پذیرایی','سایر'];
const PROJECT_CATEGORIES = ['کمپین تبلیغاتی','دورهٔ فشرده/کارگاه','آزمون آزمایشی (Mock Test)','مراسم فارغ‌التحصیلی','همکاری با نهاد دیگر','سایر'];
const BRANCHES = ['شعبه مرکزی','شعبه ۲','شعبه ۳'];
const FAMILY_DISCOUNT_PERCENT = 25;
const SEMINAR_TYPES = ['سمینار','وبینار','کارگاه'];
const SEMINAR_MODES = ['حضوری','آنلاین','حضوری و آنلاین'];
function seminarLocationOptionsHtml(selected){
  return categoryOptionsHtml([...BRANCHES,'آنلاین'], selected);
}

/* ---------------- Timeframes & Excel export ---------------- */
const TIMEFRAMES = [
  {key:'all', label:'همه'},
  {key:'daily', label:'روزانه'},
  {key:'weekly', label:'هفتگی'},
  {key:'monthly', label:'ماهانه'},
  {key:'quarterly', label:'فصلی'},
  {key:'biannual', label:'شش‌ماهه'},
  {key:'annual', label:'سالانه'},
];
function getRangeStart(key){
  const now = new Date(); const start = new Date(now);
  switch(key){
    case 'daily': start.setHours(0,0,0,0); return start;
    case 'weekly': start.setDate(now.getDate()-7); return start;
    case 'monthly': start.setMonth(now.getMonth()-1); return start;
    case 'quarterly': start.setMonth(now.getMonth()-3); return start;
    case 'biannual': start.setMonth(now.getMonth()-6); return start;
    case 'annual': start.setFullYear(now.getFullYear()-1); return start;
    default: return null;
  }
}
function inTimeframe(dateStr, key){
  const start = getRangeStart(key);
  if(!start) return true;
  if(!dateStr) return false;
  const d = new Date(dateStr+'T00:00:00');
  return d>=start && d<=new Date();
}
function filterByDate(list, field, key){
  if(key==='all'||!key) return list;
  return list.filter(item=>inTimeframe(item[field], key));
}
function exportControlHtml(category){
  return `<select id="exp-${category}-tf">${TIMEFRAMES.map(t=>`<option value="${t.key}">${t.label}</option>`).join('')}</select>
    <button class="btn ghost small" onclick="exportCategoryExcel('${category}')">خروجی اکسل</button>`;
}
function downloadWorkbookFromRows(rowsByCategory, filenamePrefix){
  if(typeof XLSX==='undefined'){ alert('کتابخانهٔ اکسل بارگذاری نشد. اتصال اینترنت را بررسی کنید.'); return; }
  const wb = XLSX.utils.book_new();
  Object.entries(rowsByCategory).forEach(([name, rows])=>{
    const ws = XLSX.utils.json_to_sheet(rows && rows.length ? rows : [{'-':'داده‌ای موجود نیست'}]);
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0,31));
  });
  XLSX.writeFile(wb, `${filenamePrefix}-${todayISO()}.xlsx`);
}
function classesToRows(list){
  return list.map(c=>({
    'نام صنف': c.name||c.category, 'شعبه': c.branch||'', 'دسته': c.category, 'مدرس': teacherName(c.teacherId),
    'شیوه': c.mode||'', 'ساعت': classTimeLabel(c), 'تاریخ آغاز': toJalali(c.startDate), 'تاریخ پایان': c.endDate?toJalali(c.endDate):'نامشخص',
    'ظرفیت': c.capacity||'', 'تعداد ثبت‌نامی': classEnrolledCount(c.id), 'وضعیت': classStatus(c),
    'پیشرفت (%)': c.progress||0, 'مکان': c.location||'', 'توضیحات': c.note||'',
  }));
}
function studentsToRows(list){
  return list.map(s=>({
    'کد شاگرد': profileCode(s.profileId), 'نام شاگرد': profileName(s.profileId), 'پایه/سن': profileGrade(s.profileId),
    'نام سرپرست': profileGuardianName(s.profileId), 'تماس سرپرست': profileGuardianPhone(s.profileId),
    'صنف': className(s.classId), 'شعبه': classBranch(s.classId), 'تاریخ ثبت‌نام': toJalali(s.registerDate), 'شهریه (افغانی)': s.feeAmount||0,
    'درصد تخفیف دستی': s.discountPercent||0, 'درصد تخفیف معرفی': s.referralDiscountPercent||0, 'درصد تخفیف خانوادگی': s.familyDiscountPercent||0,
    'کد تخفیف مکتب': s.schoolCode||'', 'درصد تخفیف کد مکتب': s.schoolCodeDiscountPercent||0,
    'کد معرف': s.referredBy?profileCode(s.referredBy):'', 'شهریهٔ نهایی (افغانی)': studentNetFee(s),
    'پرداخت‌شده (افغانی)': s.paidAmount||0, 'باقیمانده (افغانی)': studentRemaining(s), 'وضعیت': studentStatus(s),
    'کتاب': s.bookTitle||'', 'قیمت کتاب (افغانی)': s.bookPrice||0, 'کتاب پرداخت‌شده': s.bookPaid?'بله':'خیر',
    'قیمت کارت شاگردی (افغانی)': s.idCardPrice||0, 'کارت پرداخت‌شده': s.idCardPaid?'بله':'خیر',
    'نمرهٔ فعالیت صنفی': s.activityScore===''?'':s.activityScore, 'نمرهٔ امتحان': s.examScore===''?'':s.examScore,
    'نتیجه': s.result||'در حال آموزش', 'توضیحات': s.note||'',
  }));
}
function teachersToRows(list){
  const now = new Date(); const y = now.getFullYear(), m = now.getMonth();
  return list.map(t=>{
    const classes = teacherClassesList(t.id);
    const pf = teacherPassFailStats(t.id);
    return { 'کد': t.code||'', 'نام': t.name, 'نقش': t.role||'', 'شماره تماس': t.phone||'', 'مضامین': t.subjects||'',
      'آغاز قرارداد': t.contractStart?toJalali(t.contractStart):'', 'پایان قرارداد': t.contractEnd?toJalali(t.contractEnd):'نامشخص',
      'نوع پرداخت': t.payType||'', 'مبلغ (افغانی)': t.payAmount||0,
      'تعداد صنف‌ها': classes.length, 'صنف‌های تدریسی': classes.map(c=>c.name||c.category).join('، ')||'-',
      'صنف‌های این ماه': t.payType==='ماهانه ثابت' ? '' : teacherClassCountInMonth(t.id,y,m),
      'حقوق ناخالص این ماه (افغانی)': teacherGrossSalary(t,y,m), 'مانده پیش‌پرداخت (افغانی)': teacherAdvanceBalance(t.id),
      'خالص قابل پرداخت این ماه (افغانی)': teacherNetSalary(t,y,m),
      'نرخ کامیابی (٪)': pf.rate===null?'': pf.rate, 'توضیحات': t.note||'' };
  });
}
function donationsToRows(list){
  return list.map(d=>({ 'منبع درآمد': d.donorName, 'مبلغ (افغانی)': d.amount||0, 'درصد تخفیف': d.discountPercent||0, 'مبلغ نهایی (افغانی)': netAfterDiscount(d.amount, d.discountPercent), 'تاریخ': toJalali(d.date), 'روش': d.method, 'توضیحات': d.note||'' }));
}
function seminarsToRows(list){
  return list.map(s=>({
    'عنوان': s.title, 'نوع': s.type, 'شیوه': s.mode||'', 'شعبه/مکان': s.location||'',
    'ارائه‌دهنده': teacherName(s.speakerId), 'تاریخ': toJalali(s.date), 'وضعیت': s.isPaid?'پولی':'رایگان',
    'هزینهٔ ثبت‌نام (افغانی)': s.fee||0, 'درصد تخفیف': s.discountPercent||0, 'هزینهٔ نهایی (افغانی)': seminarNetFee(s),
    'تعداد شرکت‌کننده': s.attendeeCount||0, 'درآمد تخمینی (افغانی)': seminarRevenue(s), 'توضیحات': s.note||'',
  }));
}
function teacherAdvancesToRows(list){
  return list.map(a=>({ 'مدرس': teacherName(a.teacherId), 'مبلغ (افغانی)': a.amount||0, 'تاریخ': toJalali(a.date), 'وضعیت': a.settled?'تسویه‌شده':'باز', 'توضیحات': a.note||'' }));
}
function expensesToRows(list){
  return list.map(e=>({ 'شعبه': e.branch||'', 'دسته': e.category, 'مبلغ (افغانی)': e.amount||0, 'تاریخ': toJalali(e.date), 'توضیحات': e.note||'' }));
}
function projectsToRows(list){
  return list.map(p=>({
    'نام پروژه': p.name, 'دسته': p.category, 'مسئول': p.lead||'', 'تاریخ آغاز': toJalali(p.startDate),
    'تاریخ پایان': p.endDate?toJalali(p.endDate):'نامشخص', 'وضعیت': classStatus(p), 'پیشرفت (%)': p.progress||0, 'توضیحات': p.note||'',
  }));
}
function meetingsToRows(list){
  return list.map(m=>({
    'تاریخ جلسه': toJalali(m.date), 'حاضرین': m.attendees||'', 'یادداشت‌ها/صورت‌جلسه': m.notes||'',
    'تعداد کارها': (m.tasks||[]).length, 'کارهای انجام‌شده': (m.tasks||[]).filter(t=>t.done).length,
  }));
}
function exportCategoryExcel(category){
  const tfEl = document.getElementById(`exp-${category}-tf`);
  const tf = tfEl ? tfEl.value : 'all';
  const map = {
    classes: ()=>({sheet:'صنف‌ها', rows: classesToRows(filterByDate(db.classes,'startDate',tf))}),
    students: ()=>({sheet:'شاگردها', rows: studentsToRows(filterByDate(db.students,'registerDate',tf))}),
    teachers: ()=>({sheet:'مدرسان', rows: teachersToRows(filterByDate(db.teachers,'createdAt',tf))}),
    donations: ()=>({sheet:'سایر درآمدها', rows: donationsToRows(filterByDate(db.donations,'date',tf))}),
    expenses: ()=>({sheet:'هزینه‌ها', rows: expensesToRows(filterByDate(db.expenses,'date',tf))}),
    projects: ()=>({sheet:'پروژه‌ها', rows: projectsToRows(filterByDate(db.projects,'startDate',tf))}),
    meetings: ()=>({sheet:'جلسات هفتگی', rows: meetingsToRows(filterByDate(db.meetings,'date',tf))}),
    seminars: ()=>({sheet:'سمینار-وبینار-کارگاه', rows: seminarsToRows(filterByDate(db.seminars,'date',tf))}),
    teacherAdvances: ()=>({sheet:'پیش‌پرداخت مدرسان', rows: teacherAdvancesToRows(filterByDate(db.teacherAdvances,'date',tf))}),
    bookPurchases: ()=>({sheet:'خرید کتاب', rows: bookPurchasesToRows(filterByDate(db.bookPurchases,'date',tf))}),
    shareholders: ()=>({sheet:'سهامداران', rows: shareholdersToRows(db.shareholders)}),
  };
  if(!map[category]) return;
  const { sheet, rows } = map[category]();
  downloadWorkbookFromRows({ [sheet]: rows }, `hadaf-${category}`);
}
function exportFullReportExcel(){
  const tf = reportRange;
  downloadWorkbookFromRows({
    'صنف‌ها': classesToRows(filterByDate(db.classes,'startDate',tf)),
    'شاگردها': studentsToRows(filterByDate(db.students,'registerDate',tf)),
    'مدرسان': teachersToRows(db.teachers),
    'سایر درآمدها': donationsToRows(filterByDate(db.donations,'date',tf)),
    'هزینه‌ها': expensesToRows(filterByDate(db.expenses,'date',tf)),
    'پروژه‌ها': projectsToRows(filterByDate(db.projects,'startDate',tf)),
    'جلسات هفتگی': meetingsToRows(filterByDate(db.meetings,'date',tf)),
    'سمینار-وبینار-کارگاه': seminarsToRows(filterByDate(db.seminars,'date',tf)),
    'پیش‌پرداخت مدرسان': teacherAdvancesToRows(filterByDate(db.teacherAdvances,'date',tf)),
    'خرید کتاب': bookPurchasesToRows(filterByDate(db.bookPurchases,'date',tf)),
  }, 'hadaf-full-report');
}
function renderExportBars(){
  ['classes','students','teachers','donations','expenses','projects','meetings','seminars','teacherAdvances','bookPurchases','shareholders'].forEach(cat=>{
    const el = document.getElementById('export-'+cat);
    if(el) el.innerHTML = exportControlHtml(cat);
  });
}

/* ---------------- Progress tracking (classes & projects) ---------------- */
function openProgressModal(entityType, id){
  const list = entityType==='class' ? db.classes : db.projects;
  const item = list.find(x=>x.id===id);
  if(!item) return;
  if(!item.progressLog) item.progressLog = [];
  const label = entityType==='class' ? (item.name||item.category) : item.name;
  openModal(`
    <h3>پیشرفت · ${label}</h3>
    <div class="field">
      <label>درصد پیشرفت فعلی: <b style="color:var(--gold-soft);">${faDigits(item.progress||0)}٪</b></label>
      <input id="f-prog-pct" type="range" min="0" max="100" step="5" value="${item.progress||0}" style="width:100%;" oninput="document.getElementById('f-prog-pct-label').textContent=faDigits(this.value)+'٪'">
      <div class="hint">مقدار جدید: <span id="f-prog-pct-label">${faDigits(item.progress||0)}٪</span></div>
    </div>
    <div class="sectiontitle">افزودن یادداشت پیشرفت</div>
    <div class="field"><label>یادداشت (اختیاری)</label><input id="f-prog-note" placeholder="مثلاً: هفتهٔ سوم درس تمام شد"></div>
    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">انصراف</button>
      <button class="btn" onclick="saveProgress('${entityType}','${id}')">ثبت پیشرفت</button>
    </div>
    <div class="sectiontitle">تاریخچهٔ پیشرفت</div>
    <div id="prog-log-list">
      ${item.progressLog.length ? item.progressLog.map(l=>`<div class="log-item"><div class="log-date">${toJalali(l.date)} · ${faDigits(l.pct)}٪</div>${l.note||''}</div>`).join('') : '<div class="empty">هنوز یادداشتی ثبت نشده.</div>'}
    </div>
  `);
}
function saveProgress(entityType, id){
  const list = entityType==='class' ? db.classes : db.projects;
  const item = list.find(x=>x.id===id);
  if(!item) return;
  const pct = Number(document.getElementById('f-prog-pct').value)||0;
  const note = document.getElementById('f-prog-note').value.trim();
  item.progress = pct;
  if(!item.progressLog) item.progressLog = [];
  item.progressLog.unshift({ date: todayISO(), pct, note });
  closeModal(); save();
}
function progressBarHtml(pct){
  pct = Math.max(0, Math.min(100, Number(pct)||0));
  return `<div class="progress-cell"><div class="progress-outer"><div class="progress-inner" style="width:${pct}%;"></div></div><span class="progress-pct">${faDigits(pct)}٪</span></div>`;
}

function classEnrolledCount(classId){ return db.students.filter(s=>s.classId===classId).length; }
function formatTimeAmPm(t){
  if(!t) return '';
  const parts = t.split(':').map(Number);
  const h = parts[0], m = parts[1]||0;
  const period = h<12 ? 'صبح' : 'عصر';
  let h12 = h%12; if(h12===0) h12=12;
  return `${faDigits(h12)}:${faDigits(String(m).padStart(2,'0'))} ${period}`;
}
function classTimeLabel(c){
  if(!c.startTime && !c.endTime) return '-';
  if(c.startTime && c.endTime) return `${formatTimeAmPm(c.startTime)} تا ${formatTimeAmPm(c.endTime)}`;
  return formatTimeAmPm(c.startTime||c.endTime);
}
function classStatus(cls){
  const today = todayISO();
  if(cls.endDate && today>cls.endDate) return 'پایان‌یافته';
  if(cls.startDate && today<cls.startDate) return 'آینده';
  return 'در حال برگزاری';
}
function classStatusTagClass(st){
  if(st==='پایان‌یافته') return 'cost';
  if(st==='آینده') return 'info';
  return 'income';
}
/* Progress driven by elapsed time: start→end is 0→100%.
   Each course runs ~one month (26 sessions); if no end date, assume start + 1 month.
   Finished class → 100%, not-yet-started → 0%. */
function classTimeProgress(c){
  if(!c || !c.startDate) return 0;
  const start = new Date(c.startDate+'T00:00:00');
  if(isNaN(start.getTime())) return 0;
  let end;
  if(c.endDate){ end = new Date(c.endDate+'T00:00:00'); }
  else { end = new Date(start.getTime()); end.setMonth(end.getMonth()+1); }
  const now = new Date(); now.setHours(0,0,0,0);
  if(now <= start) return 0;
  if(now >= end) return 100;
  return Math.max(0, Math.min(100, Math.round((now - start) / (end - start) * 100)));
}
function teacherName(id){ const t = db.teachers.find(x=>x.id===id); return t?t.name:'-'; }
function teacherClassesList(id){ return db.classes.filter(c=>c.teacherId===id); }
function className(id){ const c = db.classes.find(x=>x.id===id); return c?(c.name||c.category):'-'; }
function classBranch(id){ const c = db.classes.find(x=>x.id===id); return c?(c.branch||'-'):'-'; }

/* ---------------- Student profile helpers ---------------- */
function profileById(id){ return db.studentProfiles.find(x=>x.id===id); }
function profileName(id){ const p = profileById(id); return p ? p.name : 'بدون‌نام'; }
function profileCode(id){ const p = profileById(id); return p ? p.code : '-'; }
function profileGrade(id){ const p = profileById(id); return p ? (p.grade||'') : ''; }
function profileGuardianName(id){ const p = profileById(id); return p ? (p.guardianName||'') : ''; }
function profileGuardianPhone(id){ const p = profileById(id); return p ? (p.guardianPhone||'') : ''; }
function profileEnrollments(profileId){ return db.students.filter(s=>s.profileId===profileId); }

function familyDiscountCheck(familyId, registerDateISO){
  if(!familyId) return 0;
  const [jy,jm] = g2jParts(registerDateISO);
  const sameMonthCount = db.students.filter(s=>{
    const prof = profileById(s.profileId);
    if(!prof || (prof.familyId||'').trim()!==familyId.trim()) return false;
    const [sy,sm] = g2jParts(s.registerDate);
    return sy===jy && sm===jm;
  }).length;
  return sameMonthCount>=2 ? FAMILY_DISCOUNT_PERCENT : 0;
}
function studentTotalDiscountPercent(s){
  const total = (Number(s.discountPercent)||0) + (Number(s.referralDiscountPercent)||0) + (Number(s.familyDiscountPercent)||0) + (Number(s.schoolCodeDiscountPercent)||0);
  return Math.min(100, total);
}
function studentNetFee(s){ return netAfterDiscount(s.feeAmount, studentTotalDiscountPercent(s)); }
function studentRemaining(s){ return studentNetFee(s) - (Number(s.paidAmount)||0); }
function studentStatus(s){
  const fee = studentNetFee(s);
  const paid = Number(s.paidAmount)||0;
  if(fee<=0) return 'رایگان';
  if(paid>=fee) return 'پرداخت‌شده';
  if(paid>0) return 'پرداخت جزئی';
  return 'پرداخت‌نشده';
}
function studentStatusTagClass(st){
  if(st==='پرداخت‌شده') return 'income';
  if(st==='پایان‌یافته') return 'cost';
  if(st==='پرداخت‌نشده') return 'cost';
  return 'info';
}

/* ---------------- CLASS modal ---------------- */
function classOptionsHtml(selectedId){
  if(!db.classes.length) return '<option value="">ابتدا یک صنف بسازید</option>';
  return '<option value="">انتخاب کنید</option>' + db.classes.map(c=>
    `<option value="${c.id}" ${c.id===selectedId?'selected':''}>${c.name||c.category} · ${c.branch||'-'}${c.startTime?' · '+classTimeLabel(c):''} (${classStatus(c)})</option>`
  ).join('');
}
function teacherOptionsHtml(selectedId){
  return '<option value="">بدون مدرس مشخص</option>' + db.teachers.map(t=>
    `<option value="${t.id}" ${t.id===selectedId?'selected':''}>${t.name}</option>`
  ).join('');
}
function categoryOptionsHtml(list, selected){
  return list.map(c=>`<option value="${c}" ${c===selected?'selected':''}>${c}</option>`).join('');
}
function openClassModal(id){
  const c = id ? db.classes.find(x=>x.id===id) : null;
  openModal(`
    <h3>${c?'ویرایش صنف':'صنف جدید'}</h3>
    <p class="sub">نوع فعالیت، مدرس، تاریخ آغاز/پایان و ظرفیت صنف را وارد کنید</p>

    <div class="field-row">
      <div class="field"><label>شعبه</label><select id="f-cls-branch">${categoryOptionsHtml(BRANCHES, c?c.branch:BRANCHES[0])}</select></div>
      <div class="field"><label>دسته</label><select id="f-cls-category">${categoryOptionsHtml(CLASS_CATEGORIES, c?c.category:CLASS_CATEGORIES[0])}</select></div>
    </div>
    <div class="field"><label>نام صنف (اختیاری)</label><input id="f-cls-name" value="${c?c.name||'':''}" placeholder="مثلاً: جنرال انگلیسی - سطح مبتدی"></div>
    <div class="field"><label>مدرس</label>
      <div style="display:flex; gap:6px;">
        <select id="f-cls-teacher" style="flex:1;">${teacherOptionsHtml(c?c.teacherId:'')}</select>
        <button type="button" class="btn ghost small" onclick="quickAddTeacher()">+ مدرس</button>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>شیوهٔ برگزاری</label><select id="f-cls-mode">
        <option value="حضوری" ${c&&c.mode==='حضوری'?'selected':''}>حضوری</option>
        <option value="آنلاین" ${c&&c.mode==='آنلاین'?'selected':''}>آنلاین</option>
        <option value="حضوری و آنلاین" ${c&&c.mode==='حضوری و آنلاین'?'selected':''}>حضوری و آنلاین</option>
      </select></div>
      <div class="field"><label>ظرفیت (اختیاری)</label><input id="f-cls-capacity" type="number" min="0" value="${c&&c.capacity?c.capacity:''}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>ساعت آغاز</label><input id="f-cls-start-time" type="time" value="${c?c.startTime||'':''}"></div>
      <div class="field"><label>ساعت پایان</label><input id="f-cls-end-time" type="time" value="${c?c.endTime||'':''}"></div>
    </div>
    <div class="field"><label>تاریخ آغاز</label>${jalaliPicker('f-cls-start', c?c.startDate:null)}</div>
    <div class="field">
      <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
        <input type="checkbox" id="f-cls-has-end" style="width:auto;" ${c&&c.endDate?'checked':''} onchange="document.getElementById('f-cls-end-container').style.display=this.checked?'block':'none';">
        تاریخ پایان مشخص است
      </label>
      <div id="f-cls-end-container" style="margin-top:8px; ${c&&c.endDate?'':'display:none;'}">
        ${jalaliPicker('f-cls-end', c?c.endDate:null)}
      </div>
    </div>
    <div class="field"><label>سالن/اتاق (اختیاری)</label><input id="f-cls-location" value="${c?c.location||'':''}" placeholder="مثلاً: اتاق ۲"></div>
    <div class="field"><label>توضیحات</label><input id="f-cls-note" value="${c?c.note||'':''}"></div>
    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">انصراف</button>
      <button class="btn" onclick="saveClass(${c?`'${c.id}'`:'null'})">ذخیره</button>
    </div>
  `);
}
function quickAddTeacher(){
  const name = prompt('نام مدرس جدید را وارد کنید:');
  if(!name || !name.trim()) return;
  const rec = { id:uid(), name:name.trim(), phone:'', subjects:'', note:'' };
  db.teachers.unshift(rec);
  save();
  const sel = document.getElementById('f-cls-teacher');
  if(sel){
    const opt = document.createElement('option');
    opt.value = rec.id; opt.textContent = rec.name;
    sel.appendChild(opt);
    sel.value = rec.id;
  }
}
function saveClass(id){
  const hasEnd = document.getElementById('f-cls-has-end').checked;
  const rec = {
    id: id || uid(),
    branch: document.getElementById('f-cls-branch').value,
    category: document.getElementById('f-cls-category').value,
    name: document.getElementById('f-cls-name').value.trim(),
    teacherId: document.getElementById('f-cls-teacher').value,
    mode: document.getElementById('f-cls-mode').value,
    capacity: Number(document.getElementById('f-cls-capacity').value)||0,
    startTime: document.getElementById('f-cls-start-time').value,
    endTime: document.getElementById('f-cls-end-time').value,
    startDate: jalaliPickerValue('f-cls-start'),
    endDate: hasEnd ? jalaliPickerValue('f-cls-end') : '',
    location: document.getElementById('f-cls-location').value.trim(),
    note: document.getElementById('f-cls-note').value.trim(),
  };
  if(id){ const idx = db.classes.findIndex(x=>x.id===id); db.classes[idx]=rec; }
  else { db.classes.unshift(rec); }
  logAction(id?'ویرایش':'ایجاد', 'صنف', rec.name||rec.category);
  closeModal(); save();
}
function deleteClass(id){
  if(db.students.some(s=>s.classId===id)){
    if(!confirm('شاگردهایی به این صنف ثبت‌نام شده‌اند. حذف صنف، آن‌ها را بدون صنف باقی می‌گذارد. ادامه می‌دهید؟')) return;
  } else if(!confirm('این صنف حذف شود؟')) return;
  const it = db.classes.find(x=>x.id===id);
  db.classes = db.classes.filter(x=>x.id!==id);
  logAction('حذف', 'صنف', it?(it.name||it.category):'');
  save();
}

/* ---------------- SEMINAR / WEBINAR / WORKSHOP modal ---------------- */
function netAfterDiscount(amount, discountPercent){
  const amt = Number(amount)||0;
  const disc = Math.min(100, Math.max(0, Number(discountPercent)||0));
  return Math.round(amt * (1 - disc/100));
}
function updateSeminarCalc(){
  const fee = moneyNum('f-sem-fee');
  const disc = Number(document.getElementById('f-sem-discount').value)||0;
  const el = document.getElementById('f-sem-net-display');
  if(el) el.textContent = afn(netAfterDiscount(fee, disc));
}
function toggleSeminarFeeFields(isPaid){
  document.getElementById('f-sem-fee-container').style.display = isPaid ? 'block' : 'none';
}
function openSeminarModal(id){
  const s = id ? db.seminars.find(x=>x.id===id) : null;
  const isPaid = s ? !!s.isPaid : false;
  openModal(`
    <h3>${s?'ویرایش رویداد':'رویداد جدید'}</h3>
    <p class="sub">تصمیم می‌گیرید که این رویداد پولی باشد یا رایگان؛ محاسبهٔ تخفیف به‌صورت خودکار انجام می‌شود</p>
    <div class="field"><label>عنوان</label><input id="f-sem-title" value="${s?s.title||'':''}" placeholder="مثلاً: کارگاه آمادگی آیلتس"></div>
    <div class="field-row">
      <div class="field"><label>نوع</label><select id="f-sem-type">${categoryOptionsHtml(SEMINAR_TYPES, s?s.type:SEMINAR_TYPES[0])}</select></div>
      <div class="field"><label>شیوه</label><select id="f-sem-mode">${categoryOptionsHtml(SEMINAR_MODES, s?s.mode:SEMINAR_MODES[0])}</select></div>
    </div>
    <div class="field-row">
      <div class="field"><label>شعبه/مکان</label><select id="f-sem-location">${seminarLocationOptionsHtml(s?s.location:BRANCHES[0])}</select></div>
      <div class="field"><label>ارائه‌دهنده</label>
        <div style="display:flex; gap:6px;">
          <select id="f-sem-speaker" style="flex:1;">${teacherOptionsHtml(s?s.speakerId:'')}</select>
          <button type="button" class="btn ghost small" onclick="quickAddTeacher()">+ مدرس</button>
        </div>
      </div>
    </div>
    <div class="field"><label>تاریخ برگزاری</label>${jalaliPicker('f-sem-date', s?s.date:null)}</div>
    <div class="field"><label>تعداد شرکت‌کننده (اختیاری)</label><input id="f-sem-count" type="number" min="0" value="${s&&s.attendeeCount?s.attendeeCount:''}"></div>

    <div class="sectiontitle">هزینهٔ ثبت‌نام</div>
    <div class="field">
      <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
        <input type="checkbox" id="f-sem-ispaid" style="width:auto;" ${isPaid?'checked':''} onchange="toggleSeminarFeeFields(this.checked)">
        این رویداد پولی است (در غیر این صورت رایگان خواهد بود)
      </label>
    </div>
    <div id="f-sem-fee-container" style="${isPaid?'':'display:none;'}">
      <div class="field-row">
        <div class="field"><label>هزینهٔ ثبت‌نام (افغانی)</label><input id="f-sem-fee" class="money-input" value="${s&&s.fee?numFmt(s.fee):''}" oninput="formatMoneyInput(this); updateSeminarCalc();" placeholder="۰"></div>
        <div class="field"><label>درصد تخفیف</label><input id="f-sem-discount" type="number" min="0" max="100" value="${s&&s.discountPercent?s.discountPercent:0}" oninput="updateSeminarCalc()"></div>
      </div>
      <div class="calc-box"><span>هزینهٔ نهایی بعد از تخفیف (هر نفر)</span><b id="f-sem-net-display">${afn(netAfterDiscount(s?s.fee:0, s?s.discountPercent:0))}</b></div>
    </div>
    <div class="field"><label>توضیحات</label><input id="f-sem-note" value="${s?s.note||'':''}"></div>
    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">انصراف</button>
      <button class="btn" onclick="saveSeminar(${s?`'${s.id}'`:'null'})">ذخیره</button>
    </div>
  `);
}
function saveSeminar(id){
  const isPaid = document.getElementById('f-sem-ispaid').checked;
  const rec = {
    id: id || uid(),
    title: document.getElementById('f-sem-title').value.trim() || 'بدون‌عنوان',
    type: document.getElementById('f-sem-type').value,
    mode: document.getElementById('f-sem-mode').value,
    location: document.getElementById('f-sem-location').value,
    speakerId: document.getElementById('f-sem-speaker').value,
    date: jalaliPickerValue('f-sem-date'),
    attendeeCount: Number(document.getElementById('f-sem-count').value)||0,
    isPaid,
    fee: isPaid ? moneyNum('f-sem-fee') : 0,
    discountPercent: isPaid ? (Number(document.getElementById('f-sem-discount').value)||0) : 0,
    note: document.getElementById('f-sem-note').value.trim(),
  };
  if(id){ const idx = db.seminars.findIndex(x=>x.id===id); db.seminars[idx]=rec; }
  else { db.seminars.unshift(rec); }
  logAction(id?'ویرایش':'ایجاد', 'رویداد', rec.title);
  closeModal(); save();
}
function deleteSeminar(id){ if(!confirm('این رویداد حذف شود؟')) return; const it=db.seminars.find(x=>x.id===id); db.seminars = db.seminars.filter(x=>x.id!==id); logAction('حذف','رویداد',it?it.title:''); save(); }
function seminarNetFee(sem){ return sem.isPaid ? netAfterDiscount(sem.fee, sem.discountPercent) : 0; }
function seminarRevenue(sem){ return seminarNetFee(sem) * (Number(sem.attendeeCount)||0); }

/* ---------------- STUDENT modal ---------------- */
const RESULT_OPTIONS = ['', 'کامیاب', 'کامیاب مشروط', 'ناکام'];
function resultTagClass(result){
  if(result==='کامیاب') return 'income';
  if(result==='ناکام') return 'cost';
  if(result==='کامیاب مشروط') return 'info';
  return 'info';
}
function resultOptionsHtml(selected){
  return RESULT_OPTIONS.map(r=>`<option value="${r}" ${r===(selected||'')?'selected':''}>${r||'در حال آموزش'}</option>`).join('');
}
let pendingStudentPhoto = '';
let pendingStudentIdPhoto = '';
function setPendingStudentImage(inputEl, field, previewId){
  readImageAsDataURL(inputEl, url=>{
    if(field==='photo') pendingStudentPhoto = url; else pendingStudentIdPhoto = url;
    const img = document.getElementById(previewId);
    if(img){ img.src = url; img.style.display = 'block'; }
  });
}
function openStudentModal(id){
  const s = id ? db.students.find(x=>x.id===id) : null;
  const p = s ? profileById(s.profileId) : null;
  if(!s){ pendingStudentPhoto = ''; pendingStudentIdPhoto = ''; }
  openModal(`
    <h3>${s?'ویرایش ثبت‌نام':'ثبت‌نام جدید'}</h3>
    <p class="sub">اطلاعات شاگرد، صنف و وضعیت شهریه را وارد کنید</p>

    <div class="sectiontitle">مشخصات شاگرد</div>
    ${s ? `
      <div class="field"><label>شاگرد</label>
        <input disabled value="${p?p.code+' · '+p.name:'-'}" style="opacity:.75;">
      </div>
      <p class="hint" style="margin:-4px 0 12px; font-size:11px; color:var(--text-faint);">برای ویرایش مشخصات این شاگرد، روی کد او در جدول کلیک کنید و از صفحهٔ پروندهٔ او اقدام نمایید.</p>
    ` : `
      <div class="field">
        <label>جستجوی شاگرد موجود (اختیاری · برای ثبت‌نام در صنف جدید)</label>
        <input id="f-st-profile-search" list="dl-profiles" placeholder="کد یا نام را تایپ کنید، یا برای شاگرد جدید خالی بگذارید" oninput="onProfileSearchInput()">
        <datalist id="dl-profiles">
          ${db.studentProfiles.map(pr=>`<option value="${pr.code} · ${pr.name}">`).join('')}
        </datalist>
      </div>
      <input type="hidden" id="f-st-profile-id" value="">
      <div class="field-row">
        <div class="field"><label>نام شاگرد</label><input id="f-st-name" value=""></div>
        <div class="field"><label>پایه/سن</label><input id="f-st-grade" value="" placeholder="مثلاً: صنف سوم یا ۷ ساله"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>نام سرپرست</label><input id="f-st-guardian" value=""></div>
        <div class="field"><label>شماره تماس سرپرست</label><input id="f-st-phone" value=""></div>
      </div>
      <div class="profile-grid" id="f-st-upload-wrap">
        <div class="upload-box">
          <label>عکس شاگرد (اختیاری)</label>
          <img id="f-st-photo-preview" style="display:none;">
          <input type="file" accept="image/*" onchange="setPendingStudentImage(this,'photo','f-st-photo-preview')">
        </div>
        <div class="upload-box">
          <label>عکس سند هویت (اختیاری)</label>
          <img id="f-st-idphoto-preview" style="display:none;">
          <input type="file" accept="image/*" onchange="setPendingStudentImage(this,'idPhoto','f-st-idphoto-preview')">
        </div>
      </div>
      <p class="hint" style="margin:8px 0 12px; font-size:11px; color:var(--text-faint);">این عکس‌ها فقط برای شاگرد جدید هستند؛ اگر از فهرست بالا شاگرد موجود را انتخاب کنید، عکس‌های او از صفحهٔ پروندهٔ همان شاگرد قابل ویرایش است.</p>
    `}

    <div class="sectiontitle">صنف و ثبت‌نام</div>
    <div class="field"><label>صنف</label><select id="f-st-class">${classOptionsHtml(s?s.classId:'')}</select></div>
    <div class="field"><label>تاریخ ثبت‌نام</label>${jalaliPicker('f-st-date', s?s.registerDate:null)}</div>

    <div class="sectiontitle">شهریه</div>
    <div class="field-row">
      <div class="field"><label>مبلغ شهریه (۰ برای رایگان)</label><input id="f-st-fee" class="money-input" value="${s&&s.feeAmount?numFmt(s.feeAmount):''}" oninput="formatMoneyInput(this); updateStudentCalc();" placeholder="۰"></div>
      <div class="field"><label>درصد تخفیف دستی</label><input id="f-st-discount" type="number" min="0" max="100" value="${s&&s.discountPercent?s.discountPercent:0}" oninput="updateStudentCalc()"></div>
    </div>
    <div class="calc-box"><span>شهریهٔ نهایی (فقط تخفیف دستی · تخفیف معرفی/خانوادگی پس از ذخیره افزوده می‌شود)</span><b id="f-st-net-display">${afn(netAfterDiscount(s?s.feeAmount:0, s?s.discountPercent:0))}</b></div>
    <div class="field" style="margin-top:12px;"><label>مبلغ پرداخت‌شده</label><input id="f-st-paid" class="money-input" value="${s&&s.paidAmount?numFmt(s.paidAmount):''}" oninput="formatMoneyInput(this)" placeholder="۰"></div>
    ${!s ? `
      <div class="field"><label>کد تخفیف مکتب (اختیاری)</label>
        <input id="f-st-school-code" placeholder="کد چاپ‌شده روی برگهٔ مکتب را وارد کنید" oninput="onSchoolCodeInput()" autocomplete="off">
        <div id="f-st-school-code-msg" style="margin-top:6px; font-size:12px; display:none;"></div>
      </div>
      <div class="field"><label>کد معرف (اختیاری)</label><input id="f-st-referral-code" list="dl-profiles" placeholder="کد شاگردی که این شخص را معرفی کرده">
      </div>
      <p class="hint" style="margin:-4px 0 12px;">در صورت وارد کردن کد معرف معتبر، ${faDigits(db.referralSettings.refereeDiscount)}٪ تخفیف به شهریهٔ این ثبت‌نام و ${faDigits(db.referralSettings.referrerDiscount)}٪ تخفیف به آخرین ثبت‌نام معرف افزوده می‌شود (قابل تغییر در تنظیمات). همچنین اگر این سومین (یا بیشتر) عضو یک خانواده باشد که در همین ماه ثبت‌نام می‌کند، ${faDigits(FAMILY_DISCOUNT_PERCENT)}٪ تخفیف خانوادگی نیز به‌صورت خودکار اعمال می‌شود.</p>
    ` : ''}

    <div class="sectiontitle">کتاب و کارت شاگردی (جدا از شهریه)</div>
    <div class="field-row">
      <div class="field"><label>عنوان کتاب</label><input id="f-st-book-title" value="${s?s.bookTitle||'':''}" placeholder="مثلاً: General English Coursebook 1"></div>
      <div class="field"><label>قیمت کتاب</label><input id="f-st-book-price" class="money-input" value="${s&&s.bookPrice?numFmt(s.bookPrice):''}" oninput="formatMoneyInput(this)" placeholder="۰"></div>
    </div>
    <div class="field">
      <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
        <input type="checkbox" id="f-st-book-paid" style="width:auto;" ${s&&s.bookPaid?'checked':''}>
        قیمت کتاب پرداخت شده
      </label>
    </div>
    <div class="field-row">
      <div class="field"><label>قیمت کارت شاگردی</label><input id="f-st-idcard-price" class="money-input" value="${s&&s.idCardPrice?numFmt(s.idCardPrice):'۱۵۰'}" oninput="formatMoneyInput(this)"></div>
      <div class="field">
        <label style="display:flex; align-items:center; gap:6px; cursor:pointer; margin-top:24px;">
          <input type="checkbox" id="f-st-idcard-paid" style="width:auto;" ${s&&s.idCardPaid?'checked':''}>
          قیمت کارت پرداخت شده
        </label>
      </div>
    </div>

    <div class="sectiontitle">نمرات و نتیجه</div>
    <div class="field-row">
      <div class="field"><label>نمرهٔ فعالیت صنفی (از ۱۰۰)</label><input id="f-st-activity" type="number" min="0" max="100" value="${s?s.activityScore||'':''}"></div>
      <div class="field"><label>نمرهٔ امتحان (از ۱۰۰)</label><input id="f-st-exam" type="number" min="0" max="100" value="${s?s.examScore||'':''}"></div>
    </div>
    <div class="field"><label>نتیجهٔ صنف</label><select id="f-st-result">${resultOptionsHtml(s?s.result:'')}</select></div>
    <p class="hint" style="margin:-6px 0 12px;">«کامیاب مشروط» برای شاگردانی است که با شرایطی مانند امتحان مجدد (ری‌تیک) اجازهٔ رفتن به سطح بعدی را دارند.</p>
    <div class="field"><label>توضیحات</label><input id="f-st-note" value="${s?s.note||'':''}"></div>
    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">انصراف</button>
      <button class="btn" onclick="saveStudent(${s?`'${s.id}'`:'null'})">ذخیره</button>
    </div>
  `, {wide:true});
}
function onProfileSearchInput(){
  const val = (document.getElementById('f-st-profile-search').value||'').trim();
  const match = db.studentProfiles.find(pr=>`${pr.code} · ${pr.name}`===val);
  const idEl = document.getElementById('f-st-profile-id');
  const nameEl = document.getElementById('f-st-name');
  const gradeEl = document.getElementById('f-st-grade');
  const gnameEl = document.getElementById('f-st-guardian');
  const gphoneEl = document.getElementById('f-st-phone');
  if(match){
    idEl.value = match.id;
    nameEl.value = match.name; nameEl.disabled = true;
    gradeEl.value = match.grade||''; gradeEl.disabled = true;
    gnameEl.value = match.guardianName||''; gnameEl.disabled = true;
    gphoneEl.value = match.guardianPhone||''; gphoneEl.disabled = true;
  } else {
    idEl.value = '';
    nameEl.disabled = false; gradeEl.disabled = false; gnameEl.disabled = false; gphoneEl.disabled = false;
  }
}
function updateStudentCalc(){
  const fee = moneyNum('f-st-fee');
  const disc = Number(document.getElementById('f-st-discount').value)||0;
  const el = document.getElementById('f-st-net-display');
  if(el) el.textContent = afn(netAfterDiscount(fee, disc));
}
function saveStudent(id){
  const existing = id ? db.students.find(x=>x.id===id) : null;
  // Resolve & validate school discount code BEFORE any data is mutated (avoids orphan profiles on error)
  let resolvedSchoolCode = null;
  if(!existing){
    const codeInput = document.getElementById('f-st-school-code');
    const codeVal = codeInput ? codeInput.value.trim() : '';
    if(codeVal){
      const dc = findDiscountCode(codeVal);
      if(!dc){ alert('کد تخفیف واردشده معتبر نیست. لطفاً کد را بررسی کنید یا خالی بگذارید.'); return; }
      if(dc.status==='used'){ alert('این کد تخفیف قبلاً استفاده شده و دیگر معتبر نیست.'); return; }
      if(dc.status==='void'){ alert('این کد تخفیف باطل شده و قابل استفاده نیست.'); return; }
      resolvedSchoolCode = dc;
    }
  }
  let profileId;
  if(existing){
    profileId = existing.profileId;
  } else {
    const pid = document.getElementById('f-st-profile-id').value;
    if(pid){
      profileId = pid;
    } else {
      const regDate = jalaliPickerValue('f-st-date');
      const newProfile = {
        id: uid(),
        code: generateStudentCode(regDate),
        name: document.getElementById('f-st-name').value.trim() || 'بدون‌نام',
        grade: document.getElementById('f-st-grade').value.trim(),
        guardianName: document.getElementById('f-st-guardian').value.trim(),
        guardianPhone: document.getElementById('f-st-phone').value.trim(),
        photo: pendingStudentPhoto || '', idPhoto: pendingStudentIdPhoto || '', note: '', createdAt: regDate,
      };
      db.studentProfiles.unshift(newProfile);
      profileId = newProfile.id;
      pendingStudentPhoto = ''; pendingStudentIdPhoto = '';
    }
  }
  const rec = {
    id: id || uid(),
    profileId,
    classId: document.getElementById('f-st-class').value,
    registerDate: jalaliPickerValue('f-st-date'),
    feeAmount: moneyNum('f-st-fee'),
    discountPercent: Number(document.getElementById('f-st-discount').value)||0,
    referralDiscountPercent: existing ? (existing.referralDiscountPercent||0) : 0,
    familyDiscountPercent: existing ? (existing.familyDiscountPercent||0) : 0,
    schoolCodeDiscountPercent: existing ? (existing.schoolCodeDiscountPercent||0) : 0,
    schoolCode: existing ? (existing.schoolCode||'') : '',
    referredBy: existing ? (existing.referredBy||'') : '',
    paidAmount: moneyNum('f-st-paid'),
    bookTitle: document.getElementById('f-st-book-title').value.trim(),
    bookPrice: moneyNum('f-st-book-price'),
    bookPaid: document.getElementById('f-st-book-paid').checked,
    idCardPrice: moneyNum('f-st-idcard-price'),
    idCardPaid: document.getElementById('f-st-idcard-paid').checked,
    activityScore: document.getElementById('f-st-activity').value ? Number(document.getElementById('f-st-activity').value) : '',
    examScore: document.getElementById('f-st-exam').value ? Number(document.getElementById('f-st-exam').value) : '',
    result: document.getElementById('f-st-result').value,
    note: document.getElementById('f-st-note').value.trim(),
  };

  if(!existing){
    // Referral discount: this is a brand-new enrollment
    const refInput = document.getElementById('f-st-referral-code');
    const refVal = refInput ? refInput.value.trim() : '';
    if(refVal){
      const match = db.studentProfiles.find(pr=>`${pr.code} · ${pr.name}`===refVal || pr.code===refVal);
      if(match && match.id!==profileId){
        rec.referredBy = match.id;
        rec.referralDiscountPercent = db.referralSettings.refereeDiscount;
        const refEnrollments = profileEnrollments(match.id).sort((a,b)=> b.registerDate.localeCompare(a.registerDate));
        if(refEnrollments[0]){
          refEnrollments[0].referralDiscountPercent = (Number(refEnrollments[0].referralDiscountPercent)||0) + db.referralSettings.referrerDiscount;
          logAction('تخفیف معرفی', 'ثبت‌نام شاگرد', `${profileName(refEnrollments[0].profileId)} · پاداش ${faDigits(db.referralSettings.referrerDiscount)}٪ برای معرفی ${profileName(profileId)}`);
        }
      }
    }
    // Family discount: 3rd+ family member registering in the same Jalali month
    const profileNow = profileById(profileId);
    if(profileNow && profileNow.familyId){
      rec.familyDiscountPercent = familyDiscountCheck(profileNow.familyId, rec.registerDate);
    }
    // School discount code: apply its discount and mark the code as used (single-use)
    if(resolvedSchoolCode){
      rec.schoolCode = resolvedSchoolCode.code;
      rec.schoolCodeDiscountPercent = Number(resolvedSchoolCode.discountPercent)||0;
      resolvedSchoolCode.status = 'used';
      resolvedSchoolCode.usedByProfileId = profileId;
      resolvedSchoolCode.usedByStudentName = profileName(profileId);
      resolvedSchoolCode.usedAt = rec.registerDate || todayISO();
      resolvedSchoolCode.usedByActor = currentActorName || '';
      resolvedSchoolCode.usedEnrollmentId = rec.id;
      logAction('استفاده از کد تخفیف', 'کد تخفیف مکتب', `${resolvedSchoolCode.code} · ${profileName(profileId)} · ${faDigits(rec.schoolCodeDiscountPercent)}٪`);
    }
  }

  if(id){ const idx = db.students.findIndex(x=>x.id===id); db.students[idx]=rec; }
  else { db.students.unshift(rec); }
  logAction(id?'ویرایش':'ثبت‌نام', 'ثبت‌نام شاگرد', `${profileName(profileId)} · ${className(rec.classId)}`);
  closeModal(); save();
}
function deleteStudent(id){ if(!confirm('این ثبت‌نام حذف شود؟ (پروندهٔ شاگرد و ثبت‌نامی‌های دیگر او حذف نخواهد شد)')) return; const it=db.students.find(x=>x.id===id); const lbl=it?`${profileName(it.profileId)} · ${className(it.classId)}`:''; const freed=(db.discountCodes||[]).find(c=>c.usedEnrollmentId===id); if(freed){ freed.status='unused'; freed.usedByProfileId=''; freed.usedByStudentName=''; freed.usedAt=''; freed.usedByActor=''; freed.usedEnrollmentId=''; logAction('آزادسازی کد تخفیف','کد تخفیف مکتب',`${freed.code} · حذف ثبت‌نام`); } db.students = db.students.filter(x=>x.id!==id); logAction('حذف','ثبت‌نام شاگرد',lbl); save(); }

/* ---------------- Student profile modal ---------------- */
function openStudentProfileModal(profileId){
  const p = profileById(profileId); if(!p) return;
  const rows = profileEnrollments(profileId);
  const historyRows = rows.length ? rows.map(s=>{
    const att = studentAttendanceTotals(s.classId, s.id);
    return `
    <tr>
      <td>${className(s.classId)}</td><td>${classBranch(s.classId)}</td><td>${toJalali(s.registerDate)}</td>
      <td><span class="tag ${classStatusTagClass(classStatus(db.classes.find(c=>c.id===s.classId)||{}))}">${classStatus(db.classes.find(c=>c.id===s.classId)||{})}</span></td>
      <td class="num" title="دستی: ${faDigits(s.discountPercent||0)}٪ · معرفی: ${faDigits(s.referralDiscountPercent||0)}٪ · خانوادگی: ${faDigits(s.familyDiscountPercent||0)}٪">${faDigits(studentTotalDiscountPercent(s))}٪</td>
      <td class="num">${afn(studentNetFee(s))}</td><td class="num">${afn(studentRemaining(s))}</td>
      <td class="num">${faDigits(att.present)}</td><td class="num">${faDigits(att.absent)}</td>
      <td class="num">${s.activityScore!==''&&s.activityScore!==undefined?faDigits(s.activityScore):'-'}</td>
      <td class="num">${s.examScore!==''&&s.examScore!==undefined?faDigits(s.examScore):'-'}</td>
      <td>${s.bookTitle?`${s.bookTitle} <span class="tag ${s.bookPaid?'income':'cost'}" style="margin-right:4px;">${s.bookPaid?'پرداخت‌شده':'پرداخت‌نشده'}</span>`:'-'}</td>
      <td>${s.idCardPrice?`<span class="tag ${s.idCardPaid?'income':'cost'}">${s.idCardPaid?'پرداخت‌شده':'پرداخت‌نشده'}</span>`:'-'}</td>
      <td>${s.result ? `<span class="tag ${resultTagClass(s.result)}">${s.result}</span>` : '<span class="tag info">در حال آموزش</span>'}</td>
    </tr>
  `;
  }).join('') : `<tr><td colspan="13" class="empty">هنوز در صنفی ثبت‌نام نشده.</td></tr>`;

  const referredByEnrollment = rows.find(s=>s.referredBy);
  const referrerProfile = referredByEnrollment ? profileById(referredByEnrollment.referredBy) : null;
  const referredOthers = db.students.filter(s=>s.referredBy===p.id);
  const referralInfo = `
    ${referrerProfile ? `<p class="hint">این شاگرد با معرفی <b>${referrerProfile.name} (${referrerProfile.code})</b> ثبت‌نام کرده است.</p>` : ''}
    ${referredOthers.length ? `<p class="hint">این شاگرد تاکنون <b>${faDigits(referredOthers.length)}</b> نفر را معرفی کرده: ${referredOthers.map(s=>profileName(s.profileId)).join('، ')}</p>` : ''}
  `;

  openModal(`
    <h3>پروندهٔ شاگرد</h3>
    <p class="sub">کد: <span class="code-badge" style="cursor:default;">${p.code||'-'}</span></p>
    ${referralInfo}
    <div class="profile-grid">
      <div class="upload-box">
        <label>عکس شاگرد</label>
        ${p.photo?`<img src="${p.photo}">`:''}
        <input type="file" accept="image/*" onchange="readImageAsDataURL(this, url=>{ const pr=profileById('${p.id}'); pr.photo=url; save(); openStudentProfileModal('${p.id}'); })">
      </div>
      <div class="upload-box">
        <label>عکس سند هویت</label>
        ${p.idPhoto?`<img src="${p.idPhoto}">`:''}
        <input type="file" accept="image/*" onchange="readImageAsDataURL(this, url=>{ const pr=profileById('${p.id}'); pr.idPhoto=url; save(); openStudentProfileModal('${p.id}'); })">
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>نام</label><input id="f-pf-name" value="${p.name}"></div>
      <div class="field"><label>پایه/سن</label><input id="f-pf-grade" value="${p.grade||''}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>نام سرپرست</label><input id="f-pf-guardian" value="${p.guardianName||''}"></div>
      <div class="field"><label>شماره تماس سرپرست</label><input id="f-pf-phone" value="${p.guardianPhone||''}"></div>
    </div>
    <div class="field"><label>کد/نام خانواده (برای تخفیف خانوادگی)</label><input id="f-pf-family" value="${p.familyId||''}" placeholder="مثلاً: نام خانوادگی یا شمارهٔ تماس مشترک خانواده"></div>
    <div class="field"><label>توضیحات</label><input id="f-pf-note" value="${p.note||''}"></div>

    <div class="sectiontitle">سابقهٔ صنف‌ها، نمرات و نتیجه</div>
    <div class="table-scroll"><table>
      <thead><tr><th>صنف</th><th>شعبه</th><th>تاریخ ثبت‌نام</th><th>وضعیت صنف</th><th>تخفیف</th><th>شهریهٔ نهایی</th><th>باقیمانده</th><th>حاضر</th><th>غایب</th><th>فعالیت صنفی</th><th>نمرهٔ امتحان</th><th>کتاب</th><th>کارت شاگردی</th><th>نتیجه</th></tr></thead>
      <tbody>${historyRows}</tbody>
    </table></div>

    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">بستن</button>
      <button class="btn" onclick="saveStudentProfile('${p.id}')">ذخیرهٔ تغییرات</button>
    </div>
  `, {wide:true});
}
function saveStudentProfile(id){
  const p = profileById(id); if(!p) return;
  p.name = document.getElementById('f-pf-name').value.trim() || p.name;
  p.grade = document.getElementById('f-pf-grade').value.trim();
  p.guardianName = document.getElementById('f-pf-guardian').value.trim();
  p.guardianPhone = document.getElementById('f-pf-phone').value.trim();
  p.familyId = document.getElementById('f-pf-family').value.trim();
  p.note = document.getElementById('f-pf-note').value.trim();
  logAction('ویرایش', 'پروندهٔ شاگرد', `${p.name} (${p.code})`);
  closeModal(); save();
}

/* ---------------- TEACHER (Personnel) modal ---------------- */
const PERSONNEL_ROLES = ['مدرس','مدیریت','کارمند'];
function personnelRoleOptionsHtml(selected){
  return PERSONNEL_ROLES.map(r=>`<option value="${r}" ${r===(selected||'مدرس')?'selected':''}>${r}</option>`).join('');
}
function openTeacherModal(id){
  const t = id ? db.teachers.find(x=>x.id===id) : null;
  openModal(`
    <h3>${t?'ویرایش پرسنل':'پرسنل جدید'}</h3>
    ${t?`<p class="sub">کد: <span class="code-badge" style="cursor:default;">${t.code||'-'}</span></p>`:`<p class="sub">کد یکتا پس از ذخیره به‌صورت خودکار ساخته می‌شود</p>`}
    <div class="field-row">
      <div class="field"><label>نام</label><input id="f-t-name" value="${t?t.name:''}"></div>
      <div class="field"><label>نقش</label><select id="f-t-role">${personnelRoleOptionsHtml(t?t.role:'مدرس')}</select></div>
    </div>
    <div class="field"><label>شماره تماس</label><input id="f-t-phone" value="${t?t.phone||'':''}"></div>
    <div class="field"><label>مضامین/تخصص (برای مدرسان)</label><input id="f-t-subjects" value="${t?t.subjects||'':''}" placeholder="مثلاً: جنرال انگلیسی، آیلتس"></div>

    <div class="sectiontitle">قرارداد</div>
    <div class="field-row">
      <div class="field"><label>تاریخ آغاز قرارداد</label>${jalaliPicker('f-t-cstart', t?t.contractStart:null)}</div>
      <div class="field">
        <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
          <input type="checkbox" id="f-t-has-cend" style="width:auto;" ${t&&t.contractEnd?'checked':''} onchange="document.getElementById('f-t-cend-container').style.display=this.checked?'block':'none';">
          تاریخ پایان قرارداد مشخص است
        </label>
        <div id="f-t-cend-container" style="margin-top:8px; ${t&&t.contractEnd?'':'display:none;'}">
          ${jalaliPicker('f-t-cend', t?t.contractEnd:null)}
        </div>
      </div>
    </div>

    <div class="sectiontitle">حقوق و دستمزد</div>
    <div class="field-row">
      <div class="field"><label>نوع پرداخت</label><select id="f-t-paytype" onchange="updateTeacherPayField()">
        <option value="به ازای هر صنف (ماهانه)" ${!t||t.payType==='به ازای هر صنف (ماهانه)'?'selected':''}>به ازای هر صنف (ماهانه)</option>
        <option value="ماهانه ثابت" ${t&&t.payType==='ماهانه ثابت'?'selected':''}>ماهانه ثابت</option>
        <option value="درصد شهریه" ${t&&t.payType==='درصد شهریه'?'selected':''}>درصد شهریهٔ جمع‌آوری‌شده</option>
      </select></div>
      <div class="field"><label id="f-t-payamount-label">مبلغ (افغانی)</label><input id="f-t-payamount" class="money-input" value="${t&&t.payAmount?numFmt(t.payAmount):''}" oninput="formatMoneyInput(this)" placeholder="۰"></div>
    </div>
    <p class="hint" id="f-t-pay-hint" style="margin:-6px 0 12px;"></p>
    <div class="field"><label>توضیحات</label><input id="f-t-note" value="${t?t.note||'':''}"></div>
    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">انصراف</button>
      <button class="btn" onclick="saveTeacher(${t?`'${t.id}'`:'null'})">ذخیره</button>
    </div>
  `);
  updateTeacherPayField();
}
function updateTeacherPayField(){
  const sel = document.getElementById('f-t-paytype');
  const label = document.getElementById('f-t-payamount-label');
  const hint = document.getElementById('f-t-pay-hint');
  const input = document.getElementById('f-t-payamount');
  if(!sel || !label || !hint || !input) return;
  if(sel.value==='درصد شهریه'){
    label.textContent = 'درصد (٪)';
    input.placeholder = 'مثلاً: ۲۰';
    hint.textContent = 'در این حالت، حقوق هر ماه برابر است با این درصد از مجموع شهریه‌های جمع‌آوری‌شدهٔ (پرداخت‌شدهٔ) صنف‌های این مدرس در همان ماه. مثلاً ۲۰ یعنی ۲۰٪ از شهریهٔ دریافتی صنف‌های او.';
  } else if(sel.value==='ماهانه ثابت'){
    label.textContent = 'مبلغ (افغانی)';
    input.placeholder = '۰';
    hint.textContent = 'مبلغ ثابت ماهانه، مستقل از تعداد صنف‌ها.';
  } else {
    label.textContent = 'مبلغ (افغانی)';
    input.placeholder = '۰';
    hint.textContent = 'در حالت «به ازای هر صنف»، این مبلغ به ازای هر صنفی که مدرس در یک ماه داشته باشد پرداخت می‌شود (هر صنف ۶ روز در هفته، شنبه تا پنج‌شنبه، هر جلسه ۶۰ دقیقه، و هر دوره در حدود یک ماه به پایان می‌رسد).';
  }
}
function saveTeacher(id){
  const existing = id ? db.teachers.find(x=>x.id===id) : null;
  const hasEnd = document.getElementById('f-t-has-cend').checked;
  const createdAt = existing ? (existing.createdAt||todayISO()) : todayISO();
  const role = document.getElementById('f-t-role').value;
  const rec = {
    id: id || uid(),
    code: existing ? existing.code : generatePersonnelCode(role, createdAt),
    name: document.getElementById('f-t-name').value.trim() || 'بدون‌نام',
    role,
    phone: document.getElementById('f-t-phone').value.trim(),
    subjects: document.getElementById('f-t-subjects').value.trim(),
    contractStart: jalaliPickerValue('f-t-cstart'),
    contractEnd: hasEnd ? jalaliPickerValue('f-t-cend') : '',
    payType: document.getElementById('f-t-paytype').value,
    payAmount: moneyNum('f-t-payamount'),
    photo: existing ? (existing.photo||'') : '',
    idPhoto: existing ? (existing.idPhoto||'') : '',
    password: existing ? (existing.password || generateUniquePassword()) : generateUniquePassword(),
    note: document.getElementById('f-t-note').value.trim(),
    createdAt,
  };
  if(id){ const idx = db.teachers.findIndex(x=>x.id===id); db.teachers[idx]=rec; }
  else { db.teachers.unshift(rec); }
  logAction(id?'ویرایش':'ایجاد', 'پرسنل', `${rec.name} (${rec.code})`);
  closeModal(); save();
}
function deleteTeacher(id){
  if(db.classes.some(c=>c.teacherId===id)){
    if(!confirm('این مدرس به یک یا چند صنف اختصاص دارد. حذف مدرس، آن صنف‌ها را بدون مدرس باقی می‌گذارد. ادامه می‌دهید؟')) return;
  } else if(!confirm('این پرسنل حذف شود؟')) return;
  const it = db.teachers.find(x=>x.id===id);
  db.teachers = db.teachers.filter(x=>x.id!==id);
  logAction('حذف', 'پرسنل', it?`${it.name} (${it.code||''})`:'');
  save();
}

/* ---------------- Personnel profile modal ---------------- */
function teacherPassFailStats(teacherId){
  const classIds = new Set(teacherClassesList(teacherId).map(c=>c.id));
  const relevant = db.students.filter(s=>classIds.has(s.classId) && (s.result==='کامیاب'||s.result==='ناکام'));
  const pass = relevant.filter(s=>s.result==='کامیاب').length;
  const fail = relevant.filter(s=>s.result==='ناکام').length;
  const total = pass+fail;
  return { pass, fail, total, rate: total ? Math.round(pass/total*100) : null };
}
function openTeacherProfileModal(teacherId){
  const t = db.teachers.find(x=>x.id===teacherId); if(!t) return;
  const classes = teacherClassesList(t.id);
  const stats = teacherPassFailStats(t.id);
  const classRows = classes.length ? classes.map(c=>{
    const enrolled = db.students.filter(s=>s.classId===c.id);
    const pass = enrolled.filter(s=>s.result==='کامیاب').length;
    const fail = enrolled.filter(s=>s.result==='ناکام').length;
    const att = classAttendanceTotals(c.id);
    return `<tr>
      <td>${c.name||c.category}</td><td>${c.branch||'-'}</td><td>${toJalali(c.startDate)}</td>
      <td><span class="tag ${classStatusTagClass(classStatus(c))}">${classStatus(c)}</span></td>
      <td class="num">${faDigits(enrolled.length)}</td>
      <td class="num">${faDigits(pass)}</td><td class="num">${faDigits(fail)}</td>
      <td class="num">${faDigits(att.present)}</td><td class="num">${faDigits(att.absent)}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="9" class="empty">هنوز صنفی به این شخص اختصاص نیافته.</td></tr>`;

  const passwordBlock = currentRole==='shareholder' ? `
    <div class="panel" style="background:var(--panel-2); padding:12px 14px; margin-bottom:16px;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <span style="font-size:12.5px; color:var(--text-dim);">رمز عبور ورود این شخص (نقش مدرس/مدیر شعبه):</span>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="code-badge" style="cursor:default;">${t.password||'-'}</span>
          <button class="btn ghost small" onclick="regeneratePersonnelPassword('${t.id}')">تولید رمز جدید</button>
        </div>
      </div>
    </div>
  ` : '';

  openModal(`
    <h3>پروندهٔ پرسنل</h3>
    <p class="sub">کد: <span class="code-badge" style="cursor:default;">${t.code||'-'}</span> · نقش: ${t.role||'مدرس'}</p>
    ${passwordBlock}
    <div class="profile-grid">
      <div class="upload-box">
        <label>عکس پرسنل</label>
        ${t.photo?`<img src="${t.photo}">`:''}
        <input type="file" accept="image/*" onchange="readImageAsDataURL(this, url=>{ const tt=db.teachers.find(x=>x.id==='${t.id}'); tt.photo=url; save(); openTeacherProfileModal('${t.id}'); })">
      </div>
      <div class="upload-box">
        <label>عکس سند هویت</label>
        ${t.idPhoto?`<img src="${t.idPhoto}">`:''}
        <input type="file" accept="image/*" onchange="readImageAsDataURL(this, url=>{ const tt=db.teachers.find(x=>x.id==='${t.id}'); tt.idPhoto=url; save(); openTeacherProfileModal('${t.id}'); })">
      </div>
    </div>
    <div class="cards" style="grid-template-columns:repeat(3,1fr); margin-bottom:16px;">
      <div class="card c-info"><div class="label">تاریخ آغاز قرارداد</div><div class="value info" style="font-size:14px;">${t.contractStart?toJalali(t.contractStart):'-'}</div></div>
      <div class="card c-info"><div class="label">تاریخ پایان قرارداد</div><div class="value info" style="font-size:14px;">${t.contractEnd?toJalali(t.contractEnd):'نامشخص'}</div></div>
      <div class="card c-income"><div class="label">نرخ کامیابی شاگردها</div><div class="value income" style="font-size:14px;">${stats.rate===null?'-':faDigits(stats.rate)+'٪ ('+faDigits(stats.pass)+'/'+faDigits(stats.total)+')'}</div></div>
    </div>

    <div class="sectiontitle">سابقهٔ صنف‌های تدریس‌شده</div>
    <div class="table-scroll"><table>
      <thead><tr><th>صنف</th><th>شعبه</th><th>تاریخ آغاز</th><th>وضعیت</th><th>ثبت‌نامی</th><th>کامیاب</th><th>ناکام</th><th>حاضر</th><th>غایب</th></tr></thead>
      <tbody>${classRows}</tbody>
    </table></div>

    ${typeof teacherIncomeHtml==='function' ? teacherIncomeHtml(t) : ''}

    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">بستن</button>
      <button class="btn" onclick="closeModal(); openTeacherModal('${t.id}');">ویرایش اطلاعات</button>
    </div>
  `, {wide:true});
}

/* ---------------- Teacher monthly salary logic ----------------
   Each teacher has a pre-agreed rate (payAmount).
   - "به ازای هر صنف (ماهانه)": rate × تعداد صنف‌هایی که مدرس در آن ماه داشته
     (هر صنف ۶ روز در هفته برگزار می‌شود و هر دوره در حدود یک ماه تمام می‌شود،
     پس هر صنف که در آن ماه آغاز شده یک واحد حساب می‌شود).
   - "ماهانه ثابت": مبلغ ثابت، مستقل از تعداد صنف‌ها.
   از این مبلغ ناخالص، مانده پیش‌پرداخت‌های تسویه‌نشدهٔ آن مدرس کسر می‌شود. */
function dateInMonth(dateStr, y, m){
  if(!dateStr) return false;
  const d = new Date(dateStr+'T00:00:00');
  return d.getFullYear()===y && d.getMonth()===m;
}
function teacherClassCountInMonth(teacherId, y, m){
  return db.classes.filter(c=>c.teacherId===teacherId && dateInMonth(c.startDate, y, m)).length;
}
/* Fees actually collected (paid) for a class — total, or within a given Gregorian month (by registerDate) */
function classFeesCollected(classId){
  return db.students.filter(s=>s.classId===classId).reduce((sum,s)=>sum+(Number(s.paidAmount)||0),0);
}
function classFeesCollectedInMonth(classId, y, m){
  return db.students.filter(s=>s.classId===classId && dateInMonth(s.registerDate, y, m)).reduce((sum,s)=>sum+(Number(s.paidAmount)||0),0);
}
const PAY_TYPES = ['به ازای هر صنف (ماهانه)', 'ماهانه ثابت', 'درصد شهریه'];
function teacherGrossSalary(t, y, m){
  if(t.payType==='ماهانه ثابت') return Number(t.payAmount)||0;
  if(t.payType==='درصد شهریه'){
    const pct = Number(t.payAmount)||0;
    const collected = teacherClassesList(t.id).reduce((s,c)=> s + classFeesCollectedInMonth(c.id, y, m), 0);
    return Math.round(collected * pct / 100);
  }
  return (Number(t.payAmount)||0) * teacherClassCountInMonth(t.id, y, m);
}
function teacherAdvanceBalance(teacherId){
  return db.teacherAdvances.filter(a=>a.teacherId===teacherId && !a.settled).reduce((s,a)=>s+(Number(a.amount)||0),0);
}
/* Income tax withheld from a teacher's salary (percentage set by shareholders) */
function teacherTaxPercent(){ return Number(db.teacherTaxPercent)||0; }
function teacherSalaryTax(gross){ return Math.round((Number(gross)||0) * teacherTaxPercent() / 100); }
function teacherNetSalary(t, y, m){
  const gross = teacherGrossSalary(t,y,m);
  return Math.max(0, gross - teacherSalaryTax(gross) - teacherAdvanceBalance(t.id));
}

/* ---------------- ADVANCE modal ---------------- */
function openAdvanceModal(id){
  const a = id ? db.teacherAdvances.find(x=>x.id===id) : null;
  openModal(`
    <h3>${a?'ویرایش پیش‌پرداخت':'پیش‌پرداخت جدید'}</h3>
    <p class="sub">مبلغی که از قبل به مدرس پرداخت شده و باید از حقوق ماهانهٔ او کسر شود</p>
    <div class="field"><label>مدرس</label><select id="f-adv-teacher">${teacherOptionsHtml(a?a.teacherId:'')}</select></div>
    <div class="field"><label>مبلغ (افغانی)</label><input id="f-adv-amount" class="money-input" value="${a&&a.amount?numFmt(a.amount):''}" oninput="formatMoneyInput(this)" placeholder="۰"></div>
    <div class="field"><label>تاریخ</label>${jalaliPicker('f-adv-date', a?a.date:null)}</div>
    <div class="field"><label>توضیحات</label><input id="f-adv-note" value="${a?a.note||'':''}"></div>
    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">انصراف</button>
      <button class="btn" onclick="saveAdvance(${a?`'${a.id}'`:'null'})">ذخیره</button>
    </div>
  `);
}
function saveAdvance(id){
  const existing = id ? db.teacherAdvances.find(x=>x.id===id) : null;
  const rec = {
    id: id || uid(),
    teacherId: document.getElementById('f-adv-teacher').value,
    amount: moneyNum('f-adv-amount'),
    date: jalaliPickerValue('f-adv-date'),
    note: document.getElementById('f-adv-note').value.trim(),
    settled: existing ? !!existing.settled : false,
  };
  if(id){ const idx = db.teacherAdvances.findIndex(x=>x.id===id); db.teacherAdvances[idx]=rec; }
  else { db.teacherAdvances.unshift(rec); }
  logAction(id?'ویرایش':'ایجاد', 'پیش‌پرداخت مدرس', `${teacherName(rec.teacherId)} · ${afn(rec.amount)}`);
  closeModal(); save();
}
function deleteAdvance(id){ if(!confirm('این پیش‌پرداخت حذف شود؟')) return; const it=db.teacherAdvances.find(x=>x.id===id); const lbl=it?`${teacherName(it.teacherId)} · ${afn(it.amount)}`:''; db.teacherAdvances = db.teacherAdvances.filter(x=>x.id!==id); logAction('حذف','پیش‌پرداخت مدرس',lbl); save(); }
function toggleAdvanceSettled(id, checked){
  const a = db.teacherAdvances.find(x=>x.id===id); if(!a) return;
  a.settled = checked; save();
}

/* ---------------- Salary payout action ---------------- */
function paySalary(teacherId){
  const t = db.teachers.find(x=>x.id===teacherId); if(!t) return;
  const now = new Date();
  const gross = teacherGrossSalary(t, now.getFullYear(), now.getMonth());
  const tax = teacherSalaryTax(gross);
  const advance = teacherAdvanceBalance(teacherId);
  const net = Math.max(0, gross - tax - advance);
  if(net<=0 && gross<=0){ alert('برای این مدرس در ماه جاری صنفی ثبت نشده یا حقوق ثابتی تعریف نشده است.'); return; }
  if(!confirm(`حقوق خالص ${afn(net)} برای «${t.name}» به‌عنوان هزینه ثبت شود؟ (ناخالص: ${afn(gross)}، مالیات ${faDigits(teacherTaxPercent())}٪: ${afn(tax)}، پیش‌پرداخت کسرشده: ${afn(advance)})\nشعبهٔ هزینه را می‌توانید بعداً از صفحهٔ «هزینه‌های روزانه» ویرایش کنید.`)) return;
  db.expenses.unshift({
    id: uid(), branch: BRANCHES[0], category: 'حقوق و دستمزد مدرسان', amount: net, date: todayISO(),
    note: `حقوق ${t.name} · ${toJalali(todayISO())}`,
    teacherId: teacherId, salaryGross: gross, salaryTax: tax, salaryTaxPercent: teacherTaxPercent(), salaryAdvance: advance,
    salaryPeriodY: now.getFullYear(), salaryPeriodM: now.getMonth(),
  });
  db.teacherAdvances.forEach(a=>{ if(a.teacherId===teacherId && !a.settled) a.settled = true; });
  logAction('پرداخت حقوق', 'پرسنل', `${t.name} · خالص ${afn(net)}`);
  save();
}

/* ---------------- DONATION modal ---------------- */
function openDonationModal(id){
  const d = id ? db.donations.find(x=>x.id===id) : null;
  openModal(`
    <h3>${d?'ویرایش درآمد':'درآمد جدید'}</h3>
    <p class="hint" style="margin-top:-6px;">توجه: درآمد فروش کتاب و کارت شاگردی اینجا ثبت نشود · آن‌ها به‌صورت خودکار از صفحهٔ «کتاب و مطبوعات» محاسبه می‌شوند.</p>
    <div class="field"><label>نام منبع درآمد (اختیاری)</label><input id="f-d-donor" value="${d?d.donorName||'':''}" placeholder="سایر"></div>
    <div class="field-row">
      <div class="field"><label>مبلغ</label><input id="f-d-amount" class="money-input" value="${d&&d.amount?numFmt(d.amount):''}" oninput="formatMoneyInput(this); updateDonationCalc();"></div>
      <div class="field"><label>درصد تخفیف</label><input id="f-d-discount" type="number" min="0" max="100" value="${d&&d.discountPercent?d.discountPercent:0}" oninput="updateDonationCalc()"></div>
    </div>
    <div class="calc-box"><span>مبلغ نهایی بعد از تخفیف</span><b id="f-d-net-display">${afn(netAfterDiscount(d?d.amount:0, d?d.discountPercent:0))}</b></div>
    <div class="field" style="margin-top:12px;"><label>روش</label><select id="f-d-method">${categoryOptionsHtml(DONATION_METHODS, d?d.method:DONATION_METHODS[0])}</select></div>
    <div class="field"><label>تاریخ</label>${jalaliPicker('f-d-date', d?d.date:null)}</div>
    <div class="field"><label>توضیحات</label><input id="f-d-note" value="${d?d.note||'':''}"></div>
    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">انصراف</button>
      <button class="btn" onclick="saveDonation(${d?`'${d.id}'`:'null'})">ذخیره</button>
    </div>
  `);
}
function updateDonationCalc(){
  const amt = moneyNum('f-d-amount');
  const disc = Number(document.getElementById('f-d-discount').value)||0;
  const el = document.getElementById('f-d-net-display');
  if(el) el.textContent = afn(netAfterDiscount(amt, disc));
}
function saveDonation(id){
  const rec = {
    id: id || uid(),
    donorName: document.getElementById('f-d-donor').value.trim() || 'سایر',
    amount: moneyNum('f-d-amount'),
    discountPercent: Number(document.getElementById('f-d-discount').value)||0,
    method: document.getElementById('f-d-method').value,
    date: jalaliPickerValue('f-d-date'),
    note: document.getElementById('f-d-note').value.trim(),
  };
  if(id){ const idx = db.donations.findIndex(x=>x.id===id); db.donations[idx]=rec; }
  else { db.donations.unshift(rec); }
  logAction(id?'ویرایش':'ایجاد', 'سایر درآمدها', `${rec.donorName} · ${afn(rec.amount)}`);
  closeModal(); save();
}
function donationNetAmount(d){ return netAfterDiscount(d.amount, d.discountPercent); }
function deleteDonation(id){ if(!confirm('این درآمد حذف شود؟')) return; const it=db.donations.find(x=>x.id===id); db.donations = db.donations.filter(x=>x.id!==id); logAction('حذف','سایر درآمدها',it?it.donorName:''); save(); }

/* ---------------- EXPENSE modal ---------------- */
function openExpenseModal(id){
  const e = id ? db.expenses.find(x=>x.id===id) : null;
  openModal(`
    <h3>${e?'ویرایش هزینه':'هزینه جدید'}</h3>
    <div class="field-row">
      <div class="field"><label>شعبه</label><select id="f-e-branch">${categoryOptionsHtml(BRANCHES, e?e.branch:BRANCHES[0])}</select></div>
      <div class="field"><label>دسته</label><select id="f-e-category">${categoryOptionsHtml(EXPENSE_CATEGORIES, e?e.category:EXPENSE_CATEGORIES[0])}</select></div>
    </div>
    <div class="field"><label>مبلغ</label><input id="f-e-amount" class="money-input" value="${e&&e.amount?numFmt(e.amount):''}" oninput="formatMoneyInput(this)"></div>
    <div class="field"><label>تاریخ</label>${jalaliPicker('f-e-date', e?e.date:null)}</div>
    <div class="field"><label>توضیحات</label><input id="f-e-note" value="${e?e.note||'':''}"></div>
    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">انصراف</button>
      <button class="btn" onclick="saveExpense(${e?`'${e.id}'`:'null'})">ذخیره</button>
    </div>
  `);
}
function saveExpense(id){
  const rec = {
    id: id || uid(),
    branch: document.getElementById('f-e-branch').value,
    category: document.getElementById('f-e-category').value,
    amount: moneyNum('f-e-amount'),
    date: jalaliPickerValue('f-e-date'),
    note: document.getElementById('f-e-note').value.trim(),
  };
  if(id){ const idx = db.expenses.findIndex(x=>x.id===id); db.expenses[idx]=rec; }
  else { db.expenses.unshift(rec); }
  logAction(id?'ویرایش':'ایجاد', 'هزینه', `${rec.category} · ${afn(rec.amount)}`);
  closeModal(); save();
}
function deleteExpense(id){ if(!confirm('این هزینه حذف شود؟')) return; const it=db.expenses.find(x=>x.id===id); const lbl=it?`${it.category} · ${afn(it.amount)}`:''; db.expenses = db.expenses.filter(x=>x.id!==id); logAction('حذف','هزینه',lbl); save(); }

/* ---------------- PROJECT modal ---------------- */
function openProjectModal(id){
  const p = id ? db.projects.find(x=>x.id===id) : null;
  openModal(`
    <h3>${p?'ویرایش پروژه':'پروژهٔ جدید'}</h3>
    <p class="sub">فعالیت یا برنامهٔ بزرگ‌تر آموزشگاه را ثبت کنید · پیشرفت آن از خودِ لیست پروژه‌ها قابل ثبت است</p>
    <div class="field-row">
      <div class="field"><label>نام پروژه</label><input id="f-pr-name" value="${p?p.name:''}"></div>
      <div class="field"><label>دسته</label><select id="f-pr-category">${categoryOptionsHtml(PROJECT_CATEGORIES, p?p.category:PROJECT_CATEGORIES[0])}</select></div>
    </div>
    <div class="field"><label>مسئول پروژه</label><input id="f-pr-lead" value="${p?p.lead||'':''}" placeholder="نام مسئول یا داوطلب"></div>
    <div class="field"><label>تاریخ آغاز</label>${jalaliPicker('f-pr-start', p?p.startDate:null)}</div>
    <div class="field">
      <label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
        <input type="checkbox" id="f-pr-has-end" style="width:auto;" ${p&&p.endDate?'checked':''} onchange="document.getElementById('f-pr-end-container').style.display=this.checked?'block':'none';">
        تاریخ پایان مشخص است
      </label>
      <div id="f-pr-end-container" style="margin-top:8px; ${p&&p.endDate?'':'display:none;'}">
        ${jalaliPicker('f-pr-end', p?p.endDate:null)}
      </div>
    </div>
    <div class="field"><label>هدف/توضیحات</label><input id="f-pr-note" value="${p?p.note||'':''}"></div>
    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">انصراف</button>
      <button class="btn" onclick="saveProject(${p?`'${p.id}'`:'null'})">ذخیره</button>
    </div>
  `);
}
function saveProject(id){
  const hasEnd = document.getElementById('f-pr-has-end').checked;
  const existing = id ? db.projects.find(x=>x.id===id) : null;
  const rec = {
    id: id || uid(),
    name: document.getElementById('f-pr-name').value.trim() || 'بدون‌نام',
    category: document.getElementById('f-pr-category').value,
    lead: document.getElementById('f-pr-lead').value.trim(),
    startDate: jalaliPickerValue('f-pr-start'),
    endDate: hasEnd ? jalaliPickerValue('f-pr-end') : '',
    note: document.getElementById('f-pr-note').value.trim(),
    progress: existing ? (existing.progress||0) : 0,
    progressLog: existing ? (existing.progressLog||[]) : [],
  };
  if(id){ const idx = db.projects.findIndex(x=>x.id===id); db.projects[idx]=rec; }
  else { db.projects.unshift(rec); }
  logAction(id?'ویرایش':'ایجاد', 'پروژه', rec.name);
  closeModal(); save();
}
function deleteProject(id){ if(!confirm('این پروژه حذف شود؟')) return; const it=db.projects.find(x=>x.id===id); db.projects = db.projects.filter(x=>x.id!==id); logAction('حذف','پروژه',it?it.name:''); save(); }

/* ---------------- MEETING modal ---------------- */
let pendingMeetingTasks = [];
function openMeetingModal(id){
  const m = id ? db.meetings.find(x=>x.id===id) : null;
  pendingMeetingTasks = m ? JSON.parse(JSON.stringify(m.tasks||[])) : [];
  openModal(`
    <h3>${m?'ویرایش جلسه':'جلسهٔ جدید'}</h3>
    <div class="field"><label>تاریخ جلسه</label>${jalaliPicker('f-mt-date', m?m.date:null)}</div>
    <div class="field"><label>حاضرین</label><input id="f-mt-attendees" value="${m?m.attendees||'':''}" placeholder="نام‌ها را با ویرگول جدا کنید"></div>
    <div class="field"><label>یادداشت‌ها / صورت‌جلسه</label><textarea id="f-mt-notes" rows="4">${m?m.notes||'':''}</textarea></div>
    <div class="sectiontitle">کارهای هفتهٔ آینده</div>
    <div id="mt-tasks-list"></div>
    <button type="button" class="btn ghost small" onclick="addTaskRow()">+ افزودن کار</button>
    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">انصراف</button>
      <button class="btn" onclick="saveMeeting(${m?`'${m.id}'`:'null'})">ذخیره</button>
    </div>
  `);
  renderTaskRows();
}
function renderTaskRows(){
  const el = document.getElementById('mt-tasks-list');
  if(!el) return;
  el.innerHTML = pendingMeetingTasks.map((t,i)=>`
    <div class="task-row">
      <input type="checkbox" ${t.done?'checked':''} onchange="pendingMeetingTasks[${i}].done=this.checked;">
      <input type="text" value="${t.text||''}" placeholder="شرح کار" onchange="pendingMeetingTasks[${i}].text=this.value;">
      <input type="text" class="task-assignee" value="${t.assignee||''}" placeholder="مسئول" onchange="pendingMeetingTasks[${i}].assignee=this.value;">
      <button type="button" class="icon-btn" onclick="removeTaskRow(${i})" title="حذف"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14"/></svg></button>
    </div>
  `).join('') || '<div class="hint">هنوز کاری افزوده نشده.</div>';
}
function addTaskRow(){
  pendingMeetingTasks.push({ id: uid(), text:'', assignee:'', done:false });
  renderTaskRows();
}
function removeTaskRow(i){
  pendingMeetingTasks.splice(i,1);
  renderTaskRows();
}
function saveMeeting(id){
  const tasks = pendingMeetingTasks.filter(t=>t.text && t.text.trim());
  const rec = {
    id: id || uid(),
    date: jalaliPickerValue('f-mt-date'),
    attendees: document.getElementById('f-mt-attendees').value.trim(),
    notes: document.getElementById('f-mt-notes').value.trim(),
    tasks,
  };
  if(id){ const idx = db.meetings.findIndex(x=>x.id===id); db.meetings[idx]=rec; }
  else { db.meetings.unshift(rec); }
  logAction(id?'ویرایش':'ایجاد', 'جلسهٔ هفتگی', toJalali(rec.date));
  pendingMeetingTasks = [];
  closeModal(); save();
}
function deleteMeeting(id){ if(!confirm('این جلسه حذف شود؟')) return; db.meetings = db.meetings.filter(x=>x.id!==id); logAction('حذف','جلسهٔ هفتگی',id); save(); }
function toggleOpenTask(meetingId, taskId, checked){
  const m = db.meetings.find(x=>x.id===meetingId); if(!m) return;
  const t = (m.tasks||[]).find(x=>x.id===taskId); if(!t) return;
  t.done = checked; save();
}

/* ---------------- Render: Dashboard ---------------- */
function renderDashboard(){
  const activeClasses = db.classes.filter(c=>classStatus(c)==='در حال برگزاری').length;
  const tot = institutionTotals(null);

  document.getElementById('dash-cards').innerHTML = `
    <div class="card c-info"><div class="label">صنف‌های در حال برگزاری</div><div class="value info">${faDigits(activeClasses)}</div></div>
    <div class="card c-income"><div class="label">مجموع درآمد کل مؤسسه</div><div class="value income">${afn(tot.income)}</div></div>
    <div class="card c-cost"><div class="label">مجموع هزینه‌های کل مؤسسه</div><div class="value cost">${afn(tot.cost)}</div></div>
    <div class="card c-profit"><div class="label">سود خالص کل مؤسسه</div><div class="value profit">${afn(tot.net)}</div></div>
  `;

  const { pageItems: recentStudents, totalPages: rsPages } = paginateList('dash-recent-students', db.students);
  document.getElementById('dash-recent-students-empty').style.display = db.students.length? 'none':'block';
  document.getElementById('dash-recent-students').innerHTML = recentStudents.map(s=>{
    const st = studentStatus(s);
    return `<tr><td>${profileName(s.profileId)}</td><td>${className(s.classId)}</td><td>${toJalali(s.registerDate)}</td><td><span class="tag ${studentStatusTagClass(st)}">${st}</span></td></tr>`;
  }).join('');
  renderPaginationControls('dash-recent-students-pagination', 'dash-recent-students', rsPages, 'renderDashboard');

  const unpaidAll = db.students.filter(s=>studentStatus(s)==='پرداخت‌نشده' || studentStatus(s)==='پرداخت جزئی');
  const { pageItems: unpaid, totalPages: unpaidPages } = paginateList('dash-unpaid', unpaidAll);
  document.getElementById('dash-unpaid-empty').style.display = unpaidAll.length? 'none':'block';
  document.getElementById('dash-unpaid').innerHTML = unpaid.map(s=>`
    <tr><td>${profileName(s.profileId)}</td><td>${className(s.classId)}</td><td>${profileGuardianName(s.profileId)||'-'} ${profileGuardianPhone(s.profileId)?'· '+profileGuardianPhone(s.profileId):''}</td>
    <td class="num"><span class="tag cost">${afn(studentRemaining(s))}</span></td></tr>
  `).join('');
  renderPaginationControls('dash-unpaid-pagination', 'dash-unpaid', unpaidPages, 'renderDashboard');

  const { pageItems: classesPage, totalPages: classesPages } = paginateList('dash-classes', db.classes);
  document.getElementById('dash-classes-empty').style.display = db.classes.length? 'none':'block';
  document.getElementById('dash-classes').innerHTML = classesPage.map(c=>{
    const st = classStatus(c);
    return `<tr><td>${c.name||c.category}</td><td>${teacherName(c.teacherId)}</td><td>${toJalali(c.startDate)}</td><td>${c.endDate?toJalali(c.endDate):'نامشخص'}</td>
    <td class="num">${faDigits(classEnrolledCount(c.id))}${c.capacity?'/'+faDigits(c.capacity):''}</td>
    <td><span class="tag ${classStatusTagClass(st)}">${st}</span></td></tr>`;
  }).join('');
  renderPaginationControls('dash-classes-pagination', 'dash-classes', classesPages, 'renderDashboard');

  const { pageItems: recentDonations, totalPages: donPages } = paginateList('dash-recent-donations', db.donations);
  document.getElementById('dash-recent-donations-empty').style.display = db.donations.length? 'none':'block';
  document.getElementById('dash-recent-donations').innerHTML = recentDonations.map(d=>`
    <tr><td>${d.donorName}</td><td class="num">${afn(donationNetAmount(d))}</td><td>${toJalali(d.date)}</td><td>${d.method}</td></tr>
  `).join('');
  renderPaginationControls('dash-recent-donations-pagination', 'dash-recent-donations', donPages, 'renderDashboard');
}

/* ---------------- Render: Classes ---------------- */
let classBranchFilter = 'all';
function renderClassesFilterChips(){
  document.getElementById('classes-filters').innerHTML =
    `<button class="chip ${classBranchFilter==='all'?'active':''}" data-branch="all">همهٔ شعبه‌ها</button>` +
    BRANCHES.map(b=>`<button class="chip ${classBranchFilter===b?'active':''}" data-branch="${b}">${b}</button>`).join('');
}
document.getElementById('classes-filters').addEventListener('click', e=>{
  const chip = e.target.closest('.chip'); if(!chip) return;
  classBranchFilter = chip.dataset.branch;
  paginationState['classes'] = 1;
  renderClassesFilterChips();
  renderClasses();
});
function renderClasses(){
  let source = db.classes;
  // Teachers see only their own classes (across all branches); others see all
  if(currentRole==='teacher') source = source.filter(c=>c.teacherId===currentTeacherId);
  const fullList = classBranchFilter==='all' ? source : source.filter(c=>c.branch===classBranchFilter);
  const { pageItems: list, totalPages } = paginateList('classes', fullList);
  document.getElementById('classes-empty').style.display = fullList.length? 'none':'block';
  document.getElementById('classes-table').innerHTML = list.map(c=>{
    const st = classStatus(c);
    const enrolled = classEnrolledCount(c.id);
    return `<tr>
      <td>${c.name||'-'}</td><td>${c.branch||'-'}</td><td>${c.category}</td><td>${teacherName(c.teacherId)}</td><td>${c.mode||'-'}</td>
      <td style="white-space:nowrap;">${classTimeLabel(c)}</td>
      <td>${toJalali(c.startDate)}</td><td>${c.endDate?toJalali(c.endDate):'نامشخص'}</td>
      <td class="num">${c.capacity?faDigits(c.capacity):'-'}</td>
      <td class="num">${faDigits(enrolled)}</td>
      <td><span class="tag ${classStatusTagClass(st)}">${st}</span></td>
      <td>${progressBarHtml(classTimeProgress(c))}</td>
      <td><div class="row-actions">
        <button class="icon-btn" onclick="openClassModal('${c.id}')" title="ویرایش"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></button>
        <button class="icon-btn" onclick="deleteClass('${c.id}')" title="حذف"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14"/></svg></button>
      </div></td>
    </tr>`;
  }).join('');
  renderPaginationControls('classes-pagination', 'classes', totalPages, 'renderClasses');
}

/* ---------------- Render: Projects ---------------- */
function renderProjects(){
  document.getElementById('projects-empty').style.display = db.projects.length? 'none':'block';
  document.getElementById('projects-table').innerHTML = db.projects.map(p=>{
    const st = classStatus(p);
    return `<tr>
      <td>${p.name}</td><td>${p.category}</td><td>${p.lead||'-'}</td>
      <td>${toJalali(p.startDate)}</td><td>${p.endDate?toJalali(p.endDate):'نامشخص'}</td>
      <td><span class="tag ${classStatusTagClass(st)}">${st}</span></td>
      <td>${progressBarHtml(p.progress||0)}</td>
      <td><div class="row-actions">
        <button class="icon-btn" onclick="openProgressModal('project','${p.id}')" title="پیشرفت"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M4 20V10M11 20V4M18 20v-7"/></svg></button>
        <button class="icon-btn" onclick="openProjectModal('${p.id}')" title="ویرایش"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></button>
        <button class="icon-btn" onclick="deleteProject('${p.id}')" title="حذف"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14"/></svg></button>
      </div></td>
    </tr>`;
  }).join('');
}

/* ---------------- Render: Weekly Meetings ---------------- */
function renderMeetings(){
  document.getElementById('meetings-empty').style.display = db.meetings.length? 'none':'block';
  document.getElementById('meetings-table').innerHTML = db.meetings.map(m=>{
    const tasks = m.tasks||[];
    const done = tasks.filter(t=>t.done).length;
    const notesPreview = (m.notes||'').length>70 ? (m.notes||'').slice(0,70)+'…' : (m.notes||'-');
    return `<tr>
      <td>${toJalali(m.date)}</td><td>${m.attendees||'-'}</td><td>${notesPreview}</td>
      <td class="num">${faDigits(done)}/${faDigits(tasks.length)}</td>
      <td><div class="row-actions">
        <button class="icon-btn" onclick="openMeetingModal('${m.id}')" title="ویرایش"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></button>
        <button class="icon-btn" onclick="deleteMeeting('${m.id}')" title="حذف"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14"/></svg></button>
      </div></td>
    </tr>`;
  }).join('');

  const openTasks = [];
  db.meetings.forEach(m=>(m.tasks||[]).forEach(t=>{ if(!t.done) openTasks.push({...t, meetingId:m.id, meetingDate:m.date}); }));
  document.getElementById('open-tasks-empty').style.display = openTasks.length? 'none':'block';
  document.getElementById('open-tasks-table').innerHTML = openTasks.map(t=>`
    <tr>
      <td>${t.text}</td><td>${t.assignee||'-'}</td><td>${toJalali(t.meetingDate)}</td>
      <td><label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
        <input type="checkbox" style="width:auto;" onchange="toggleOpenTask('${t.meetingId}','${t.id}',this.checked)"> انجام شد
      </label></td>
    </tr>
  `).join('');
}

/* ---------------- Render: Students ---------------- */
let studentFilter = 'all';
document.getElementById('students-filters').addEventListener('click', e=>{
  const chip = e.target.closest('.chip'); if(!chip) return;
  document.querySelectorAll('#students-filters .chip').forEach(c=>c.classList.remove('active'));
  chip.classList.add('active');
  studentFilter = chip.dataset.filter;
  paginationState['students'] = 1;
  renderStudents();
});
function renderStudents(){
  const q = (document.getElementById('students-search').value||'').trim().toLowerCase();
  let list = db.students.filter(s=>{
    if(studentFilter==='paid') return studentStatus(s)==='پرداخت‌شده';
    if(studentFilter==='unpaid') return studentStatus(s)==='پرداخت‌نشده' || studentStatus(s)==='پرداخت جزئی';
    if(studentFilter==='free') return studentStatus(s)==='رایگان';
    return true;
  });
  if(q){
    list = list.filter(s=>
      profileName(s.profileId).toLowerCase().includes(q) ||
      profileGuardianName(s.profileId).toLowerCase().includes(q) ||
      profileCode(s.profileId).toLowerCase().includes(q) ||
      className(s.classId).toLowerCase().includes(q)
    );
  }
  document.getElementById('students-empty').style.display = list.length? 'none':'block';
  const { pageItems, totalPages } = paginateList('students', list);
  document.getElementById('students-table').innerHTML = pageItems.map(s=>{
    const st = studentStatus(s);
    return `<tr>
      <td><span class="code-badge" onclick="openStudentProfileModal('${s.profileId}')">${profileCode(s.profileId)}</span></td>
      <td>${profileName(s.profileId)}</td><td>${profileGrade(s.profileId)||'-'}</td><td>${profileGuardianName(s.profileId)||'-'}</td><td>${profileGuardianPhone(s.profileId)||'-'}</td>
      <td>${className(s.classId)}</td><td>${classBranch(s.classId)}</td><td>${toJalali(s.registerDate)}</td>
      <td class="num">${afn(s.feeAmount)}</td><td class="num" title="دستی: ${faDigits(s.discountPercent||0)}٪ · معرفی: ${faDigits(s.referralDiscountPercent||0)}٪ · خانوادگی: ${faDigits(s.familyDiscountPercent||0)}٪">${studentTotalDiscountPercent(s)?faDigits(studentTotalDiscountPercent(s))+'٪':'-'}</td><td class="num">${afn(s.paidAmount)}</td>
      <td class="num">${afn(studentRemaining(s))}</td>
      <td><span class="tag ${studentStatusTagClass(st)}">${st}</span></td>
      <td>${s.result?`<span class="tag ${resultTagClass(s.result)}">${s.result}</span>`:'<span class="tag info">در حال آموزش</span>'}</td>
      <td><div class="row-actions">
        <button class="icon-btn" onclick="openStudentModal('${s.id}')" title="ویرایش"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></button>
        <button class="icon-btn" onclick="deleteStudent('${s.id}')" title="حذف"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14"/></svg></button>
      </div></td>
    </tr>`;
  }).join('');
  renderPaginationControls('students-pagination', 'students', totalPages, 'renderStudents');
}

/* ---------------- Render: Teachers ---------------- */
let teacherRoleFilter = 'all';
function onTeacherRoleFilterChange(){
  const sel = document.getElementById('teacher-role-filter');
  teacherRoleFilter = sel ? sel.value : 'all';
  paginationState['teachers'] = 1;
  renderTeachers();
}
function renderTeachers(){
  const fullList = teacherRoleFilter==='all' ? db.teachers : db.teachers.filter(t=>(t.role||'مدرس')===teacherRoleFilter);
  document.getElementById('teachers-empty').style.display = fullList.length? 'none':'block';
  const { pageItems, totalPages } = paginateList('teachers', fullList);
  document.getElementById('teachers-table').innerHTML = pageItems.map(t=>{
    const classes = teacherClassesList(t.id);
    const names = classes.map(c=>c.name||c.category).join('، ') || '-';
    const payLabel = t.payAmount ? `${t.payType==='درصد شهریه' ? faDigits(t.payAmount)+'٪' : afn(t.payAmount)} <span style="color:var(--text-faint);">(${t.payType||'-'})</span>` : '-';
    return `<tr>
      <td><span class="code-badge" onclick="openTeacherProfileModal('${t.id}')">${t.code||'-'}</span></td>
      <td>${t.name}</td><td><span class="tag info">${t.role||'مدرس'}</span></td><td>${t.phone||'-'}</td><td>${t.subjects||'-'}</td><td class="num">${payLabel}</td>
      <td class="num">${faDigits(classes.length)}</td><td>${names}</td>
      <td><div class="row-actions">
        <button class="icon-btn" onclick="openTeacherModal('${t.id}')" title="ویرایش"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></button>
        <button class="icon-btn" onclick="deleteTeacher('${t.id}')" title="حذف"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14"/></svg></button>
      </div></td>
    </tr>`;
  }).join('');
  renderPaginationControls('teachers-pagination', 'teachers', totalPages, 'renderTeachers');
}

/* ---------------- Render: Payroll & Teacher Advances ---------------- */
function renderTeacherAdvances(){
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();

  document.getElementById('payroll-empty').style.display = db.teachers.length? 'none':'block';
  document.getElementById('payroll-table').innerHTML = db.teachers.map(t=>{
    const cnt = (t.payType==='ماهانه ثابت'||t.payType==='درصد شهریه') ? '-' : faDigits(teacherClassCountInMonth(t.id, y, m));
    const gross = teacherGrossSalary(t, y, m);
    const tax = teacherSalaryTax(gross);
    const advBal = teacherAdvanceBalance(t.id);
    const net = teacherNetSalary(t, y, m);
    return `<tr>
      <td>${t.name}</td><td>${t.payType||'-'}</td><td class="num">${cnt}</td>
      <td class="num">${afn(gross)}</td><td class="num">${tax?afn(tax):'-'}</td><td class="num">${advBal?afn(advBal):'-'}</td>
      <td class="num"><b style="color:var(--gold-soft);">${afn(net)}</b></td>
      <td><button class="btn ghost small" onclick="paySalary('${t.id}')">ثبت پرداخت</button></td>
    </tr>`;
  }).join('');

  document.getElementById('advances-empty').style.display = db.teacherAdvances.length? 'none':'block';
  document.getElementById('advances-table').innerHTML = db.teacherAdvances.map(a=>`
    <tr>
      <td>${teacherName(a.teacherId)}</td><td class="num">${afn(a.amount)}</td><td>${toJalali(a.date)}</td>
      <td><label style="display:flex; align-items:center; gap:6px; cursor:pointer;">
        <input type="checkbox" style="width:auto;" ${a.settled?'checked':''} onchange="toggleAdvanceSettled('${a.id}',this.checked)">
        <span class="tag ${a.settled?'income':'cost'}">${a.settled?'تسویه‌شده':'باز'}</span>
      </label></td>
      <td>${a.note||'-'}</td>
      <td><div class="row-actions">
        <button class="icon-btn" onclick="openAdvanceModal('${a.id}')" title="ویرایش"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></button>
        <button class="icon-btn" onclick="deleteAdvance('${a.id}')" title="حذف"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14"/></svg></button>
      </div></td>
    </tr>
  `).join('');
}

/* ---------------- Render: Seminars/Webinars/Workshops ---------------- */
function renderSeminars(){
  document.getElementById('seminars-empty').style.display = db.seminars.length? 'none':'block';
  document.getElementById('seminars-table').innerHTML = db.seminars.map(s=>{
    const netFee = seminarNetFee(s);
    const feeCell = s.isPaid
      ? (s.discountPercent>0 ? `${afn(netFee)} <span style="color:var(--text-faint); text-decoration:line-through;">${afn(s.fee)}</span>` : afn(netFee))
      : '-';
    return `<tr>
      <td>${s.title}</td><td>${s.type}</td><td>${s.location||'-'}</td><td>${teacherName(s.speakerId)}</td>
      <td>${toJalali(s.date)}</td><td><span class="tag ${s.isPaid?'cost':'income'}">${s.isPaid?'پولی':'رایگان'}</span></td>
      <td class="num">${feeCell}</td><td class="num">${s.attendeeCount?faDigits(s.attendeeCount):'-'}</td>
      <td class="num">${s.isPaid?afn(seminarRevenue(s)):'-'}</td>
      <td><div class="row-actions">
        <button class="icon-btn" onclick="openSeminarModal('${s.id}')" title="ویرایش"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></button>
        <button class="icon-btn" onclick="deleteSeminar('${s.id}')" title="حذف"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14"/></svg></button>
      </div></td>
    </tr>`;
  }).join('');
}

/* ---------------- Render: Donations ---------------- */
function renderDonations(){
  document.getElementById('donations-empty').style.display = db.donations.length? 'none':'block';
  const { pageItems, totalPages } = paginateList('donations', db.donations);
  document.getElementById('donations-table').innerHTML = pageItems.map(d=>`
    <tr>
      <td>${d.donorName}</td><td class="num">${afn(donationNetAmount(d))}</td><td>${toJalali(d.date)}</td><td>${d.method}</td><td>${d.note||'-'}</td>
      <td><div class="row-actions">
        <button class="icon-btn" onclick="openDonationModal('${d.id}')" title="ویرایش"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></button>
        <button class="icon-btn" onclick="deleteDonation('${d.id}')" title="حذف"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14"/></svg></button>
      </div></td>
    </tr>
  `).join('');
  renderPaginationControls('donations-pagination', 'donations', totalPages, 'renderDonations');
}

/* ---------------- Render: Expenses ---------------- */
let expenseBranchFilter = 'all';
function renderExpensesFilterChips(){
  document.getElementById('expenses-filters').innerHTML =
    `<button class="chip ${expenseBranchFilter==='all'?'active':''}" data-branch="all">همهٔ شعبه‌ها</button>` +
    BRANCHES.map(b=>`<button class="chip ${expenseBranchFilter===b?'active':''}" data-branch="${b}">${b}</button>`).join('');
}
document.getElementById('expenses-filters').addEventListener('click', e=>{
  const chip = e.target.closest('.chip'); if(!chip) return;
  expenseBranchFilter = chip.dataset.branch;
  renderExpensesFilterChips();
  renderExpenses();
});
let expenseTimeFilter = 'all';
function onExpenseTimeFilterChange(){
  const sel = document.getElementById('expenses-tf');
  expenseTimeFilter = sel ? sel.value : 'all';
  renderExpenses();
}
function renderExpenses(){
  let list = expenseBranchFilter==='all' ? db.expenses : db.expenses.filter(e=>e.branch===expenseBranchFilter);
  list = filterByDate(list, 'date', expenseTimeFilter);
  document.getElementById('expenses-empty').style.display = list.length? 'none':'block';
  document.getElementById('expenses-table').innerHTML = list.map(e=>`
    <tr>
      <td>${e.branch||'-'}</td><td><span class="tag cost">${e.category}</span></td><td class="num">${afn(e.amount)}</td><td>${toJalali(e.date)}</td><td>${e.note||'-'}</td>
      <td><div class="row-actions">
        <button class="icon-btn" onclick="openExpenseModal('${e.id}')" title="ویرایش"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></button>
        <button class="icon-btn" onclick="deleteExpense('${e.id}')" title="حذف"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14"/></svg></button>
      </div></td>
    </tr>
  `).join('');
  const total = list.reduce((s,e)=>s+(Number(e.amount)||0),0);
  const label = expenseBranchFilter==='all' ? 'مجموع کل (همهٔ شعبه‌ها)' : `مجموع ${expenseBranchFilter}`;
  const footEl = document.getElementById('expenses-foot');
  if(footEl) footEl.innerHTML = list.length
    ? `<tr class="totals-row"><td colspan="2"><b>${label}</b></td><td class="num"><b>${afn(total)}</b></td><td colspan="3"></td></tr>`
    : '';
}

/* ---------------- Render: Report ---------------- */
let reportRange = 'all';
function renderReportFilterChips(){
  document.getElementById('report-filters').innerHTML = TIMEFRAMES.map(t=>
    `<button class="chip ${t.key==='all'?'active':''}" data-range="${t.key}">${t.label}</button>`
  ).join('');
}
document.getElementById('report-filters').addEventListener('click', e=>{
  const chip = e.target.closest('.chip'); if(!chip) return;
  document.querySelectorAll('#report-filters .chip').forEach(c=>c.classList.remove('active'));
  chip.classList.add('active');
  reportRange = chip.dataset.range;
  renderReport();
});
function inRange(dateStr){
  return inTimeframe(dateStr, reportRange);
}
/* ---------------- Books & Materials ---------------- */
function bookPurchasesToRows(list){
  return list.map(b=>({
    'عنوان': b.title, 'منبع': b.source||'', 'شعبه': b.branch||'', 'تعداد': b.quantity||0,
    'قیمت واحد (افغانی)': b.unitCost||0, 'مجموع هزینه (افغانی)': b.totalCost||0,
    'پرداخت‌شده (افغانی)': b.paidAmount||0, 'تاریخ پرداخت': b.paidDate?toJalali(b.paidDate):'',
    'باقیمانده (افغانی)': (b.totalCost||0)-(b.paidAmount||0), 'سررسید باقیمانده': b.dueDate?toJalali(b.dueDate):'',
    'تاریخ سفارش': toJalali(b.date), 'توضیحات': b.note||'',
  }));
}
function openBookPurchaseModal(id){
  const b = id ? db.bookPurchases.find(x=>x.id===id) : null;
  openModal(`
    <h3>${b?'ویرایش خرید کتاب':'خرید کتاب جدید'}</h3>
    <div class="field"><label>عنوان کتاب</label><input id="f-bp-title" value="${b?b.title:''}" placeholder="مثلاً: General English Coursebook 1"></div>
    <div class="field-row">
      <div class="field"><label>منبع (کتاب‌فروشی/مطبعه)</label><input id="f-bp-source" list="dl-book-sources" value="${b?b.source||'':''}" placeholder="مثلاً: مطبعهٔ آریانا">
        <datalist id="dl-book-sources">${Array.from(new Set(db.bookPurchases.map(x=>x.source).filter(Boolean))).map(s=>`<option value="${s}">`).join('')}</datalist>
      </div>
      <div class="field"><label>شعبه</label><select id="f-bp-branch">${categoryOptionsHtml(BRANCHES, b?b.branch:BRANCHES[0])}</select></div>
    </div>
    <div class="field-row">
      <div class="field"><label>تعداد</label><input id="f-bp-qty" type="number" min="0" value="${b?b.quantity||'':''}" oninput="updateBookPurchaseCalc()"></div>
      <div class="field"><label>قیمت واحد (افغانی)</label><input id="f-bp-unit" class="money-input" value="${b&&b.unitCost?numFmt(b.unitCost):''}" oninput="formatMoneyInput(this); updateBookPurchaseCalc();"></div>
    </div>
    <div class="calc-box"><span>مجموع هزینهٔ سفارش</span><b id="f-bp-total-display">${afn(b?b.totalCost||0:0)}</b></div>
    <div class="field" style="margin-top:12px;"><label>تاریخ سفارش</label>${jalaliPicker('f-bp-date', b?b.date:null)}</div>

    <div class="sectiontitle">وضعیت پرداخت به منبع</div>
    <div class="field-row">
      <div class="field"><label>مبلغ پرداخت‌شده تاکنون</label><input id="f-bp-paid" class="money-input" value="${b&&b.paidAmount?numFmt(b.paidAmount):''}" oninput="formatMoneyInput(this); updateBookPurchaseCalc();" placeholder="۰"></div>
      <div class="field"><label>تاریخ پرداخت</label>${jalaliPicker('f-bp-paid-date', b?b.paidDate:null)}</div>
    </div>
    <div class="calc-box"><span>باقیماندهٔ قابل پرداخت به منبع</span><b id="f-bp-remaining-display">${afn(b?(b.totalCost||0)-(b.paidAmount||0):0)}</b></div>
    <div class="field" style="margin-top:12px;"><label>تاریخ سررسید باقیمانده (اختیاری)</label>${jalaliPicker('f-bp-due-date', b?b.dueDate:null)}</div>

    <div class="field"><label>توضیحات</label><input id="f-bp-note" value="${b?b.note||'':''}"></div>
    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">انصراف</button>
      <button class="btn" onclick="saveBookPurchase(${b?`'${b.id}'`:'null'})">ذخیره</button>
    </div>
  `);
}
function updateBookPurchaseCalc(){
  const qty = Number(document.getElementById('f-bp-qty').value)||0;
  const unit = moneyNum('f-bp-unit');
  const total = qty*unit;
  document.getElementById('f-bp-total-display').textContent = afn(total);
  const paid = moneyNum('f-bp-paid');
  document.getElementById('f-bp-remaining-display').textContent = afn(Math.max(0, total-paid));
}
function saveBookPurchase(id){
  const qty = Number(document.getElementById('f-bp-qty').value)||0;
  const unit = moneyNum('f-bp-unit');
  const rec = {
    id: id || uid(),
    title: document.getElementById('f-bp-title').value.trim() || 'بدون‌عنوان',
    source: document.getElementById('f-bp-source').value.trim(),
    branch: document.getElementById('f-bp-branch').value,
    quantity: qty, unitCost: unit, totalCost: qty*unit,
    date: jalaliPickerValue('f-bp-date'),
    paidAmount: moneyNum('f-bp-paid'),
    paidDate: jalaliPickerValue('f-bp-paid-date'),
    dueDate: jalaliPickerValue('f-bp-due-date'),
    note: document.getElementById('f-bp-note').value.trim(),
  };
  if(id){ const idx = db.bookPurchases.findIndex(x=>x.id===id); db.bookPurchases[idx]=rec; }
  else { db.bookPurchases.unshift(rec); }
  logAction(id?'ویرایش':'ایجاد', 'خرید کتاب', `${rec.title} · ${rec.source} · ${afn(rec.totalCost)}`);
  closeModal(); save();
}
function deleteBookPurchase(id){ if(!confirm('این خرید حذف شود؟')) return; const it=db.bookPurchases.find(x=>x.id===id); db.bookPurchases = db.bookPurchases.filter(x=>x.id!==id); logAction('حذف','خرید کتاب',it?it.title:''); save(); }
function bookSaleIncome(s){ return (s.bookPrice||0) + (s.idCardPrice||0); }
function openBookSourceHistoryModal(source){
  const orders = db.bookPurchases.filter(b=>b.source===source);
  const totalCost = orders.reduce((s,b)=>s+(Number(b.totalCost)||0),0);
  const totalPaid = orders.reduce((s,b)=>s+(Number(b.paidAmount)||0),0);
  const totalRemaining = totalCost - totalPaid;
  openModal(`
    <h3>سابقهٔ سفارش‌ها · ${source}</h3>
    <div class="cards" style="grid-template-columns:repeat(3,1fr); margin-bottom:16px;">
      <div class="card c-cost"><div class="label">مجموع سفارش‌ها</div><div class="value cost" style="font-size:15px;">${afn(totalCost)}</div></div>
      <div class="card c-income"><div class="label">مجموع پرداخت‌شده</div><div class="value income" style="font-size:15px;">${afn(totalPaid)}</div></div>
      <div class="card c-info"><div class="label">باقیماندهٔ بدهی به این منبع</div><div class="value info" style="font-size:15px;">${afn(totalRemaining)}</div></div>
    </div>
    <div class="table-scroll"><table>
      <thead><tr><th>عنوان</th><th>شعبه</th><th>تعداد</th><th>مجموع هزینه</th><th>پرداخت‌شده</th><th>باقیمانده</th><th>تاریخ سفارش</th><th>سررسید</th></tr></thead>
      <tbody>${orders.map(b=>`
        <tr>
          <td>${b.title}</td><td>${b.branch||'-'}</td><td class="num">${faDigits(b.quantity||0)}</td>
          <td class="num">${afn(b.totalCost)}</td><td class="num">${afn(b.paidAmount||0)}</td>
          <td class="num">${afn((b.totalCost||0)-(b.paidAmount||0))}</td>
          <td>${toJalali(b.date)}</td><td>${b.dueDate?toJalali(b.dueDate):'-'}</td>
        </tr>
      `).join('')}</tbody>
    </table></div>
    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">بستن</button>
    </div>
  `, {wide:true});
}
function renderBooks(){
  document.getElementById('book-purchases-empty').style.display = db.bookPurchases.length? 'none':'block';
  document.getElementById('book-purchases-table').innerHTML = db.bookPurchases.map(b=>{
    const remaining = (b.totalCost||0)-(b.paidAmount||0);
    return `<tr>
      <td>${b.title}</td><td>${b.source?`<span class="code-badge" onclick="openBookSourceHistoryModal('${b.source.replace(/'/g,"\\'")}')">${b.source}</span>`:'-'}</td><td>${b.branch||'-'}</td><td class="num">${faDigits(b.quantity||0)}</td>
      <td class="num">${afn(b.unitCost)}</td><td class="num">${afn(b.totalCost)}</td>
      <td class="num">${afn(b.paidAmount||0)}</td><td class="num">${remaining>0?`<span class="tag cost">${afn(remaining)}</span>`:`<span class="tag income">تسویه</span>`}</td>
      <td>${b.dueDate?toJalali(b.dueDate):'-'}</td><td>${toJalali(b.date)}</td>
      <td><div class="row-actions">
        <button class="icon-btn" onclick="openBookPurchaseModal('${b.id}')" title="ویرایش"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></button>
        <button class="icon-btn" onclick="deleteBookPurchase('${b.id}')" title="حذف"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14"/></svg></button>
      </div></td>
    </tr>`;
  }).join('');

  // Purchase totals (مجموع هزینه · پرداخت‌شده · باقیمانده)
  const pTotalCost = db.bookPurchases.reduce((s,b)=>s+(Number(b.totalCost)||0),0);
  const pTotalPaid = db.bookPurchases.reduce((s,b)=>s+(Number(b.paidAmount)||0),0);
  const pTotalRemain = pTotalCost - pTotalPaid;
  const bpFoot = document.getElementById('book-purchases-foot');
  if(bpFoot) bpFoot.innerHTML = db.bookPurchases.length
    ? `<tr class="totals-row"><td colspan="5"><b>مجموع</b></td><td class="num"><b>${afn(pTotalCost)}</b></td><td class="num"><b>${afn(pTotalPaid)}</b></td><td class="num"><b>${afn(pTotalRemain)}</b></td><td colspan="3"></td></tr>`
    : '';

  const sources = Array.from(new Set(db.bookPurchases.map(b=>b.source).filter(Boolean)));
  document.getElementById('book-sources-empty').style.display = sources.length? 'none':'block';
  document.getElementById('book-sources-table').innerHTML = sources.map(src=>{
    const orders = db.bookPurchases.filter(b=>b.source===src);
    const cost = orders.reduce((s,b)=>s+(Number(b.totalCost)||0),0);
    const paid = orders.reduce((s,b)=>s+(Number(b.paidAmount)||0),0);
    const remaining = cost-paid;
    return `<tr>
      <td><span class="code-badge" onclick="openBookSourceHistoryModal('${src.replace(/'/g,"\\'")}')">${src}</span></td>
      <td class="num">${faDigits(orders.length)}</td><td class="num">${afn(cost)}</td><td class="num">${afn(paid)}</td>
      <td class="num">${remaining>0?`<span class="tag cost">${afn(remaining)}</span>`:`<span class="tag income">تسویه</span>`}</td>
    </tr>`;
  }).join('');

  const sold = db.students.filter(s=>s.bookTitle || s.idCardPrice);
  document.getElementById('book-sales-empty').style.display = sold.length? 'none':'block';
  document.getElementById('book-sales-table').innerHTML = sold.map(s=>`
    <tr>
      <td>${profileName(s.profileId)}</td><td>${className(s.classId)}</td><td>${s.bookTitle||'-'}</td>
      <td class="num">${s.bookPrice?afn(s.bookPrice):'-'}</td><td>${s.bookTitle?`<span class="tag ${s.bookPaid?'income':'cost'}">${s.bookPaid?'پرداخت‌شده':'پرداخت‌نشده'}</span>`:'-'}</td>
      <td class="num">${s.idCardPrice?afn(s.idCardPrice):'-'}</td><td>${s.idCardPrice?`<span class="tag ${s.idCardPaid?'income':'cost'}">${s.idCardPaid?'پرداخت‌شده':'پرداخت‌نشده'}</span>`:'-'}</td>
      <td>${toJalali(s.registerDate)}</td>
    </tr>
  `).join('');

  // Sales totals (قیمت کتاب · قیمت کارت)
  const sTotalBook = sold.reduce((s,st)=>s+(Number(st.bookPrice)||0),0);
  const sTotalCard = sold.reduce((s,st)=>s+(Number(st.idCardPrice)||0),0);
  const bsFoot = document.getElementById('book-sales-foot');
  if(bsFoot) bsFoot.innerHTML = sold.length
    ? `<tr class="totals-row"><td colspan="3"><b>مجموع</b></td><td class="num"><b>${afn(sTotalBook)}</b></td><td></td><td class="num"><b>${afn(sTotalCard)}</b></td><td colspan="2"></td></tr>`
    : '';

  const totalCost = db.bookPurchases.reduce((s,b)=>s+(Number(b.totalCost)||0),0);
  const totalIncome = db.students.reduce((s,st)=>s + ((st.bookPaid?st.bookPrice||0:0) + (st.idCardPaid?st.idCardPrice||0:0)), 0);
  const profit = totalIncome - totalCost;
  document.getElementById('books-summary-cards').innerHTML = `
    <div class="card c-income"><div class="label">درآمد کتاب و کارت (دریافت‌شده)</div><div class="value income">${afn(totalIncome)}</div></div>
    <div class="card c-cost"><div class="label">هزینهٔ خرید از کتاب‌فروشی/مطبعه</div><div class="value cost">${afn(totalCost)}</div></div>
    <div class="card c-profit"><div class="label">سود خالص این بخش</div><div class="value profit">${afn(profit)}</div></div>
  `;

  const now = new Date();
  const months = []; for(let i=5;i>=0;i--) months.push(new Date(now.getFullYear(), now.getMonth()-i, 1));
  const trend = months.map(d=>{
    const y=d.getFullYear(), m=d.getMonth();
    const inMonth = dateStr=>{ if(!dateStr) return false; const dd=new Date(dateStr+'T00:00:00'); return dd.getFullYear()===y && dd.getMonth()===m; };
    const cost = db.bookPurchases.filter(b=>inMonth(b.date)).reduce((s,b)=>s+(Number(b.totalCost)||0),0);
    const income = db.students.filter(s=>inMonth(s.registerDate)).reduce((s,st)=>s + ((st.bookPaid?st.bookPrice||0:0) + (st.idCardPaid?st.idCardPrice||0:0)), 0);
    const [jy,jm] = g2jParts(`${y}-${String(m+1).padStart(2,'0')}-01`);
    return { label: AFG_MONTHS[jm-1], income, cost, profit: income-cost };
  });
  const max = Math.max(1, ...trend.map(d=>Math.max(d.income, d.cost, Math.abs(d.profit))));
  document.getElementById('books-trend-chart').innerHTML = trend.map(d=>`
    <div class="trend-chart-bar-group">
      <div class="trend-chart-bar-wrap">
        <div class="trend-chart-bar" style="background:var(--income); height:${Math.max(4,(d.income/max)*105)}px;" title="درآمد: ${afn(d.income)}"></div>
        <div class="trend-chart-bar" style="background:var(--cost); height:${Math.max(4,(d.cost/max)*105)}px;" title="هزینه: ${afn(d.cost)}"></div>
        <div class="trend-chart-bar" style="background:var(--brand); height:${Math.max(4,(Math.abs(d.profit)/max)*105)}px;" title="سود: ${afn(d.profit)}"></div>
      </div>
      <div class="trend-chart-label">${d.label}</div>
    </div>
  `).join('');
}

/* ---------------- Shareholders ---------------- */
function shareholdersToRows(list){
  return list.map(sh=>({ 'کد': sh.code, 'نام': sh.name, 'سهم از سود (٪)': sh.sharePercent||0, 'شماره تماس': sh.phone||'', 'توضیحات': sh.note||'' }));
}
function openShareholderModal(id){
  const sh = id ? db.shareholders.find(x=>x.id===id) : null;
  openModal(`
    <h3>${sh?'ویرایش سهامدار':'سهامدار جدید'}</h3>
    ${sh?`<p class="sub">کد: <span class="code-badge" style="cursor:default;">${sh.code||'-'}</span></p>`:`<p class="sub">کد یکتا پس از ذخیره به‌صورت خودکار ساخته می‌شود</p>`}
    <div class="field"><label>نام</label><input id="f-sh-name" value="${sh?sh.name:''}"></div>
    <div class="field-row">
      <div class="field"><label>سهم از سود (٪)</label><input id="f-sh-share" type="number" min="0" max="100" value="${sh?sh.sharePercent||'':''}"></div>
      <div class="field"><label>شماره تماس</label><input id="f-sh-phone" value="${sh?sh.phone||'':''}"></div>
    </div>
    <div class="field"><label>توضیحات</label><input id="f-sh-note" value="${sh?sh.note||'':''}"></div>
    <p class="hint">مجموع سهم همهٔ سهامداران بهتر است ۱۰۰٪ باشد؛ در حال حاضر مجموع = <b id="sh-total-check"></b></p>
    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">انصراف</button>
      <button class="btn" onclick="saveShareholder(${sh?`'${sh.id}'`:'null'})">ذخیره</button>
    </div>
  `);
  const totalNow = db.shareholders.filter(x=>!sh||x.id!==sh.id).reduce((s,x)=>s+(Number(x.sharePercent)||0),0);
  document.getElementById('sh-total-check').textContent = faDigits(totalNow) + '٪ (بدون احتساب این فرم)';
}
function saveShareholder(id){
  const existing = id ? db.shareholders.find(x=>x.id===id) : null;
  const createdAt = existing ? (existing.createdAt||todayISO()) : todayISO();
  const rec = {
    id: id || uid(),
    code: existing ? existing.code : generateShareholderCode(createdAt),
    name: document.getElementById('f-sh-name').value.trim() || 'بدون‌نام',
    sharePercent: Number(document.getElementById('f-sh-share').value)||0,
    phone: document.getElementById('f-sh-phone').value.trim(),
    photo: existing ? (existing.photo||'') : '',
    idPhoto: existing ? (existing.idPhoto||'') : '',
    password: existing ? (existing.password || generateUniquePassword()) : generateUniquePassword(),
    note: document.getElementById('f-sh-note').value.trim(),
    createdAt,
  };
  if(id){ const idx = db.shareholders.findIndex(x=>x.id===id); db.shareholders[idx]=rec; }
  else { db.shareholders.unshift(rec); }
  logAction(id?'ویرایش':'ایجاد', 'سهامدار', `${rec.name} · ${faDigits(rec.sharePercent)}٪`);
  closeModal(); save();
}
function deleteShareholder(id){ if(!confirm('این سهامدار حذف شود؟')) return; const it=db.shareholders.find(x=>x.id===id); db.shareholders = db.shareholders.filter(x=>x.id!==id); logAction('حذف','سهامدار',it?it.name:''); save(); }
function openShareholderProfileModal(id){
  const sh = db.shareholders.find(x=>x.id===id); if(!sh) return;
  openModal(`
    <h3>پروندهٔ سهامدار</h3>
    <p class="sub">کد: <span class="code-badge" style="cursor:default;">${sh.code||'-'}</span> · سهم: ${faDigits(sh.sharePercent||0)}٪</p>
    <div class="panel" style="background:var(--panel-2); padding:12px 14px; margin-bottom:16px;">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <span style="font-size:12.5px; color:var(--text-dim);">رمز عبور ورود این سهامدار:</span>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="code-badge" style="cursor:default;">${sh.password||'-'}</span>
          <button class="btn ghost small" onclick="regenerateShareholderPassword('${sh.id}')">تولید رمز جدید</button>
        </div>
      </div>
    </div>
    <div class="profile-grid">
      <div class="upload-box">
        <label>عکس سهامدار</label>
        ${sh.photo?`<img src="${sh.photo}">`:''}
        <input type="file" accept="image/*" onchange="readImageAsDataURL(this, url=>{ const s=db.shareholders.find(x=>x.id==='${sh.id}'); s.photo=url; save(); openShareholderProfileModal('${sh.id}'); })">
      </div>
      <div class="upload-box">
        <label>عکس سند هویت</label>
        ${sh.idPhoto?`<img src="${sh.idPhoto}">`:''}
        <input type="file" accept="image/*" onchange="readImageAsDataURL(this, url=>{ const s=db.shareholders.find(x=>x.id==='${sh.id}'); s.idPhoto=url; save(); openShareholderProfileModal('${sh.id}'); })">
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">بستن</button>
      <button class="btn" onclick="closeModal(); openShareholderModal('${sh.id}');">ویرایش اطلاعات</button>
    </div>
  `, {wide:true});
}
function institutionTotals(inF){
  const filterFn = inF || (()=>true);
  const donIncome = db.donations.filter(d=>filterFn(d.date)).reduce((s,d)=>s+donationNetAmount(d),0);
  const tuition = db.students.filter(s=>filterFn(s.registerDate)).reduce((s,st)=>s+(Number(st.paidAmount)||0),0);
  const seminarIncome = db.seminars.filter(sm=>filterFn(sm.date)).reduce((s,sm)=>s+seminarRevenue(sm),0);
  const bookIncome = db.students.filter(s=>filterFn(s.registerDate)).reduce((s,st)=>s + ((st.bookPaid?st.bookPrice||0:0) + (st.idCardPaid?st.idCardPrice||0:0)), 0);
  const bookCost = db.bookPurchases.filter(b=>filterFn(b.date)).reduce((s,b)=>s+(Number(b.totalCost)||0),0);
  const expenses = db.expenses.filter(e=>filterFn(e.date)).reduce((s,e)=>s+(Number(e.amount)||0),0);
  const income = donIncome + tuition + seminarIncome + bookIncome;
  const cost = expenses + bookCost;
  return { income, cost, net: income-cost, donIncome, tuition, seminarIncome, bookIncome, bookCost, expenses };
}
function institutionNetProfit(){
  return institutionTotals(null).net;
}
function renderShareholders(){
  document.getElementById('shareholders-empty').style.display = db.shareholders.length? 'none':'block';
  document.getElementById('shareholders-table').innerHTML = db.shareholders.map(sh=>`
    <tr>
      <td><span class="code-badge" onclick="openShareholderProfileModal('${sh.id}')">${sh.code||'-'}</span></td>
      <td>${sh.name}</td><td class="num">${faDigits(sh.sharePercent||0)}٪</td><td>${sh.phone||'-'}</td>
      <td><div class="row-actions">
        <button class="icon-btn" onclick="openShareholderModal('${sh.id}')" title="ویرایش"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></button>
        <button class="icon-btn" onclick="deleteShareholder('${sh.id}')" title="حذف"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14"/></svg></button>
      </div></td>
    </tr>
  `).join('');

  const net = institutionNetProfit();
  document.getElementById('shareholder-split-cards').innerHTML = db.shareholders.map(sh=>{
    const share = Math.round(net * (Number(sh.sharePercent)||0)/100);
    return `<div class="card c-profit"><div class="label">${sh.name} (${faDigits(sh.sharePercent||0)}٪)</div><div class="value profit">${afn(share)}</div></div>`;
  }).join('') + `<div class="card c-income"><div class="label">سود خالص کل مؤسسه (همهٔ منابع)</div><div class="value income">${afn(net)}</div></div>`;
}

/* ---------------- Activity Log ---------------- */
function formatLogTime(iso){
  const d = new Date(iso);
  const dateStr = toJalali(d.toISOString().slice(0,10));
  const hh = String(d.getHours()).padStart(2,'0'), mm = String(d.getMinutes()).padStart(2,'0');
  return `${dateStr} ، ${faDigits(hh)}:${faDigits(mm)}`;
}
function renderActivityLog(){
  const tbl = document.getElementById('activity-log-table');
  const emptyEl = document.getElementById('activity-log-empty');
  if(!tbl) return;
  const log = db.activityLog || [];
  emptyEl.style.display = log.length? 'none':'block';
  const { pageItems, totalPages } = paginateList('activityLog', log);
  tbl.innerHTML = pageItems.map(l=>`
    <tr>
      <td style="white-space:nowrap;">${formatLogTime(l.ts)}</td>
      <td><span class="tag info">${ROLE_LABELS[l.role]||l.role}</span></td>
      <td>${l.actor}</td>
      <td>${l.action}</td>
      <td>${l.entityType}</td>
      <td>${l.label||''}</td>
    </tr>
  `).join('');
  renderPaginationControls('activity-log-pagination', 'activityLog', totalPages, 'renderActivityLog');
}

/* ---------------- Access PINs (settings) ---------------- */
function renderSettingsPins(){
  const panel = document.getElementById('settings-pins-panel');
  if(panel){
    panel.style.display = currentRole==='shareholder' ? 'block' : 'none';
  }
  const refPanel = document.getElementById('settings-referral-panel');
  if(refPanel){
    refPanel.style.display = (currentRole==='shareholder'||currentRole==='manager') ? 'block' : 'none';
    if(refPanel.style.display==='block'){
      document.getElementById('f-ref-referrer').value = db.referralSettings.referrerDiscount;
      document.getElementById('f-ref-referee').value = db.referralSettings.refereeDiscount;
    }
  }
  const taxPanel = document.getElementById('settings-tax-panel');
  if(taxPanel){
    taxPanel.style.display = currentRole==='shareholder' ? 'block' : 'none';
    if(taxPanel.style.display==='block'){
      document.getElementById('f-teacher-tax').value = db.teacherTaxPercent;
    }
  }
}
function saveTeacherTaxSettings(){
  if(currentRole!=='shareholder'){ alert('فقط سهامداران می‌توانند درصد مالیات را تغییر دهند.'); return; }
  const val = Math.max(0, Math.min(100, Number(document.getElementById('f-teacher-tax').value)||0));
  db.teacherTaxPercent = val;
  logAction('ویرایش', 'مالیات حقوق مدرسان', `${faDigits(val)}٪`);
  save();
  alert('درصد مالیات حقوق مدرسان ذخیره شد.');
}
function saveReferralSettings(){
  db.referralSettings = {
    referrerDiscount: Number(document.getElementById('f-ref-referrer').value)||0,
    refereeDiscount: Number(document.getElementById('f-ref-referee').value)||0,
  };
  logAction('ویرایش', 'تنظیمات تخفیف معرفی', `معرف: ${db.referralSettings.referrerDiscount}٪ · شاگرد جدید: ${db.referralSettings.refereeDiscount}٪`);
  save();
  alert('درصدهای تخفیف معرفی ذخیره شد.');
}

/* ---------------- Attendance ---------------- */
function classSessionDates(c){
  if(!c.startDate) return [];
  const end = c.endDate || todayISO();
  const dates = [];
  let d = new Date(c.startDate+'T00:00:00');
  const endD = new Date(end+'T00:00:00');
  while(d<=endD){
    if(d.getDay()!==5){ // 5 = Friday (day off)
      dates.push(d.toISOString().slice(0,10));
    }
    d.setDate(d.getDate()+1);
  }
  return dates;
}
function attendanceRecord(classId, date){
  return db.attendance.find(a=>a.classId===classId && a.date===date);
}
function classAttendanceTotals(classId){
  let present=0, absent=0;
  db.attendance.filter(a=>a.classId===classId).forEach(r=>{
    Object.values(r.marks).forEach(v=>{ if(v===true) present++; else if(v===false) absent++; });
  });
  return { present, absent };
}
function studentAttendanceTotals(classId, enrollmentId){
  let present=0, absent=0;
  db.attendance.filter(a=>a.classId===classId).forEach(r=>{
    const v = r.marks[enrollmentId];
    if(v===true) present++; else if(v===false) absent++;
  });
  return { present, absent };
}
let attendanceDirty = false;
function attCellId(classId, date, enrollmentId){ return `att-cell__${classId}__${date}__${enrollmentId}`; }
function setAttendanceDirty(dirty){
  attendanceDirty = dirty;
  const btn = document.getElementById('att-save-btn');
  const badge = document.getElementById('att-unsaved-badge');
  if(btn) btn.disabled = !dirty;
  if(badge) badge.style.display = dirty ? 'inline' : 'none';
}
function renderAttendanceClassOptions(){
  const sel = document.getElementById('att-class-select'); if(!sel) return;
  const prevVal = sel.value;
  let classList = db.classes;
  if(currentRole==='teacher') classList = classList.filter(c=>c.teacherId===currentTeacherId);
  sel.innerHTML = '<option value="">انتخاب کنید</option>' + classList.map(c=>
    `<option value="${c.id}">${c.name||c.category} · ${c.branch||'-'}</option>`
  ).join('');
  if(classList.some(c=>c.id===prevVal)) sel.value = prevVal;
  renderAttendanceGrid();
}
function onAttendanceClassChange(){
  if(attendanceDirty) commitAttendanceSave(true, attendanceActiveClassId);
  paginationState['attendance__'+document.getElementById('att-class-select').value] = 1;
  renderAttendanceGrid();
}
let attendanceActiveClassId = '';
function syncAttendanceButtonUI(){
  const btn = document.getElementById('att-save-btn');
  const badge = document.getElementById('att-unsaved-badge');
  if(btn) btn.disabled = !attendanceDirty;
  if(badge) badge.style.display = attendanceDirty ? 'inline' : 'none';
}
function renderAttendanceGrid(){
  const classId = document.getElementById('att-class-select').value;
  attendanceActiveClassId = classId;
  const wrap = document.getElementById('att-grid-wrap');
  const emptyEl = document.getElementById('attendance-empty');
  syncAttendanceButtonUI();
  if(!classId){ wrap.innerHTML=''; emptyEl.style.display='none'; return; }
  const c = db.classes.find(x=>x.id===classId);
  const enrolled = db.students.filter(s=>s.classId===classId);
  const dates = classSessionDates(c);
  if(!c || !enrolled.length || !dates.length){ wrap.innerHTML=''; emptyEl.style.display='block'; return; }
  emptyEl.style.display='none';

  const attKey = 'attendance__'+classId;
  const { pageItems: enrolledPage, totalPages } = paginateList(attKey, enrolled);

  const head = `<th style="position:sticky; right:0; background:var(--panel-2); min-width:150px;">شاگرد</th>` +
    dates.map(d=>`<th style="min-width:34px; font-size:10px;">${faDigits(new Date(d+'T00:00:00').getDate())}<br>${AFG_MONTHS[g2jParts(d)[1]-1].slice(0,3)}</th>`).join('') +
    `<th style="min-width:70px;">حاضر/غایب</th>`;
  const rows = enrolledPage.map(s=>{
    const cells = dates.map(d=>{
      const rec = attendanceRecord(classId, d);
      const mark = rec ? rec.marks[s.id] : undefined;
      const symbol = mark===true ? '✓' : mark===false ? '✕' : '-';
      const color = mark===true ? 'var(--income)' : mark===false ? 'var(--cost)' : 'var(--text-faint)';
      return `<td id="${attCellId(classId,d,s.id)}" style="text-align:center; cursor:pointer; color:${color}; font-weight:700;" onclick="cycleAttendance('${classId}','${d}','${s.id}')">${symbol}</td>`;
    }).join('');
    const tot = studentAttendanceTotals(classId, s.id);
    return `<tr><td style="position:sticky; right:0; background:var(--panel);">${profileName(s.profileId)}</td>${cells}<td class="num" id="att-summary__${classId}__${s.id}">${faDigits(tot.present)} / ${faDigits(tot.absent)}</td></tr>`;
  }).join('');

  wrap.innerHTML = `
    <p class="hint" style="margin:10px 0;">روی هر خانه کلیک کنید تا بین «نامشخص»، «حاضر ✓» و «غایب ✕» تغییر کند؛ در پایان حتماً روی «ذخیرهٔ حضور و غیاب» بزنید.</p>
    <div class="table-scroll"><table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>
    <div class="pagination" id="att-grid-pagination"></div>
  `;
  renderPaginationControls('att-grid-pagination', attKey, totalPages, 'renderAttendanceGrid');
}
function cycleAttendance(classId, date, enrollmentId){
  let rec = attendanceRecord(classId, date);
  if(!rec){ rec = { classId, date, marks:{} }; db.attendance.push(rec); }
  const current = rec.marks[enrollmentId];
  const next = current===undefined ? true : current===true ? false : undefined;
  if(next===undefined) delete rec.marks[enrollmentId];
  else rec.marks[enrollmentId] = next;

  const cell = document.getElementById(attCellId(classId,date,enrollmentId));
  if(cell){
    cell.textContent = next===true ? '✓' : next===false ? '✕' : '-';
    cell.style.color = next===true ? 'var(--income)' : next===false ? 'var(--cost)' : 'var(--text-faint)';
  }
  const tot = studentAttendanceTotals(classId, enrollmentId);
  const summaryCell = document.getElementById(`att-summary__${classId}__${enrollmentId}`);
  if(summaryCell) summaryCell.textContent = `${faDigits(tot.present)} / ${faDigits(tot.absent)}`;

  setAttendanceDirty(true);
}
function commitAttendanceSave(silent, classIdOverride){
  const classId = classIdOverride || document.getElementById('att-class-select').value;
  const c = db.classes.find(x=>x.id===classId);
  logAction('ذخیره', 'حضور و غیاب', c?(c.name||c.category):'');
  setAttendanceDirty(false);
  save();
  if(!silent){
    const btn = document.getElementById('att-save-btn');
    if(btn){
      const original = 'ذخیرهٔ حضور و غیاب';
      btn.textContent = 'ذخیره شد ✓';
      setTimeout(()=>{ if(btn) btn.textContent = original; }, 1500);
    }
  }
}

function monthlyTrendData(){
  const now = new Date();
  const months = [];
  for(let i=5;i>=0;i--) months.push(new Date(now.getFullYear(), now.getMonth()-i, 1));
  return months.map(d=>{
    const y=d.getFullYear(), m=d.getMonth();
    const inMonth = dateStr=>{ if(!dateStr) return false; const dd=new Date(dateStr+'T00:00:00'); return dd.getFullYear()===y && dd.getMonth()===m; };
    const dons = db.donations.filter(x=>inMonth(x.date));
    const exps = db.expenses.filter(x=>inMonth(x.date));
    const income = dons.reduce((s,x)=>s+donationNetAmount(x),0);
    const cost = exps.reduce((s,x)=>s+(Number(x.amount)||0),0);
    const [jy,jm] = g2jParts(`${y}-${String(m+1).padStart(2,'0')}-01`);
    return { label: AFG_MONTHS[jm-1], income, cost, profit: income-cost };
  });
}
function renderMonthlyTrend(){
  const data = monthlyTrendData();
  const max = Math.max(1, ...data.map(d=>Math.max(d.income, d.cost, Math.abs(d.profit))));
  document.getElementById('trend-chart').innerHTML = data.map(d=>`
    <div class="trend-chart-bar-group">
      <div class="trend-chart-bar-wrap">
        <div class="trend-chart-bar" style="background:var(--income); height:${Math.max(4,(d.income/max)*105)}px;" title="درآمد: ${afn(d.income)}"></div>
        <div class="trend-chart-bar" style="background:var(--cost); height:${Math.max(4,(d.cost/max)*105)}px;" title="هزینه: ${afn(d.cost)}"></div>
        <div class="trend-chart-bar" style="background:var(--brand); height:${Math.max(4,(Math.abs(d.profit)/max)*105)}px;" title="باقیمانده: ${afn(d.profit)}"></div>
      </div>
      <div class="trend-chart-label">${d.label}</div>
    </div>
  `).join('');
}
function renderReport(){
  const exps = db.expenses.filter(e=>inRange(e.date));
  const tot = institutionTotals(inRange);
  const { income, cost, net } = tot;

  document.getElementById('report-cards').innerHTML = `
    <div class="card c-income"><div class="label">مجموع درآمد کل مؤسسه</div><div class="value income">${afn(income)}</div></div>
    <div class="card c-cost"><div class="label">مجموع هزینه‌های کل مؤسسه</div><div class="value cost">${afn(cost)}</div></div>
    <div class="card c-profit"><div class="label">سود خالص کل مؤسسه</div><div class="value profit">${afn(net)}</div></div>
    <div class="card c-info"><div class="label">شهریه / سایر درآمد / رویداد / کتاب</div><div class="value info" style="font-size:13px;">${afn(tot.tuition)} · ${afn(tot.donIncome)} · ${afn(tot.seminarIncome)} · ${afn(tot.bookIncome)}</div></div>
  `;

  const max = Math.max(income, cost, Math.abs(net), 1);
  document.getElementById('bar-income').style.height = Math.max(4,(income/max)*130)+'px';
  document.getElementById('bar-cost').style.height = Math.max(4,(cost/max)*130)+'px';
  document.getElementById('bar-profit').style.height = Math.max(4,(Math.abs(net)/max)*130)+'px';
  document.getElementById('bar-profit').style.background = net>=0 ? 'linear-gradient(180deg,var(--gold-soft),var(--gold-dim))' : 'linear-gradient(180deg,var(--cost),#8c4235)';

  const activeClasses = db.classes.filter(c=>classStatus(c)==='در حال برگزاری').length;
  const finishedClasses = db.classes.filter(c=>classStatus(c)==='پایان‌یافته').length;
  const upcomingClasses = db.classes.filter(c=>classStatus(c)==='آینده').length;
  const paidStudents = db.students.filter(s=>studentStatus(s)==='پرداخت‌شده').length;
  const unpaidStudents = db.students.filter(s=>studentStatus(s)==='پرداخت‌نشده' || studentStatus(s)==='پرداخت جزئی').length;
  const freeStudents = db.students.filter(s=>studentStatus(s)==='رایگان').length;
  const tuitionNet = db.students.reduce((s,st)=>s+studentNetFee(st),0);
  const tuitionPaid = db.students.reduce((s,st)=>s+(Number(st.paidAmount)||0),0);
  const seminarsInRange = db.seminars.filter(s=>inRange(s.date));
  const seminarRevenueTotal = seminarsInRange.reduce((s,sm)=>s+seminarRevenue(sm),0);

  document.getElementById('report-ops-cards').innerHTML = `
    <div class="card c-info"><div class="label">مجموع شاگردها</div><div class="value info">${faDigits(db.students.length)}</div></div>
    <div class="card c-income"><div class="label">شاگردها پرداخت‌شده</div><div class="value income">${faDigits(paidStudents)}</div></div>
    <div class="card c-cost"><div class="label">شاگردها معوق/جزئی</div><div class="value cost">${faDigits(unpaidStudents)}</div></div>
    <div class="card c-info"><div class="label">شاگردها رایگان</div><div class="value info">${faDigits(freeStudents)}</div></div>
    <div class="card c-income"><div class="label">مجموع شهریهٔ نهایی (پس از تخفیف)</div><div class="value income">${afn(tuitionNet)}</div></div>
    <div class="card c-income"><div class="label">مجموع شهریهٔ پرداخت‌شده</div><div class="value income">${afn(tuitionPaid)}</div></div>
    <div class="card c-income"><div class="label">صنف‌های در حال برگزاری</div><div class="value income">${faDigits(activeClasses)}</div></div>
    <div class="card c-info"><div class="label">صنف‌های آینده</div><div class="value info">${faDigits(upcomingClasses)}</div></div>
    <div class="card c-cost"><div class="label">صنف‌های پایان‌یافته</div><div class="value cost">${faDigits(finishedClasses)}</div></div>
    <div class="card c-info"><div class="label">تعداد مدرسان</div><div class="value info">${faDigits(db.teachers.length)}</div></div>
    <div class="card c-info"><div class="label">تعداد رویدادها (این بازه)</div><div class="value info">${faDigits(seminarsInRange.length)}</div></div>
    <div class="card c-income"><div class="label">درآمد رویدادها (پس از تخفیف)</div><div class="value income">${afn(seminarRevenueTotal)}</div></div>
    <div class="card c-info"><div class="label">تعداد پروژه‌ها</div><div class="value info">${faDigits(db.projects.length)}</div></div>
    <div class="card c-cost"><div class="label">کارهای باز جلسات</div><div class="value cost">${faDigits(db.meetings.reduce((s,m)=>s+(m.tasks||[]).filter(t=>!t.done).length,0))}</div></div>
  `;

  const byCat = {};
  exps.forEach(e=>{ byCat[e.category] = (byCat[e.category]||0) + (Number(e.amount)||0); });
  const rows = Object.keys(byCat).length
    ? Object.entries(byCat).map(([cat,amt])=>`<tr><td>${cat}</td><td class="num">${afn(amt)}</td></tr>`).join('')
    : `<tr><td colspan="2" class="empty">هزینهی در این بازه ثبت نشده.</td></tr>`;
  document.getElementById('report-expense-breakdown').innerHTML = rows;

  const branchStats = BRANCHES.map(b=>{
    const branchClasses = db.classes.filter(c=>c.branch===b);
    const activeBranchClasses = branchClasses.filter(c=>classStatus(c)==='در حال برگزاری').length;
    const branchStudents = db.students.filter(s=>classBranch(s.classId)===b && inRange(s.registerDate));
    const tuitionIncome = branchStudents.reduce((s,st)=>s+(Number(st.paidAmount)||0),0);
    const seminarIncome = db.seminars.filter(sm=>sm.location===b && inRange(sm.date)).reduce((s,sm)=>s+seminarRevenue(sm),0);
    const bookIncome = branchStudents.reduce((s,st)=>s + ((st.bookPaid?st.bookPrice||0:0) + (st.idCardPaid?st.idCardPrice||0:0)), 0);
    const bookCost = db.bookPurchases.filter(bp=>bp.branch===b && inRange(bp.date)).reduce((s,bp)=>s+(Number(bp.totalCost)||0),0);
    const branchIncome = tuitionIncome + seminarIncome + bookIncome;
    const branchExpenses = exps.filter(e=>e.branch===b).reduce((s,e)=>s+(Number(e.amount)||0),0) + bookCost;
    const branchProfit = branchIncome - branchExpenses;
    return { branch:b, activeBranchClasses, studentCount: branchStudents.length, branchIncome, branchExpenses, branchProfit };
  });
  const totStudents = branchStats.reduce((s,d)=>s+d.studentCount,0);
  const totIncome = branchStats.reduce((s,d)=>s+d.branchIncome,0);
  const totExpenses = branchStats.reduce((s,d)=>s+d.branchExpenses,0);
  const totProfitAbs = branchStats.reduce((s,d)=>s+Math.abs(d.branchProfit),0);
  const pct = (val,total)=> total ? `<span style="color:var(--text-faint); font-size:11px;">(٪${faDigits(Math.round(val/total*100))})</span>` : '';

  document.getElementById('report-branch-breakdown').innerHTML = branchStats.map(d=>`
    <tr>
      <td>${d.branch}</td>
      <td class="num">${faDigits(d.activeBranchClasses)}</td>
      <td class="num">${faDigits(d.studentCount)} ${pct(d.studentCount, totStudents)}</td>
      <td class="num">${afn(d.branchIncome)} ${pct(d.branchIncome, totIncome)}</td>
      <td class="num">${afn(d.branchExpenses)} ${pct(d.branchExpenses, totExpenses)}</td>
      <td class="num"><b style="color:${d.branchProfit>=0?'var(--gold-soft)':'var(--cost)'};">${afn(d.branchProfit)}</b> ${pct(Math.abs(d.branchProfit), totProfitAbs)}</td>
    </tr>
  `).join('');

  renderSeasonComparison();
}

/* ---------------- Seasonal (year-over-year) comparison ---------------- */
const SEASONS = { 'بهار':[1,2,3], 'تابستان':[4,5,6], 'پاییز':[7,8,9], 'زمستان':[10,11,12] };
let seasonFilter = 'تابستان';
function onSeasonChange(){
  seasonFilter = document.getElementById('season-select').value;
  renderSeasonComparison();
}
function renderSeasonComparison(){
  const months = SEASONS[seasonFilter];
  const inSeasonYear = (dt, y)=>{ if(!dt) return false; const [jy,jm] = g2jParts(dt); return jy===y && months.includes(jm); };

  const allDates = [
    ...db.classes.map(c=>c.startDate),
    ...db.students.map(s=>s.registerDate),
    ...db.expenses.map(e=>e.date),
    ...db.donations.map(d=>d.date),
    ...db.seminars.map(sm=>sm.date),
    ...db.bookPurchases.map(b=>b.date),
  ].filter(Boolean);
  const yearsSet = new Set(allDates.map(dt=>g2jParts(dt)[0]));
  const years = Array.from(yearsSet).sort((a,b)=>a-b);

  const rows = years.map(y=>{
    const classesCount = db.classes.filter(c=>inSeasonYear(c.startDate,y)).length;
    const seasonStudents = db.students.filter(s=>inSeasonYear(s.registerDate,y));
    const bookIncome = seasonStudents.reduce((s,st)=>s + ((st.bookPaid?st.bookPrice||0:0) + (st.idCardPaid?st.idCardPrice||0:0)), 0);
    const bookCost = db.bookPurchases.filter(b=>inSeasonYear(b.date,y)).reduce((s,b)=>s+(Number(b.totalCost)||0),0);
    const income = db.donations.filter(d=>inSeasonYear(d.date,y)).reduce((s,d)=>s+donationNetAmount(d),0)
                 + seasonStudents.reduce((s,st)=>s+(Number(st.paidAmount)||0),0)
                 + db.seminars.filter(sm=>inSeasonYear(sm.date,y)).reduce((s,sm)=>s+seminarRevenue(sm),0)
                 + bookIncome;
    const cost = db.expenses.filter(e=>inSeasonYear(e.date,y)).reduce((s,e)=>s+(Number(e.amount)||0),0) + bookCost;
    return { y, classesCount, studentsCount: seasonStudents.length, income, cost, profit: income-cost };
  });

  const chg = (curr, prevVal)=>{
    if(prevVal===undefined || prevVal===0) return '';
    const diff = curr - prevVal;
    const pct = Math.round(diff/Math.abs(prevVal)*100);
    const sign = diff>=0 ? '+' : '−';
    const color = diff>=0 ? 'var(--income)' : 'var(--cost)';
    return ` <span style="color:${color}; font-size:11px;">(${sign}${faDigits(Math.abs(pct))}٪)</span>`;
  };

  document.getElementById('season-comparison-table').innerHTML = rows.length ? rows.map((r,i)=>{
    const prev = i>0 ? rows[i-1] : null;
    return `<tr>
      <td>${faDigits(r.y)}</td>
      <td class="num">${faDigits(r.classesCount)}${prev?chg(r.classesCount,prev.classesCount):''}</td>
      <td class="num">${faDigits(r.studentsCount)}${prev?chg(r.studentsCount,prev.studentsCount):''}</td>
      <td class="num">${afn(r.income)}${prev?chg(r.income,prev.income):''}</td>
      <td class="num">${afn(r.cost)}${prev?chg(r.cost,prev.cost):''}</td>
      <td class="num"><b style="color:${r.profit>=0?'var(--gold-soft)':'var(--cost)'};">${afn(r.profit)}</b>${prev?chg(r.profit,prev.profit):''}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="6" class="empty">داده‌ای برای این فصل ثبت نشده.</td></tr>`;
}

/* ---------------- Render all ---------------- */
function renderAll(){
  renderDashboard(); renderClasses(); renderSeminars(); renderStudents(); renderTeachers(); renderDonations(); renderExpenses();
  renderProjects(); renderMeetings(); renderTeacherAdvances(); renderReport(); renderMonthlyTrend();
  renderBooks(); renderShareholders(); renderSettingsPins(); renderActivityLog();
  if(typeof renderDiscountCodes==='function') renderDiscountCodes();
  if(typeof renderMyIncome==='function') renderMyIncome();
  if(typeof renderAssets==='function') renderAssets();
  if(typeof renderTaxReport==='function') renderTaxReport();
  if(document.getElementById('att-class-select') && document.getElementById('att-class-select').value) renderAttendanceGrid();
}
renderReportFilterChips();
renderClassesFilterChips();
renderExpensesFilterChips();
renderExportBars();
updateThemeUI(getCurrentTheme());
renderAll();
renderAttendanceClassOptions();
window.addEventListener('beforeunload', e=>{
  if(attendanceDirty){ e.preventDefault(); e.returnValue=''; }
});

/* ---------------- Access gate bootstrap ---------------- */
(function initAccessGate(){
  const sel = document.getElementById('gate-teacher-select');
  if(sel){
    sel.innerHTML = '<option value="">نام خود را انتخاب کنید</option>' +
      db.teachers.filter(t=>t.role==='مدرس').map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
  }
  const shSel = document.getElementById('gate-shareholder-select');
  if(shSel){
    shSel.innerHTML = '<option value="">نام خود را انتخاب کنید</option>' +
      db.shareholders.map(sh=>`<option value="${sh.id}">${sh.name}</option>`).join('');
  }
  const mgrSel = document.getElementById('gate-manager-select');
  if(mgrSel){
    const managers = db.teachers.filter(t=>t.role==='مدیریت');
    mgrSel.innerHTML = '<option value="">نام خود را انتخاب کنید</option>' +
      managers.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
  }
  const empSel = document.getElementById('gate-employee-select');
  if(empSel){
    const employees = db.teachers.filter(t=>t.role==='کارمند');
    empSel.innerHTML = '<option value="">نام خود را انتخاب کنید</option>' +
      employees.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
  }
  const genBox = document.getElementById('gate-generated-passwords');
  if(genBox && migrationGeneratedPasswords.length){
    genBox.style.display = 'block';
    genBox.innerHTML = '<b>رمزهای عبور تازه‌ساخته‌شده برای این داده‌ها (فقط یک‌بار نمایش داده می‌شود، جایی یادداشت کنید):</b><br>' +
      migrationGeneratedPasswords.map(p=>`${p.name} (${p.role}, ${p.code}): <b class="code-badge" style="cursor:default;">${p.password}</b>`).join('<br>');
  }
  if(currentRole && (currentRole!=='teacher' || currentTeacherId) && currentActorName){
    applyRoleVisibility();
    const hash = window.location.hash.replace(/^#\/?/, '');
    const defaultView = currentRole==='teacher' ? 'classes' : currentRole==='employee' ? 'students' : 'dashboard';
    const targetView = (hash && VIEW_TITLES[hash] && navAllowed(hash)) ? hash : defaultView;
    switchView(targetView, true);
  } else {
    currentRole = ''; currentTeacherId=''; currentActorName='';
    showAccessGate();
    renderQuickLoginCards();
    updateThemeUI(getCurrentTheme());
  }
})();

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const overlay = document.getElementById('overlay');
  if (overlay && overlay.classList.contains('active')) closeModal();
});
