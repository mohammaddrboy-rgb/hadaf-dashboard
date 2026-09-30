/* ================= charts.js =================
 * Shared chart component + the dashboard home widgets.
 * Loaded BEFORE app.js; everything here only runs when called, and reads the
 * app.js globals (db, afn, numFmt, faDigits, toJalali, …) at call time.
 *
 * Charts follow the house data-viz rules: one y-axis, thin 2px lines, a legend
 * for every multi-series chart, sparse direct labels at the line ends, a
 * crosshair + tooltip (mouse, touch and keyboard), and a table view twin so no
 * value is only reachable by hovering. Series colours come from the validated
 * --series-1..3 tokens in css/app.css; text never wears a series colour.
 * -------------------------------------------------------------------------- */
(function () {
  var SVGNS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function h(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  /* Short money label for axis ticks and end labels: ۱۲۰٬۰۰۰ → «۱۲۰ هزار». */
  function shortMoney(v) {
    var a = Math.abs(v), sign = v < 0 ? '−' : '';
    if (a >= 1e6) return sign + faDigits((Math.round(a / 1e5) / 10).toString()) + ' میلیون';
    if (a >= 1e3) return sign + faDigits(Math.round(a / 1e3).toString()) + ' هزار';
    return sign + faDigits(Math.round(a).toString());
  }
  function niceStep(range, count) {
    var raw = range / Math.max(1, count), mag = Math.pow(10, Math.floor(Math.log10(raw || 1))), f = raw / mag;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag;
  }

  /* Line chart.
     data = { labels:[…], series:[{ name, color:'var(--series-1)', values:[…], area?:bool }], money?:bool }
     The data is kept on the element so js/ui.js can redraw it at the new width
     (on view change / resize / theme change) and replay the draw-in animation. */
  function renderTrendChart(host, data) {
    if (!host) return;
    host._viz = data;
    host.classList.add('viz');
    host.innerHTML = '';

    var fmt = data.money === false ? function (v) { return faDigits(Math.round(v)); } : afn;
    var tickFmt = data.money === false ? function (v) { return faDigits(Math.round(v)); } : shortMoney;

    // Toolbar: legend + table toggle
    var bar = h('div', 'viz-toolbar');
    var legend = h('div', 'viz-legend');
    data.series.forEach(function (s) {
      var item = h('span'); var key = h('i'); key.style.setProperty('--c', s.color);
      item.appendChild(key); item.appendChild(document.createTextNode(s.name)); legend.appendChild(item);
    });
    var toggle = h('button', 'btn ghost small', 'نمایش جدول');
    toggle.type = 'button';
    bar.appendChild(legend); bar.appendChild(toggle);
    host.appendChild(bar);

    var W = Math.max(280, Math.round(host.clientWidth || 640));
    var H = W < 480 ? 210 : 250;
    var pad = { top: 16, bottom: 30, start: W < 480 ? 58 : 72, end: W < 480 ? 12 : 86 };
    var all = [];
    data.series.forEach(function (s) { all = all.concat(s.values); });
    var min = Math.min(0, Math.min.apply(null, all)), max = Math.max(1, Math.max.apply(null, all));
    var step = niceStep(max - min, 4);
    min = Math.floor(min / step) * step; max = Math.ceil(max / step) * step;
    if (max === min) max = min + step;

    // RTL: the first month sits on the right (start side), time runs right→left.
    var n = data.labels.length;
    var innerW = W - pad.start - pad.end;
    function x(i) { return W - pad.start - (n === 1 ? innerW / 2 : innerW * i / (n - 1)); }
    function y(v) { return pad.top + (H - pad.top - pad.bottom) * (1 - (v - min) / (max - min)); }

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', tabindex: '0',
      'aria-label': 'نمودار ' + data.series.map(function (s) { return s.name; }).join('، ') + ' — با کلیدهای جهت‌دار ماه‌ها را مرور کنید' });
    var grid = el('g', { class: 'grid' }, svg);
    for (var t = min; t <= max + step / 2; t += step) {
      el('line', { x1: pad.end, x2: W - pad.start, y1: y(t), y2: y(t), class: t === 0 ? 'baseline' : '' }, grid);
      var tl = el('text', { x: W - pad.start + 8, y: y(t) + 4, class: 'tick', 'text-anchor': 'start' }, svg);
      tl.textContent = tickFmt(t);
    }
    data.labels.forEach(function (lab, i) {
      var tx = el('text', { x: x(i), y: H - 8, class: 'tick', 'text-anchor': 'middle' }, svg);
      tx.textContent = lab;
    });

    // Series (area wash only under the first, lines on top)
    data.series.forEach(function (s, si) {
      var d = s.values.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
      if (s.area) {
        el('path', { d: d + ' L' + x(n - 1).toFixed(1) + ' ' + y(Math.max(min, 0)) + ' L' + x(0).toFixed(1) + ' ' + y(Math.max(min, 0)) + ' Z',
          class: 'series-area', fill: s.color }, svg);
      }
      el('path', { d: d, class: 'series-line', stroke: s.color, 'data-series': si }, svg);
    });
    // End dots + sparse end labels (skip a label that would collide with one above it)
    var used = [];
    data.series.forEach(function (s) {
      var v = s.values[n - 1], cx = x(n - 1), cy = y(v);
      el('circle', { cx: cx, cy: cy, r: 4.5, class: 'end-dot', fill: s.color }, svg);
      if (W >= 480 && used.every(function (u) { return Math.abs(u - cy) > 15; })) {
        used.push(cy);
        var lab = el('text', { x: cx - 10, y: cy + 4, class: 'end-label', 'text-anchor': 'end' }, svg);
        lab.textContent = tickFmt(v);
      }
    });

    // Crosshair + tooltip; each month column is a hit target wider than the line
    var cross = el('line', { y1: pad.top, y2: H - pad.bottom, class: 'crosshair' }, svg);
    var tip = h('div', 'viz-tooltip');
    tip.setAttribute('role', 'status');
    var wrap = h('div'); wrap.style.position = 'relative';
    wrap.appendChild(svg); wrap.appendChild(tip);
    host.appendChild(wrap);

    var colW = n > 1 ? innerW / (n - 1) : innerW;
    var current = -1;
    function show(i) {
      if (i < 0 || i >= n) return;
      current = i;
      cross.setAttribute('x1', x(i)); cross.setAttribute('x2', x(i)); cross.style.opacity = 1;
      tip.innerHTML = '';
      tip.appendChild(h('div', 'tt-title', data.labels[i]));
      data.series.forEach(function (s) {
        var row = h('div', 'tt-row'); var name = h('span'); var key = h('i'); key.style.setProperty('--c', s.color);
        name.appendChild(key); name.appendChild(document.createTextNode(s.name));
        row.appendChild(name); row.appendChild(h('b', '', fmt(s.values[i]))); tip.appendChild(row);
      });
      var scale = svg.getBoundingClientRect().width / W || 1;
      var left = x(i) * scale, tw = tip.offsetWidth || 180;
      tip.style.left = Math.min(Math.max(0, left - tw / 2), (svg.getBoundingClientRect().width || W) - tw) + 'px';
      tip.style.top = '8px';
      tip.classList.add('show');
    }
    function hide() { cross.style.opacity = 0; tip.classList.remove('show'); current = -1; }
    for (var i = 0; i < n; i++) {
      (function (i) {
        var r = el('rect', { x: x(i) - colW / 2, y: 0, width: colW, height: H, class: 'hit' }, svg);
        r.addEventListener('pointerenter', function () { show(i); });
        r.addEventListener('pointerdown', function () { show(i); });
      })(i);
    }
    svg.addEventListener('pointerleave', hide);
    svg.addEventListener('blur', hide);
    svg.addEventListener('focus', function () { show(n - 1); });
    svg.addEventListener('keydown', function (e) {
      // RTL: ArrowLeft moves forward in time
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(Math.min(n - 1, (current < 0 ? n - 1 : current + 1))); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(Math.max(0, (current < 0 ? n - 1 : current - 1))); }
      if (e.key === 'Escape') hide();
    });

    // Table view twin
    var tableWrap = h('div', 'table-scroll viz-table');
    tableWrap.hidden = !host._showTable;
    var table = h('table'); var thead = h('thead'); var hr = h('tr');
    hr.appendChild(h('th', '', 'ماه'));
    data.series.forEach(function (s) { hr.appendChild(h('th', 'num', s.name)); });
    thead.appendChild(hr); table.appendChild(thead);
    var tb = h('tbody');
    data.labels.forEach(function (lab, i) {
      var tr = h('tr'); tr.appendChild(h('td', '', lab));
      data.series.forEach(function (s) { tr.appendChild(h('td', 'num', fmt(s.values[i]))); });
      tb.appendChild(tr);
    });
    table.appendChild(tb); tableWrap.appendChild(table); host.appendChild(tableWrap);
    toggle.textContent = host._showTable ? 'پنهان کردن جدول' : 'نمایش جدول';
    toggle.setAttribute('aria-expanded', host._showTable ? 'true' : 'false');
    toggle.addEventListener('click', function () {
      host._showTable = !host._showTable;
      tableWrap.hidden = !host._showTable;
      toggle.textContent = host._showTable ? 'پنهان کردن جدول' : 'نمایش جدول';
      toggle.setAttribute('aria-expanded', host._showTable ? 'true' : 'false');
    });
  }

  /* Tiny trend line for stat tiles (de-emphasised line, accent end dot). */
  function sparklineSvg(values) {
    var W = 88, H = 28, n = values.length;
    if (n < 2) return '';
    var mn = Math.min.apply(null, values), mx = Math.max.apply(null, values);
    if (mx === mn) { mx += 1; mn -= 1; }
    var pts = values.map(function (v, i) { return [W - (W * i / (n - 1)), 3 + (H - 6) * (1 - (v - mn) / (mx - mn))]; });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var last = pts[n - 1];
    return '<svg class="sparkline" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><path class="line" d="' + d + '"/><circle cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="3.5"/></svg>';
  }
  /* Signed change vs the previous month; upGood=false for costs. */
  function deltaHtml(cur, prev, upGood) {
    if (!prev) return '<span class="delta flat">— ماه قبل صفر</span>';
    var pct = Math.round((cur - prev) / Math.abs(prev) * 100);
    if (pct === 0) return '<span class="delta flat">بدون تغییر</span>';
    var good = (pct > 0) === (upGood !== false);
    return '<span class="delta ' + (good ? 'up' : 'down') + '">' + (pct > 0 ? '▲ ' : '▼ ') + faDigits(Math.abs(pct)) + '٪</span>';
  }

  var ICON = {
    classes: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20V4H6.5A2.5 2.5 0 004 6.5v13z"/></svg>',
    students: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>',
    income: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>',
    cost: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 7l6 6 4-4 8 8"/><path d="M14 17h7v-7"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a1.5 1.5 0 001.3 2.3h17.8a1.5 1.5 0 001.3-2.3L13.7 3.9a1.5 1.5 0 00-2.6 0z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M16 13h2M3 10h18"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20V4H6.5A2.5 2.5 0 004 6.5v13z"/><path d="M8 7h8M8 11h8"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="8" r="3.2"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
    go: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M9 6l6 6-6 6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>',
  };

  /* Dashboard home: greeting, hero figure, stat tiles, trend chart, attention list, fee collection. */
  function renderDashboardWidgets() {
    if (!document.getElementById('dash-hero') || typeof lastJalaliMonths !== 'function') return;
    var today = todayISO();
    var months = lastJalaliMonths(6);
    var per = months.map(function (p) { return institutionTotals(function (d) { return dateInMonth(d, p.y, p.m); }); });
    var cur = per[5], prev = per[4];
    var curP = months[5];

    // Greeting + quick actions
    var name = (typeof currentActorName !== 'undefined' && currentActorName) ? currentActorName : '';
    document.getElementById('dash-hello').textContent = name ? ('سلام، ' + name) : 'خوش آمدید';
    document.getElementById('dash-today').textContent = weekdayName(today) + ' ' + toJalali(today) + ' · نمای کلی آموزشگاه هدف';
    var qa = [];
    if (navAllowed('students')) qa.push('<button type="button" class="btn" onclick="openStudentModal()">' + ICON.plus + 'ثبت‌نام جدید</button>');
    if (navAllowed('attendance')) qa.push('<button type="button" class="btn ghost" onclick="switchView(\'attendance\')">' + ICON.clock + 'حضور و غیاب</button>');
    if (navAllowed('expenses')) qa.push('<button type="button" class="btn ghost" onclick="openExpenseModal()">' + ICON.wallet + 'هزینهٔ جدید</button>');
    document.getElementById('dash-quick').innerHTML = qa.join('');

    // Hero: this month's net result
    var tuitionCur = cur.tuition;
    document.getElementById('dash-hero').innerHTML =
      '<div>' +
        '<div class="hero-eyebrow">باقیماندهٔ خالص <span class="pill">' + esc(salaryPeriodLabel(curP.y, curP.m)) + '</span></div>' +
        '<div class="hero-figure"><span data-count="' + cur.net + '" data-fmt="num">' + numFmt(cur.net) + '</span><small>افغانی</small></div>' +
        '<div class="hero-sub">' + deltaHtml(cur.net, prev.net, true) + '<span>در مقایسه با ' + esc(salaryPeriodLabel(months[4].y, months[4].m)) + '</span></div>' +
      '</div>' +
      '<div class="hero-split">' +
        '<div><small>درآمد ماه</small><b data-count="' + cur.income + '" data-fmt="num">' + numFmt(cur.income) + '</b></div>' +
        '<div><small>هزینهٔ ماه</small><b data-count="' + cur.cost + '" data-fmt="num">' + numFmt(cur.cost) + '</b></div>' +
        '<div><small>شهریهٔ دریافتی</small><b data-count="' + tuitionCur + '" data-fmt="num">' + numFmt(tuitionCur) + '</b></div>' +
      '</div>';

    // Stat tiles
    var active = db.classes.filter(function (c) { return classStatus(c) === 'در حال برگزاری'; });
    var upcoming = db.classes.filter(function (c) { return classStatus(c) === 'آینده'; }).length;
    var activeIds = {}; active.forEach(function (c) { activeIds[c.id] = 1; });
    var activeStudents = db.students.filter(function (s) { return activeIds[s.classId]; }).length;
    var regs = months.map(function (p) { return db.students.filter(function (s) { return dateInMonth(s.registerDate, p.y, p.m); }).length; });
    function tile(cls, icon, label, value, fmtKind, valueCls, meta) {
      return '<div class="card ' + cls + '"><div class="label"><span class="ico">' + icon + '</span>' + label + '</div>' +
        '<div class="value ' + valueCls + '" data-count="' + value + '" data-fmt="' + fmtKind + '">' + (fmtKind === 'afn' ? afn(value) : faDigits(value)) + '</div>' +
        '<div class="meta">' + meta + '</div></div>';
    }
    document.getElementById('dash-cards').innerHTML =
      tile('c-info', ICON.classes, 'صنف‌های در حال برگزاری', active.length, 'int', 'info', '<span>' + faDigits(upcoming) + ' صنف آینده</span>') +
      tile('c-info', ICON.students, 'شاگردان صنف‌های فعال', activeStudents, 'int', 'info', '<span>' + faDigits(regs[5]) + ' ثبت‌نام این ماه</span>' + sparklineSvg(regs)) +
      tile('c-income', ICON.income, 'درآمد این ماه', cur.income, 'afn', 'income', deltaHtml(cur.income, prev.income, true) + sparklineSvg(per.map(function (t) { return t.income; }))) +
      tile('c-cost', ICON.cost, 'هزینهٔ این ماه', cur.cost, 'afn', 'cost', deltaHtml(cur.cost, prev.cost, false) + sparklineSvg(per.map(function (t) { return t.cost; })));

    // Trend chart (institution-wide, Afghan months)
    renderTrendChart(document.getElementById('dash-trend'), {
      labels: months.map(function (p) { return AFG_MONTHS[p.m - 1]; }),
      series: [
        { name: 'درآمد کل', color: 'var(--series-1)', values: per.map(function (t) { return t.income; }), area: true },
        { name: 'هزینه‌ها', color: 'var(--series-2)', values: per.map(function (t) { return t.cost; }) },
        { name: 'باقیماندهٔ خالص', color: 'var(--series-3)', values: per.map(function (t) { return t.net; }) },
      ],
    });

    // Needs attention (status colours always paired with an icon + text)
    var items = [];
    var unpaid = db.students.filter(function (s) { var st = studentStatus(s); return st === 'پرداخت‌نشده' || st === 'پرداخت جزئی'; });
    if (unpaid.length) items.push({ tone: 'critical', icon: ICON.alert, title: faDigits(unpaid.length) + ' شهریهٔ معوق', sub: 'شاگردانی که کامل پرداخت نکرده‌اند', value: afn(unpaid.reduce(function (a, s) { return a + Math.max(0, studentRemaining(s)); }, 0)), view: 'students' });
    if (typeof currentRole !== 'undefined' && currentRole === 'shareholder') {
      var reqs = (db.advanceRequests || []).filter(function (r) { return r.status === 'pending'; });
      if (reqs.length) items.push({ tone: 'warning', icon: ICON.wallet, title: faDigits(reqs.length) + ' درخواست پیش‌پرداخت', sub: 'در انتظار تأیید سهامداران', value: afn(reqs.reduce(function (a, r) { return a + (Number(r.amount) || 0); }, 0)), view: 'teachers' });
    }
    var soon = db.classes.filter(function (c) { var e = classEndDate(c); if (!e || e < today) return false; var d = (new Date(e + 'T00:00:00') - new Date(today + 'T00:00:00')) / 864e5; return d <= 7; });
    if (soon.length) items.push({ tone: 'info', icon: ICON.clock, title: faDigits(soon.length) + ' صنف تا ۷ روز آینده تمام می‌شود', sub: soon.slice(0, 2).map(function (c) { return c.name || c.category; }).join('، ') + (soon.length > 2 ? ' …' : ''), value: '', view: 'classes' });
    var debt = db.bookPurchases.reduce(function (a, b) { return a + Math.max(0, (Number(b.totalCost) || 0) - (Number(b.paidAmount) || 0)); }, 0);
    if (debt > 0 && navAllowed('books')) items.push({ tone: 'warning', icon: ICON.book, title: 'بدهی به کتاب‌فروشی / مطبعه', sub: 'مانده‌ای که هنوز پرداخت نشده', value: afn(debt), view: 'books' });
    if (navAllowed('teachers')) {
      var noType = db.teachers.filter(function (t) { return typeof isLegacyPayType === 'function' && isLegacyPayType(t); });
      if (noType.length) items.push({ tone: 'warning', icon: ICON.user, title: faDigits(noType.length) + ' نفر بدون نوع حقوق', sub: 'نوع پرداخت را در پروندهٔ پرسنل تعیین کنید', value: '', view: 'teachers' });
    }
    if (!items.length) items.push({ tone: 'good', icon: ICON.check, title: 'همه‌چیز مرتب است', sub: 'موردی برای پیگیری وجود ندارد', value: '', view: '' });
    var list = document.getElementById('dash-attention');
    list.innerHTML = items.map(function (it) {
      var label = { critical: 'فوری', warning: 'پیگیری', info: 'اطلاع', good: 'خوب' }[it.tone];
      return '<li tabindex="0" role="button" data-view="' + esc(it.view) + '">' +
        '<span class="a-ico ' + it.tone + '" title="' + label + '">' + it.icon + '</span>' +
        '<span class="a-body"><b>' + esc(it.title) + '</b><small>' + esc(it.sub) + '</small></span>' +
        (it.value ? '<span class="a-value">' + esc(it.value) + '</span>' : '') +
        (it.view ? '<span class="a-go">' + ICON.go + '</span>' : '') + '</li>';
    }).join('');
    Array.prototype.forEach.call(list.querySelectorAll('li[data-view]'), function (li) {
      var go = function () { var v = li.getAttribute('data-view'); if (v && navAllowed(v)) switchView(v); };
      li.addEventListener('click', go);
      li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });

    // Fee collection meter (all registrations)
    var due = db.students.reduce(function (a, s) { return a + studentNetFee(s); }, 0);
    var got = db.students.reduce(function (a, s) { return a + Math.min(Number(s.paidAmount) || 0, studentNetFee(s)); }, 0);
    var pct = due > 0 ? Math.round(got / due * 100) : 0;
    document.getElementById('dash-collect').innerHTML =
      '<div class="collect-row"><span>وصول‌شده از کل شهریه‌ها</span><b><span data-count="' + pct + '" data-fmt="int">' + faDigits(pct) + '</span>٪</b></div>' +
      '<div class="meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="درصد وصول شهریه"><span style="width:' + pct + '%"></span></div>' +
      '<div class="collect-row"><span>دریافت‌شده: ' + afn(got) + '</span><span>باقیمانده: ' + afn(Math.max(0, due - got)) + '</span></div>';
  }

  window.renderTrendChart = renderTrendChart;
  window.renderDashboardWidgets = renderDashboardWidgets;
  window.hadafSparkline = sparklineSvg;
})();
