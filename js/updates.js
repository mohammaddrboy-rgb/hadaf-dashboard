/* ================= Teacher income view + Assets section ================= *
 * Loaded after app.js. Depends on app.js globals: db, save, uid, logAction,
 * currentRole, currentTeacherId, faDigits, numFmt, afn, todayISO, toJalali,
 * teacherClassesList, classFeesCollected, classFeesCollectedInMonth,
 * teacherGrossSalary, openModal, closeModal, formatMoneyInput, moneyNum,
 * jalaliPicker, jalaliPickerValue, categoryOptionsHtml, paginateList,
 * renderPaginationControls.
 * ---------------------------------------------------------------------- */

/* ---- Salary payments already made to a teacher (recorded as expenses) ---- */
function teacherSalaryPayments(teacherId){
  const t = db.teachers.find(x=>x.id===teacherId);
  const name = t ? t.name : '';
  return (db.expenses||[]).filter(e =>
    e.teacherId===teacherId ||
    (!e.teacherId && e.category==='حقوق و دستمزد مدرسان' && name && (e.note||'').includes(name))
  );
}

/* ---- Reusable income breakdown block for a teacher ---- */
function teacherIncomeHtml(t){
  if(!t) return '';
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const classes = teacherClassesList(t.id);
  const pct = Number(t.payAmount)||0;
  const isPct = t.payType==='درصد شهریه';
  const isFixed = t.payType==='ماهانه ثابت';

  const monthGross = teacherGrossSalary(t, y, m);

  // Per-class rows (meaningful for percentage & per-class types)
  let classRows = '';
  let lifetimeTotal = 0;
  if(isFixed){
    classRows = `<tr><td colspan="4" class="empty">حقوق شما ماهانهٔ ثابت است (${afn(t.payAmount)}) و به تفکیک هر صنف محاسبه نمی‌شود.</td></tr>`;
    lifetimeTotal = Number(t.payAmount)||0;
  } else if(classes.length){
    classRows = classes.map(c=>{
      const collected = classFeesCollected(c.id);
      const share = isPct ? Math.round(collected * pct / 100) : (Number(t.payAmount)||0);
      lifetimeTotal += share;
      return `<tr>
        <td>${c.name||c.category}</td>
        <td>${c.branch||'-'}</td>
        <td class="num">${afn(collected)}</td>
        <td class="num"><b style="color:var(--gold-soft, var(--income));">${afn(share)}</b></td>
      </tr>`;
    }).join('');
  } else {
    classRows = `<tr><td colspan="4" class="empty">هنوز صنفی به شما اختصاص نیافته است.</td></tr>`;
  }

  const shareHeader = isPct ? 'سهم شما (٪ شهریه)' : 'درآمد شما از این صنف';
  const collectedNote = isPct
    ? `نوع پرداخت شما: <b>درصد شهریه</b> — ${faDigits(pct)}٪ از شهریهٔ جمع‌آوری‌شدهٔ هر صنف.`
    : isFixed
      ? `نوع پرداخت شما: <b>ماهانهٔ ثابت</b> — ${afn(t.payAmount)} در ماه.`
      : `نوع پرداخت شما: <b>به ازای هر صنف</b> — ${afn(t.payAmount)} برای هر صنف در ماه.`;

  // Salary payments received
  const payments = teacherSalaryPayments(t.id).slice().sort((a,b)=> (b.date||'').localeCompare(a.date||''));
  const totalPaid = payments.reduce((s,p)=> s + (Number(p.amount)||0), 0);
  const paymentRows = payments.length ? payments.map(p=>`
    <tr>
      <td>${toJalali(p.date)}</td>
      <td class="num">${afn(p.amount)}</td>
      <td>${(p.salaryPeriodM!=null) ? faDigits(p.salaryPeriodM+1)+'/'+faDigits(p.salaryPeriodY) : '-'}</td>
      <td>${p.note||'-'}</td>
    </tr>`).join('') : `<tr><td colspan="4" class="empty">هنوز حقوقی برای شما ثبت/پرداخت نشده است.</td></tr>`;

  return `
    <div class="sectiontitle">درآمد و حقوق</div>
    <p class="hint" style="margin:-6px 0 12px;">${collectedNote}</p>
    <div class="cards" style="grid-template-columns:repeat(3,1fr); margin-bottom:16px;">
      <div class="card c-income"><div class="label">${isFixed?'حقوق ماهانهٔ ثابت':'درآمد تخمینی این ماه'}</div><div class="value income">${afn(monthGross)}</div></div>
      <div class="card c-profit"><div class="label">${isPct?'مجموع درآمد شما (تجمعی)':'مجموع درآمد تخمینی'}</div><div class="value profit">${afn(lifetimeTotal)}</div></div>
      <div class="card c-info"><div class="label">مجموع حقوق پرداخت‌شده به شما</div><div class="value info">${afn(totalPaid)}</div></div>
    </div>
    <div class="table-scroll"><table>
      <thead><tr><th>صنف</th><th>شعبه</th><th>شهریهٔ جمع‌آوری‌شده</th><th>${shareHeader}</th></tr></thead>
      <tbody>${classRows}</tbody>
    </table></div>
    <div class="sectiontitle" style="margin-top:18px;">حقوق پرداخت‌شده به شما</div>
    <div class="table-scroll"><table>
      <thead><tr><th>تاریخ پرداخت</th><th>مبلغ</th><th>دورهٔ (ماه/سال)</th><th>توضیحات</th></tr></thead>
      <tbody>${paymentRows}</tbody>
    </table></div>
  `;
}

/* ---- Teacher-facing "My income" view ---- */
function renderMyIncome(){
  const root = document.getElementById('myincome-root');
  if(!root) return;
  if(currentRole!=='teacher' || !currentTeacherId){
    root.innerHTML = `<div class="panel"><p style="color:var(--text-dim); text-align:center; padding:12px;">این بخش برای مدرسان است.</p></div>`;
    return;
  }
  const t = db.teachers.find(x=>x.id===currentTeacherId);
  if(!t){ root.innerHTML = `<div class="panel"><p style="color:var(--text-dim); text-align:center; padding:12px;">اطلاعات مدرس یافت نشد.</p></div>`; return; }
  root.innerHTML = `<div class="panel">
    <div class="panel-head"><h2>درآمد ${t.name}</h2></div>
    ${teacherIncomeHtml(t)}
  </div>`;
}

/* ================= Assets (shareholders only) ================= */
const ASSET_CATEGORIES = ['ملک و ساختمان','تجهیزات و لوازم','مبلمان','وسایط نقلیه','تجهیزات صوتی/تصویری و کامپیوتر','کتاب و منابع','سرمایه‌گذاری','سایر'];

function assetsTotalValue(){ return (db.assets||[]).reduce((s,a)=> s + (Number(a.value)||0), 0); }

function renderAssets(){
  const root = document.getElementById('assets-root');
  if(!root) return;
  if(currentRole!=='shareholder'){
    root.innerHTML = `<div class="panel"><p style="color:var(--text-dim); text-align:center; padding:12px;">این بخش فقط برای سهامداران قابل دسترسی است.</p></div>`;
    return;
  }
  const list = db.assets || [];
  const rows = list.length ? list.map(a=>`
    <tr>
      <td>${a.name||'-'}</td>
      <td>${a.category||'-'}</td>
      <td class="num">${afn(a.value)}</td>
      <td>${a.acquiredDate?toJalali(a.acquiredDate):'-'}</td>
      <td>${a.note||'-'}</td>
      <td><div class="row-actions">
        <button class="icon-btn" onclick="openAssetModal('${a.id}')" title="ویرایش"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></button>
        <button class="icon-btn" onclick="deleteAsset('${a.id}')" title="حذف"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14"/></svg></button>
      </div></td>
    </tr>`).join('') : '';

  root.innerHTML = `
    <div class="panel">
      <div class="panel-head" style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <h2>دارایی‌های آموزشگاه هدف</h2>
        <button class="btn" onclick="openAssetModal(null)">افزودن دارایی</button>
      </div>
      <p style="font-size:12.5px; color:var(--text-dim); margin:0 0 14px;">فهرست دارایی‌های مؤسسه. اقلام را می‌توانید هر زمان اضافه، ویرایش یا حذف کنید.</p>
      <div class="cards" style="grid-template-columns:repeat(2,1fr); margin-bottom:16px;">
        <div class="card c-profit"><div class="label">ارزش کل دارایی‌ها</div><div class="value profit">${afn(assetsTotalValue())}</div></div>
        <div class="card c-info"><div class="label">تعداد اقلام</div><div class="value info">${faDigits(list.length)}</div></div>
      </div>
      <div class="table-scroll"><table>
        <thead><tr><th>نام دارایی</th><th>دسته</th><th>ارزش (افغانی)</th><th>تاریخ تملک</th><th>توضیحات</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      ${list.length ? '' : '<div style="color:var(--text-dim); text-align:center; padding:16px;">هنوز دارایی‌ای ثبت نشده است. برای شروع، روی «افزودن دارایی» بزنید.</div>'}
    </div>`;
}

function openAssetModal(id){
  if(currentRole!=='shareholder'){ alert('فقط سهامداران می‌توانند دارایی ثبت کنند.'); return; }
  const a = id ? (db.assets||[]).find(x=>x.id===id) : null;
  openModal(`
    <h3>${a?'ویرایش دارایی':'دارایی جدید'}</h3>
    <div class="field"><label>نام دارایی</label><input id="f-asset-name" value="${a?(a.name||''):''}" placeholder="مثلاً: پروجکتور صنف ۳"></div>
    <div class="field-row">
      <div class="field"><label>دسته</label><select id="f-asset-category">${categoryOptionsHtml(ASSET_CATEGORIES, a?a.category:ASSET_CATEGORIES[0])}</select></div>
      <div class="field"><label>ارزش (افغانی)</label><input id="f-asset-value" class="money-input" value="${a&&a.value?numFmt(a.value):''}" oninput="formatMoneyInput(this)" placeholder="۰"></div>
    </div>
    <div class="field"><label>تاریخ تملک</label>${jalaliPicker('f-asset-date', a?a.acquiredDate:null)}</div>
    <div class="field"><label>توضیحات</label><input id="f-asset-note" value="${a?(a.note||''):''}"></div>
    <div class="modal-actions">
      <button class="btn ghost" onclick="closeModal()">انصراف</button>
      <button class="btn" onclick="saveAsset(${a?`'${a.id}'`:'null'})">ذخیره</button>
    </div>
  `);
}
function saveAsset(id){
  if(currentRole!=='shareholder') return;
  const rec = {
    id: id || uid(),
    name: document.getElementById('f-asset-name').value.trim() || 'بدون‌نام',
    category: document.getElementById('f-asset-category').value,
    value: moneyNum('f-asset-value'),
    acquiredDate: jalaliPickerValue('f-asset-date'),
    note: document.getElementById('f-asset-note').value.trim(),
    createdAt: (id && (db.assets.find(x=>x.id===id)||{}).createdAt) || todayISO(),
  };
  if(!db.assets) db.assets = [];
  if(id){ const idx = db.assets.findIndex(x=>x.id===id); if(idx>=0) db.assets[idx]=rec; }
  else { db.assets.unshift(rec); }
  logAction(id?'ویرایش':'ایجاد', 'دارایی', `${rec.name} · ${afn(rec.value)}`);
  closeModal(); save();
}
function deleteAsset(id){
  if(currentRole!=='shareholder') return;
  const a = (db.assets||[]).find(x=>x.id===id);
  if(!confirm('این دارایی حذف شود؟')) return;
  db.assets = (db.assets||[]).filter(x=>x.id!==id);
  logAction('حذف', 'دارایی', a?a.name:'');
  save();
}

/* Initial paint (loaded after app.js) */
if (typeof renderMyIncome === 'function') renderMyIncome();
if (typeof renderAssets === 'function') renderAssets();
