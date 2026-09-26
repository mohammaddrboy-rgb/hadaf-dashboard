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
        <td>${esc(c.name||c.category)}</td>
        <td>${esc(c.branch||'-')}</td>
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

  // Income tax withheld (percentage set by shareholders)
  const taxPct = (typeof teacherTaxPercent==='function') ? teacherTaxPercent() : (Number(db.teacherTaxPercent)||0);
  const monthTax = Math.round(monthGross * taxPct/100);
  const monthNet = monthGross - monthTax;
  const lifeTax = Math.round(lifetimeTotal * taxPct/100);
  const lifeNet = lifetimeTotal - lifeTax;

  // Salary payments received
  const payments = teacherSalaryPayments(t.id).slice().sort((a,b)=> (b.date||'').localeCompare(a.date||''));
  const totalPaid = payments.reduce((s,p)=> s + (Number(p.amount)||0), 0);
  const paymentRows = payments.length ? payments.map(p=>`
    <tr>
      <td>${toJalali(p.date)}</td>
      <td class="num">${afn(p.amount)}</td>
      <td>${esc((p.salaryPeriodM!=null) ? faDigits(p.salaryPeriodM+1)+'/'+faDigits(p.salaryPeriodY) : '-')}</td>
      <td>${esc(p.note||'-')}</td>
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
      <thead><tr><th>صنف</th><th>شعبه</th><th class="num">شهریهٔ جمع‌آوری‌شده</th><th class="num">${esc(shareHeader)}</th></tr></thead>
      <tbody>${classRows}</tbody>
    </table></div>

    <div class="sectiontitle" style="margin-top:18px;">مالیات حقوق (${faDigits(taxPct)}٪)</div>
    <p class="hint" style="margin:-6px 0 12px;">طبق تصمیم سهامداران، ${faDigits(taxPct)}٪ از حقوق شما به‌عنوان مالیات کسر می‌شود. مبلغ زیر پس از کسر مالیات به شما پرداخت می‌شود.</p>
    <div class="table-scroll"><table>
      <thead><tr><th>دوره</th><th class="num">حقوق ناخالص</th><th class="num">مالیات (${faDigits(taxPct)}٪)</th><th class="num">خالص پس از مالیات</th></tr></thead>
      <tbody>
        <tr><td>${isFixed?'این ماه (ثابت)':'این ماه'}</td><td class="num">${afn(monthGross)}</td><td class="num">${afn(monthTax)}</td><td class="num"><b style="color:var(--income);">${afn(monthNet)}</b></td></tr>
        <tr><td>مجموع (تجمعی)</td><td class="num">${afn(lifetimeTotal)}</td><td class="num">${afn(lifeTax)}</td><td class="num"><b style="color:var(--income);">${afn(lifeNet)}</b></td></tr>
      </tbody>
    </table></div>

    <div class="sectiontitle" style="margin-top:18px;">حقوق پرداخت‌شده به شما</div>
    <div class="table-scroll"><table>
      <thead><tr><th>تاریخ پرداخت</th><th class="num">مبلغ</th><th>دورهٔ (ماه/سال)</th><th>توضیحات</th></tr></thead>
      <tbody>${paymentRows}</tbody>
    </table></div>
    ${typeof teacherDisciplineSummaryHtml==='function' ? teacherDisciplineSummaryHtml(t) : ''}
    ${typeof teacherAdvanceRequestHtml==='function' ? teacherAdvanceRequestHtml(t) : ''}
  `;
}

/* ---- Teacher-facing "My income" view ---- */
function renderMyIncome(){
  const root = document.getElementById('myincome-root');
  if(!root) return;
  const personnelRoles = ['teacher','manager','employee'];
  if(!personnelRoles.includes(currentRole) || !currentTeacherId){
    root.innerHTML = `<div class="panel"><p style="color:var(--text-dim); text-align:center; padding:12px;">این بخش برای پرسنل (مدرس، مدیر شعبه و کارمند) است.</p></div>`;
    return;
  }
  const t = db.teachers.find(x=>x.id===currentTeacherId);
  if(!t){ root.innerHTML = `<div class="panel"><p style="color:var(--text-dim); text-align:center; padding:12px;">اطلاعات پرسنل یافت نشد.</p></div>`; return; }
  root.innerHTML = `<div class="panel">
    <div class="panel-head"><h2>درآمد و حقوق ${esc(t.name)} <span style="font-size:12px; color:var(--text-dim);">(${esc(t.role||'مدرس')})</span></h2></div>
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
      <td>${esc(a.name||'-')}</td>
      <td>${esc(a.category||'-')}</td>
      <td class="num">${afn(a.value)}</td>
      <td>${esc(a.acquiredDate?toJalali(a.acquiredDate):'-')}</td>
      <td>${esc(a.note||'-')}</td>
      <td><div class="row-actions">
        <button class="icon-btn" onclick="openAssetModal('${escJs(a.id)}')" title="ویرایش"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg></button>
        <button class="icon-btn" onclick="deleteAsset('${escJs(a.id)}')" title="حذف"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14"/></svg></button>
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
    <div class="field"><label>نام دارایی</label><input id="f-asset-name" value="${esc(a?(a.name||''):'')}" placeholder="مثلاً: پروجکتور صنف ۳"></div>
    <div class="field-row">
      <div class="field"><label>دسته</label><select id="f-asset-category">${categoryOptionsHtml(ASSET_CATEGORIES, a?a.category:ASSET_CATEGORIES[0])}</select></div>
      <div class="field"><label>ارزش (افغانی)</label><input id="f-asset-value" class="money-input" value="${esc(a&&a.value?numFmt(a.value):'')}" oninput="formatMoneyInput(this)" placeholder="۰"></div>
    </div>
    <div class="field"><label>تاریخ تملک</label>${jalaliPicker('f-asset-date', a?a.acquiredDate:null)}</div>
    <div class="field"><label>توضیحات</label><input id="f-asset-note" value="${esc(a?(a.note||''):'')}"></div>
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

/* ================= Tax report (fees, cash basis) — shareholders only ================= *
 * Income  = tuition fees actually collected (student.paidAmount), attributed to the
 *           enrollment/registration date. Excludes books, student cards, donations, seminars.
 * Costs   = expenses in these categories only (teacher salaries, rent, items for Hadaf use).
 * Net     = fees collected − those costs.
 * All figures respect the selected timeframe and branch.
 * -------------------------------------------------------------------------------------- */
const TAX_COST_CATEGORIES = ['حقوق و دستمزد مدرسان','اجارهٔ شعبه','لوازم آموزشی'];
const taxFilter = { tf: 'all', branch: 'all' };

function taxFeeStudents(){
  return db.students.filter(s=>{
    if(taxFilter.branch!=='all' && classBranch(s.classId)!==taxFilter.branch) return false;
    return inTimeframe(s.registerDate, taxFilter.tf);
  });
}
function taxCostExpenses(){
  return db.expenses.filter(e=>{
    if(!TAX_COST_CATEGORIES.includes(e.category)) return false;
    if(taxFilter.branch!=='all' && e.branch!==taxFilter.branch) return false;
    return inTimeframe(e.date, taxFilter.tf);
  });
}
function taxFeesCollected(){ return taxFeeStudents().reduce((s,st)=> s + (Number(st.paidAmount)||0), 0); }
function taxCostsByCategory(){
  const m = {}; TAX_COST_CATEGORIES.forEach(c=> m[c]=0);
  taxCostExpenses().forEach(e=> m[e.category] += (Number(e.amount)||0));
  return m;
}
function taxFeesByBranch(){
  const m = {}; BRANCHES.forEach(b=> m[b]=0);
  taxFeeStudents().forEach(s=>{ const b = classBranch(s.classId); if(m[b]===undefined) m[b]=0; m[b] += (Number(s.paidAmount)||0); });
  return m;
}
function taxMonthly(){
  const buckets = {};
  const b = (dateStr)=>{ const [jy,jm]=g2jParts(dateStr); const k=jy+'-'+String(jm).padStart(2,'0'); if(!buckets[k]) buckets[k]={jy,jm,fees:0,cost:0}; return buckets[k]; };
  taxFeeStudents().forEach(s=>{ if(s.registerDate) b(s.registerDate).fees += (Number(s.paidAmount)||0); });
  taxCostExpenses().forEach(e=>{ if(e.date) b(e.date).cost += (Number(e.amount)||0); });
  return Object.values(buckets).sort((a,b)=> a.jy-b.jy || a.jm-b.jm);
}

function onTaxFilterChange(){
  const tf = document.getElementById('tax-tf'); const br = document.getElementById('tax-branch');
  taxFilter.tf = tf ? tf.value : 'all';
  taxFilter.branch = br ? br.value : 'all';
  renderTaxReport();
}

function renderTaxReport(){
  const root = document.getElementById('tax-report-root');
  if(!root) return;
  if(currentRole!=='shareholder'){
    root.innerHTML = `<div class="panel"><p style="color:var(--text-dim); text-align:center; padding:12px;">این گزارش فقط برای سهامداران قابل دسترسی است.</p></div>`;
    return;
  }
  const fees = taxFeesCollected();
  const costByCat = taxCostsByCategory();
  const totalCost = Object.values(costByCat).reduce((a,b)=>a+b,0);
  const net = fees - totalCost;
  const byBranch = taxFeesByBranch();
  const monthly = taxMonthly();

  const tfOpts = [
    ['all','همه'],['daily','روزانه'],['weekly','هفتگی'],['monthly','ماهانه'],
    ['quarterly','فصلی'],['biannual','شش‌ماهه'],['annual','سالانه']
  ].map(([v,l])=>`<option value="${esc(v)}" ${taxFilter.tf===v?'selected':''}>${esc(l)}</option>`).join('');
  const brOpts = `<option value="all" ${taxFilter.branch==='all'?'selected':''}>همهٔ شعبه‌ها</option>` +
    BRANCHES.map(b=>`<option value="${esc(b)}" ${taxFilter.branch===b?'selected':''}>${esc(b)}</option>`).join('');

  const monthRows = monthly.length ? monthly.map(m=>`
    <tr>
      <td>${esc(AFG_MONTHS[m.jm-1])} ${faDigits(m.jy)}</td>
      <td class="num">${afn(m.fees)}</td>
      <td class="num">${afn(m.cost)}</td>
      <td class="num"><b style="color:${m.fees-m.cost>=0?'var(--income)':'var(--cost)'};">${afn(m.fees-m.cost)}</b></td>
    </tr>`).join('') : `<tr><td colspan="4" class="empty">در این بازه داده‌ای نیست.</td></tr>`;

  const costRows = TAX_COST_CATEGORIES.map(c=>`
    <tr><td>${esc(c)}</td><td class="num">${afn(costByCat[c]||0)}</td></tr>
  `).join('');

  const branchRows = BRANCHES.map(b=>`
    <tr><td>${esc(b)}</td><td class="num">${afn(byBranch[b]||0)}</td></tr>
  `).join('');

  root.innerHTML = `
    <div class="panel">
      <div class="panel-head" style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <h2>گزارش مالیاتی — درآمد شهریه (نقدی)</h2>
        <button class="btn ghost" onclick="exportTaxReport()">خروجی اکسل</button>
      </div>
      <p style="font-size:12.5px; color:var(--text-dim); margin:0 0 14px;">
        این گزارش فقط شامل <b>شهریهٔ جمع‌آوری‌شده (نقدی)</b> است و درآمد کتاب، کارت شاگردی، سایر درآمدها و سمینارها را در بر نمی‌گیرد.
        هزینه‌های محاسبه‌شده تنها این دسته‌ها هستند: <b>${esc(TAX_COST_CATEGORIES.join('، '))}</b>.
        مبالغ شهریه بر اساس تاریخ ثبت‌نام هر شاگرد در بازهٔ انتخابی محاسبه می‌شوند.
      </p>
      <div style="display:flex; gap:14px; align-items:center; flex-wrap:wrap; margin-bottom:16px;">
        <div style="display:flex; gap:8px; align-items:center;">
          <label for="tax-tf" style="font-size:12.5px; color:var(--text-dim);">بازهٔ زمانی:</label>
          <select id="tax-tf" onchange="onTaxFilterChange()">${tfOpts}</select>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <label for="tax-branch" style="font-size:12.5px; color:var(--text-dim);">شعبه:</label>
          <select id="tax-branch" onchange="onTaxFilterChange()">${brOpts}</select>
        </div>
      </div>
      <div class="cards" style="grid-template-columns:repeat(3,1fr);">
        <div class="card c-income"><div class="label">شهریهٔ جمع‌آوری‌شده</div><div class="value income">${afn(fees)}</div></div>
        <div class="card c-cost"><div class="label">مجموع هزینه‌های مرتبط</div><div class="value cost">${afn(totalCost)}</div></div>
        <div class="card c-profit"><div class="label">درآمد خالص مشمول</div><div class="value profit">${afn(net)}</div></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head"><h2>تفکیک ماهانه</h2></div>
      <div class="table-scroll"><table>
        <thead><tr><th>ماه</th><th class="num">شهریهٔ جمع‌آوری‌شده</th><th class="num">هزینه‌ها</th><th class="num">خالص</th></tr></thead>
        <tbody>${monthRows}</tbody>
        <tfoot><tr class="totals-row"><td><b>مجموع</b></td><td class="num"><b>${afn(fees)}</b></td><td class="num"><b>${afn(totalCost)}</b></td><td class="num"><b>${afn(net)}</b></td></tr></tfoot>
      </table></div>
    </div>

    <div class="panel">
      <div class="panel-head"><h2>هزینه‌های مرتبط به تفکیک دسته</h2></div>
      <div class="table-scroll"><table>
        <thead><tr><th>دستهٔ هزینه</th><th class="num">مبلغ</th></tr></thead>
        <tbody>${costRows}</tbody>
        <tfoot><tr class="totals-row"><td><b>مجموع هزینه‌ها</b></td><td class="num"><b>${afn(totalCost)}</b></td></tr></tfoot>
      </table></div>
    </div>

    <div class="panel">
      <div class="panel-head"><h2>شهریهٔ جمع‌آوری‌شده به تفکیک شعبه</h2></div>
      <div class="table-scroll"><table>
        <thead><tr><th>شعبه</th><th class="num">شهریهٔ جمع‌آوری‌شده</th></tr></thead>
        <tbody>${branchRows}</tbody>
        <tfoot><tr class="totals-row"><td><b>مجموع</b></td><td class="num"><b>${afn(fees)}</b></td></tr></tfoot>
      </table></div>
    </div>`;
}

function exportTaxReport(){
  const fees = taxFeesCollected();
  const costByCat = taxCostsByCategory();
  const totalCost = Object.values(costByCat).reduce((a,b)=>a+b,0);
  const byBranch = taxFeesByBranch();
  const monthly = taxMonthly();
  const tfLabel = ({all:'همه',daily:'روزانه',weekly:'هفتگی',monthly:'ماهانه',quarterly:'فصلی',biannual:'شش‌ماهه',annual:'سالانه'})[taxFilter.tf]||taxFilter.tf;

  const summary = [
    {'مورد':'بازهٔ زمانی','مبلغ (افغانی)':tfLabel},
    {'مورد':'شعبه','مبلغ (افغانی)': taxFilter.branch==='all'?'همه':taxFilter.branch},
    {'مورد':'شهریهٔ جمع‌آوری‌شده (نقدی)','مبلغ (افغانی)':fees},
    ...TAX_COST_CATEGORIES.map(c=>({'مورد':'هزینه: '+c,'مبلغ (افغانی)':costByCat[c]||0})),
    {'مورد':'مجموع هزینه‌ها','مبلغ (افغانی)':totalCost},
    {'مورد':'درآمد خالص مشمول','مبلغ (افغانی)':fees-totalCost},
  ];
  const monthlyRows = monthly.map(m=>({'ماه':`${AFG_MONTHS[m.jm-1]} ${m.jy}`,'شهریهٔ جمع‌آوری‌شده':m.fees,'هزینه‌ها':m.cost,'خالص':m.fees-m.cost}));
  const branchRows = BRANCHES.map(b=>({'شعبه':b,'شهریهٔ جمع‌آوری‌شده':byBranch[b]||0}));
  const feeDetail = taxFeeStudents().map(s=>({
    'کد شاگرد': profileCode(s.profileId), 'نام': profileName(s.profileId), 'صنف': className(s.classId),
    'شعبه': classBranch(s.classId), 'تاریخ ثبت‌نام': toJalali(s.registerDate), 'شهریهٔ جمع‌آوری‌شده': Number(s.paidAmount)||0,
  }));
  const costDetail = taxCostExpenses().map(e=>({
    'شعبه': e.branch||'', 'دسته': e.category, 'مبلغ': Number(e.amount)||0, 'تاریخ': toJalali(e.date), 'توضیحات': e.note||'',
  }));
  downloadWorkbookFromRows({
    'خلاصه': summary, 'تفکیک ماهانه': monthlyRows, 'به تفکیک شعبه': branchRows,
    'جزئیات شهریه': feeDetail, 'جزئیات هزینه': costDetail,
  }, 'tax-report-fees');
}

/* ================= Printable student profile ================= *
 * Opens a clean, print-ready page with the student's details and ALL their
 * course registrations (current + previous). The registrar can pick the paper
 * size/orientation before printing.
 * ------------------------------------------------------------------------- */
function printStudentProfile(profileId){
  const p = profileById(profileId); if(!p) return;
  const rows = profileEnrollments(profileId);

  let totNet=0, totPaid=0, totRemain=0;
  const bodyRows = rows.length ? rows.map((s,i)=>{
    const net = studentNetFee(s), paid = Number(s.paidAmount)||0, remain = studentRemaining(s);
    totNet+=net; totPaid+=paid; totRemain+=remain;
    const cls = db.classes.find(c=>c.id===s.classId) || {};
    const book = s.bookTitle ? `${s.bookTitle} (${s.bookPaid?'پرداخت‌شده':'پرداخت‌نشده'})` : '—';
    const card = s.idCardPrice ? (s.idCardPaid?'پرداخت‌شده':'پرداخت‌نشده') : '—';
    return `<tr>
      <td>${faDigits(i+1)}</td>
      <td>${esc(className(s.classId))}</td>
      <td>${esc(classBranch(s.classId))}</td>
      <td>${toJalali(s.registerDate)}</td>
      <td>${esc(classStatus(cls))}</td>
      <td>${faDigits(studentTotalDiscountPercent(s))}٪</td>
      <td>${afn(net)}</td>
      <td>${afn(paid)}</td>
      <td>${afn(remain)}</td>
      <td>${esc(book)}</td>
      <td>${esc(card)}</td>
      <td>${esc(s.result || 'در حال آموزش')}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="12" style="text-align:center; color:#666;">هنوز در صنفی ثبت‌نام نشده است.</td></tr>`;

  const totalsRow = rows.length ? `<tr class="tot">
    <td colspan="6"><b>مجموع</b></td>
    <td><b>${afn(totNet)}</b></td>
    <td><b>${afn(totPaid)}</b></td>
    <td><b>${afn(totRemain)}</b></td>
    <td colspan="3"></td>
  </tr>` : '';

  const photo = p.photo ? `<img class="photo" src="${esc(p.photo)}" alt="">` : '';
  const logo = `${location.origin}/assets/logo.png`;
  const nowJ = toJalali(todayISO());

  // Compact 80mm receipt rows (student info + amount paid) — one block per enrollment
  const receiptItems = rows.length ? rows.map(s=>{
    const net = studentNetFee(s), paid = Number(s.paidAmount)||0, remain = studentRemaining(s);
    const disc = studentTotalDiscountPercent(s);
    return `<div class="r-item">
      <div class="r-line"><span>صنف</span><b>${esc(className(s.classId))}</b></div>
      <div class="r-line"><span>شعبه</span><span>${esc(classBranch(s.classId))}</span></div>
      <div class="r-line"><span>تاریخ ثبت‌نام</span><span>${toJalali(s.registerDate)}</span></div>
      <div class="r-line"><span>شهریهٔ نهایی</span><span>${afn(net)}</span></div>
      ${disc?`<div class="r-line"><span>تخفیف</span><span>${faDigits(disc)}٪</span></div>`:''}
      <div class="r-line"><span>پرداخت‌شده</span><b>${afn(paid)}</b></div>
      <div class="r-line"><span>باقیمانده</span><span>${afn(remain)}</span></div>
    </div>`;
  }).join('<div class="r-sep"></div>') : '<div class="r-line">هنوز ثبت‌نامی انجام نشده است.</div>';

  const win = window.open('', '_blank');
  if(!win){ alert('لطفاً اجازهٔ باز شدن پنجرهٔ چاپ را بدهید.'); return; }
  win.document.write(`<!doctype html><html dir="rtl" lang="fa"><head><meta charset="utf-8">
  <title>رسید / پروندهٔ شاگرد · ${esc(p.name)}</title>
  <style id="page-style">@page{ size:80mm auto; margin:0; }</style>
  <style>
    *{ box-sizing:border-box; }
    body{ font-family:Tahoma,Arial,sans-serif; color:#111; margin:0; padding:0; background:#fff; }
    .toolbar{ position:sticky; top:0; background:#f3f3f6; border-bottom:1px solid #ccc; padding:10px 14px; display:flex; gap:12px; align-items:center; flex-wrap:wrap; font-size:13px; }
    .toolbar label{ color:#333; }
    .toolbar select, .toolbar button{ font-family:inherit; font-size:13px; padding:6px 10px; border:1px solid #bbb; border-radius:6px; background:#fff; cursor:pointer; }
    .toolbar button.print{ background:#4b2fd6; color:#fff; border-color:#4b2fd6; font-weight:bold; }
    .hidden{ display:none !important; }

    /* ---- 80mm thermal receipt ---- */
    .receipt{ width:72mm; margin:0 auto; padding:3mm 2mm; color:#000; font-size:12px; line-height:1.45; }
    .receipt .r-head{ text-align:center; }
    .receipt .r-head img{ width:40px; height:40px; object-fit:contain; }
    .receipt .r-head h1{ font-size:15px; margin:3px 0 0; }
    .receipt .r-head .r-title{ font-size:12px; margin:2px 0 0; }
    .receipt .r-sep{ border-top:1px dashed #000; margin:5px 0; }
    .receipt .r-line{ display:flex; justify-content:space-between; gap:8px; }
    .receipt .r-line > span:first-child{ color:#333; }
    .receipt .r-item{ margin:2px 0; }
    .receipt .r-tot .r-line{ font-weight:bold; font-size:12.5px; }
    .receipt .r-foot{ text-align:center; font-size:10px; margin-top:8px; }

    /* ---- Full A4/A5 sheet ---- */
    .sheet{ padding:18px 22px; max-width:900px; margin:0 auto; }
    .head{ display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid #4b2fd6; padding-bottom:12px; margin-bottom:14px; gap:12px; }
    .head .inst{ display:flex; align-items:center; gap:10px; }
    .head img.logo{ width:46px; height:46px; object-fit:contain; }
    .head h1{ font-size:18px; margin:0; }
    .head .meta{ font-size:11px; color:#666; text-align:left; }
    .info{ display:flex; gap:16px; margin-bottom:16px; }
    .info .photo{ width:96px; height:96px; object-fit:cover; border:1px solid #ccc; border-radius:8px; }
    .info table{ border-collapse:collapse; font-size:13px; }
    .info td{ padding:4px 10px; }
    .info td.k{ color:#666; }
    h2.section{ font-size:14px; margin:16px 0 8px; color:#4b2fd6; }
    table.grid{ width:100%; border-collapse:collapse; font-size:11.5px; }
    table.grid th, table.grid td{ border:1px solid #ccc; padding:6px 7px; text-align:right; }
    table.grid thead th{ background:#eee; }
    table.grid tr.tot td{ background:#f4f4f8; }
    .foot{ margin-top:26px; display:flex; justify-content:space-between; font-size:12px; color:#333; }
    .foot .sign{ border-top:1px solid #999; padding-top:6px; width:200px; text-align:center; }
    @media print{ .toolbar{ display:none; } .sheet{ max-width:none; padding:0; } }
  </style></head><body>
  <div class="toolbar">
    <label>اندازهٔ کاغذ:
      <select id="sizeSel" onchange="setSize(this.value)">
        <option value="thermal80" selected>رول ۸۰ میلی‌متری (رسید حرارتی)</option>
        <option value="A4">A4</option>
        <option value="A5">A5</option>
        <option value="A3">A3</option>
        <option value="Letter">Letter (نامه)</option>
        <option value="Legal">Legal</option>
      </select>
    </label>
    <label id="orient-wrap" style="display:none;">جهت:
      <select onchange="setOrient(this.value)">
        <option value="portrait">عمودی</option>
        <option value="landscape">افقی</option>
      </select>
    </label>
    <button class="print" onclick="window.print()">چاپ</button>
    <span style="color:#666; font-size:11px;">اندازهٔ چاپ را انتخاب کنید، سپس «چاپ» را بزنید. پیش‌فرض: رول ۸۰ میلی‌متری.</span>
  </div>

  <div class="receipt" id="receipt">
    <div class="r-head">
      <img src="${esc(logo)}" onerror="this.style.display='none'" alt="">
      <h1>آموزشگاه هدف</h1>
      <div class="r-title">رسید ثبت‌نام و پرداخت</div>
    </div>
    <div class="r-sep"></div>
    <div class="r-line"><span>کد شاگرد</span><b>${esc(p.code||'-')}</b></div>
    <div class="r-line"><span>نام شاگرد</span><b>${esc(p.name||'-')}</b></div>
    <div class="r-line"><span>پایه/سن</span><span>${esc(p.grade||'-')}</span></div>
    <div class="r-line"><span>سرپرست</span><span>${esc(p.guardianName||'-')}</span></div>
    <div class="r-line"><span>تماس</span><span>${esc(p.guardianPhone||'-')}</span></div>
    <div class="r-sep"></div>
    ${receiptItems}
    <div class="r-sep"></div>
    <div class="r-tot">
      <div class="r-line"><span>مجموع پرداخت‌شده</span><span>${afn(totPaid)}</span></div>
      <div class="r-line"><span>مجموع باقیمانده</span><span>${afn(totRemain)}</span></div>
    </div>
    <div class="r-sep"></div>
    <div class="r-foot">تاریخ چاپ: ${esc(nowJ)}<br>از اعتماد شما سپاسگزاریم — آموزشگاه هدف</div>
  </div>

  <div class="sheet hidden" id="sheet">
    <div class="head">
      <div class="inst">
        <img class="logo" src="${esc(logo)}" onerror="this.style.display='none'" alt="">
        <div><h1>آموزشگاه هدف</h1><div style="font-size:11px;color:#666;">پروندهٔ شاگرد</div></div>
      </div>
      <div class="meta">تاریخ چاپ: ${esc(nowJ)}<br>کد شاگرد: <b>${esc(p.code||'-')}</b></div>
    </div>
    <div class="info">
      ${photo}
      <table>
        <tr><td class="k">نام شاگرد:</td><td><b>${esc(p.name||'-')}</b></td><td class="k">پایه/سن:</td><td>${esc(p.grade||'-')}</td></tr>
        <tr><td class="k">نام سرپرست:</td><td>${esc(p.guardianName||'-')}</td><td class="k">تماس سرپرست:</td><td>${esc(p.guardianPhone||'-')}</td></tr>
        <tr><td class="k">تعداد ثبت‌نام‌ها:</td><td>${faDigits(rows.length)}</td><td class="k">توضیحات:</td><td>${esc(p.note||'-')}</td></tr>
      </table>
    </div>
    <h2 class="section">سابقهٔ صنف‌ها و شهریه</h2>
    <table class="grid">
      <thead><tr>
        <th>#</th><th>صنف</th><th>شعبه</th><th>تاریخ ثبت‌نام</th><th>وضعیت</th><th>تخفیف</th>
        <th>شهریهٔ نهایی</th><th>پرداخت‌شده</th><th>باقیمانده</th><th>کتاب</th><th>کارت</th><th>نتیجه</th>
      </tr></thead>
      <tbody>${bodyRows}${totalsRow}</tbody>
    </table>
    <div class="foot">
      <div class="sign">مهر و امضای آموزشگاه</div>
      <div class="sign">امضای شاگرد/سرپرست</div>
    </div>
  </div>

  <script>
    var _size='thermal80', _orient='portrait';
    function _apply(){
      var st=document.getElementById('page-style');
      if(_size==='thermal80'){ st.textContent='@page{ size:80mm auto; margin:0; }'; }
      else { st.textContent='@page{ size:'+_size+' '+_orient+'; margin:12mm; }'; }
    }
    function setSize(v){
      _size=v;
      var thermal=(v==='thermal80');
      document.getElementById('receipt').classList.toggle('hidden', !thermal);
      document.getElementById('sheet').classList.toggle('hidden', thermal);
      document.getElementById('orient-wrap').style.display = thermal ? 'none' : 'inline';
      _apply();
    }
    function setOrient(v){ _orient=v; _apply(); }
    _apply();
  <\/script>
  </body></html>`);
  win.document.close();
}

/* Initial paint (loaded after app.js) */
if (typeof renderMyIncome === 'function') renderMyIncome();
if (typeof renderAssets === 'function') renderAssets();
if (typeof renderTaxReport === 'function') renderTaxReport();
