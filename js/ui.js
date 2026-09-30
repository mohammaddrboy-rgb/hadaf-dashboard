/* ================= ui.js =================
 * Interaction & motion layer for the redesigned shell. Loaded last; it wraps a
 * few app.js functions (switchView, openModal, applyRoleVisibility,
 * toggleTheme, logoutRole) instead of changing their behaviour.
 *
 * Motion uses GSAP (vendor/gsap.min.js) when it is present and the user hasn't
 * asked for reduced motion; otherwise everything still works, just without
 * the animation. Nothing here is required for the app to function.
 * -------------------------------------------------------------------------- */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var G = (!reduce && window.gsap) ? window.gsap : null;
  if (G) document.documentElement.classList.add('has-motion');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------- Count-up numbers ---------------- */
  var FMT = {
    afn: function (v) { return afn(v); },
    num: function (v) { return numFmt(v); },
    int: function (v) { return faDigits(Math.round(v)); },
  };
  function countUp(root) {
    $$('[data-count]', root).forEach(function (node) {
      var target = Number(node.getAttribute('data-count')) || 0;
      var f = FMT[node.getAttribute('data-fmt')] || FMT.int;
      if (!G || !target) { node.textContent = f(target); return; }
      var o = { v: 0 };
      G.to(o, { v: target, duration: 1.1, ease: 'power3.out', onUpdate: function () { node.textContent = f(o.v); }, onComplete: function () { node.textContent = f(target); } });
    });
  }

  /* ---------------- Charts: redraw at real width, then draw in ---------------- */
  function redrawCharts(root, animate) {
    $$('.viz', root).forEach(function (host) {
      if (!host._viz || !host.offsetParent) return;
      renderTrendChart(host, host._viz);
      if (!animate || !G) return;
      $$('.series-line', host).forEach(function (p, i) {
        var len = p.getTotalLength ? p.getTotalLength() : 0;
        if (!len) return;
        G.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.2, delay: 0.1 + i * 0.12, ease: 'power2.inOut', clearProps: 'strokeDasharray,strokeDashoffset' });
      });
      G.from($$('.series-area', host), { opacity: 0, duration: 1, delay: 0.4 });
      G.from($$('.end-dot, .end-label', host), { opacity: 0, scale: 0.4, transformOrigin: 'center', duration: 0.4, delay: 1.1, stagger: 0.05, ease: 'back.out(2)' });
    });
    // meters and progress bars grow from zero
    if (G) {
      $$('.meter > span, .progress-inner', root).forEach(function (b) {
        if (!b.offsetParent) return;
        G.from(b, { width: 0, duration: 1, ease: 'power3.out', delay: 0.2 });
      });
    }
  }
  window.hadafRedrawCharts = function () { var v = $('.view.active'); if (v) redrawCharts(v, false); };

  /* ---------------- View entrance ---------------- */
  function enterView(view) {
    if (!view) return;
    redrawCharts(view, true);
    countUp(view);
    if (!G) return;
    var blocks = $$(':scope > *', view).filter(function (n) { return n.offsetParent; });
    var inner = [];
    blocks.forEach(function (b) {
      if (b.classList.contains('cards') || b.classList.contains('dash-grid') || b.classList.contains('dash-tables')) inner = inner.concat($$(':scope > *', b));
      else inner.push(b);
    });
    G.fromTo(inner, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.045, clearProps: 'transform,opacity' });
    var rows = $$('tbody tr', view).filter(function (r) { return r.offsetParent; }).slice(0, 14);
    G.fromTo(rows, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out', stagger: 0.018, delay: 0.12, clearProps: 'transform,opacity' });
  }

  /* ---------------- Sidebar: sliding indicator + collapse ---------------- */
  var nav = $('#nav');
  var indicator = document.createElement('div');
  indicator.className = 'nav-indicator';
  if (nav) nav.insertBefore(indicator, nav.firstChild);
  function moveIndicator(instant) {
    var btn = nav && $('.navbtn.active', nav);
    $$('.navbtn', nav).forEach(function (b) { b.classList.add('has-indicator'); });
    if (!btn || !btn.offsetParent) { indicator.style.opacity = 0; return; }
    var top = btn.offsetTop, hgt = btn.offsetHeight;
    if (G && !instant) G.to(indicator, { y: top, height: hgt, opacity: 1, duration: 0.45, ease: 'expo.out' });
    else { indicator.style.transform = 'translateY(' + top + 'px)'; indicator.style.height = hgt + 'px'; indicator.style.opacity = 1; if (G) G.set(indicator, { y: top }); }
  }

  var app = $('.app');
  var COLLAPSE_KEY = 'hadaf_nav_collapsed';
  try { if (localStorage.getItem(COLLAPSE_KEY) === '1') app.classList.add('collapsed'); } catch (e) {}
  var collapseBtn = $('#collapse-btn');
  if (collapseBtn) collapseBtn.addEventListener('click', function () {
    app.classList.toggle('collapsed');
    try { localStorage.setItem(COLLAPSE_KEY, app.classList.contains('collapsed') ? '1' : '0'); } catch (e) {}
    setTimeout(function () { moveIndicator(true); window.hadafRedrawCharts(); }, 380);
  });
  // Collapsed rail: show the label as a tooltip
  $$('.navbtn').forEach(function (b) { var l = $('.nav-label', b); if (l) b.title = l.textContent.trim(); });

  /* ---------------- Avatars ---------------- */
  function initials(name) {
    name = (name || '').replace(/^(استاد|استاده)\s+/, '').trim();
    return name ? name.charAt(0) : 'ه';
  }
  function refreshIdentity() {
    var n = (typeof currentActorName !== 'undefined') ? currentActorName : '';
    ['#sidebar-avatar', '#header-avatar'].forEach(function (s) { var e = $(s); if (e) e.textContent = initials(n); });
  }

  /* ---------------- Mobile tab bar ---------------- */
  var TAB_PRIORITY = ['dashboard', 'studentSelf', 'students', 'classes', 'attendance', 'myIncome', 'report', 'expenses', 'books'];
  var tabbar = $('#tabbar');
  function navIcon(view) { var b = $('.navbtn[data-view="' + view + '"] svg'); return b ? b.outerHTML : ''; }
  function navLabel(view) { var b = $('.navbtn[data-view="' + view + '"] .nav-label'); return b ? b.textContent.trim() : (VIEW_TITLES[view] || {}).title || view; }
  function buildTabbar() {
    if (!tabbar) return;
    var views = TAB_PRIORITY.filter(function (v) { return navAllowed(v); }).slice(0, 4);
    tabbar.innerHTML = views.map(function (v) {
      var label = navLabel(v);
      if (label.length > 12) label = label.split(' ')[0];
      return '<button type="button" data-view="' + v + '">' + navIcon(v) + '<span>' + esc(label) + '</span></button>';
    }).join('') + '<button type="button" data-more="1"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg><span>منو</span></button>';
    tabbar.style.display = (typeof currentRole !== 'undefined' && currentRole) ? '' : 'none';
    syncTabbar();
  }
  function syncTabbar() {
    if (!tabbar) return;
    var active = $('.view.active');
    var id = active ? active.id.replace('view-', '') : '';
    $$('button[data-view]', tabbar).forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-view') === id); });
  }
  if (tabbar) tabbar.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.getAttribute('data-more')) { toggleMobileNav(true); return; }
    switchView(b.getAttribute('data-view'));
  });

  /* ---------------- Wrap app functions ---------------- */
  var _switchView = window.switchView;
  window.switchView = function (name, updateHash) {
    var before = $('.view.active');
    _switchView(name, updateHash);
    var after = $('.view.active');
    moveIndicator(false);
    syncTabbar();
    if (after && after !== before) {
      try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, 0); }
      enterView(after);
    }
  };

  var _applyRole = window.applyRoleVisibility;
  window.applyRoleVisibility = function () {
    _applyRole.apply(this, arguments);
    refreshIdentity();
    buildTabbar();
    moveIndicator(true);
  };

  var _openModal = window.openModal;
  window.openModal = function (html, opts) {
    _openModal(html, opts);
    var m = $('#modal-body');
    if (G && m) {
      G.fromTo(m, { opacity: 0, y: 18, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.4)', clearProps: 'transform,opacity' });
      G.fromTo($$('.field, .field-row, .sectiontitle, .panel', m).slice(0, 16), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.02, delay: 0.08, ease: 'power2.out', clearProps: 'transform,opacity' });
    }
    if (m) redrawCharts(m, true);
    var first = m && m.querySelector('input:not([type=hidden]):not([type=checkbox]):not([type=file]), select, textarea');
    if (first && window.matchMedia('(pointer:fine)').matches) setTimeout(function () { try { first.focus({ preventScroll: true }); } catch (e) {} }, 60);
  };

  var metaTheme = $('meta[name="theme-color"]');
  function syncThemeMeta() { if (metaTheme) metaTheme.setAttribute('content', getCurrentTheme() === 'dark' ? '#0d0918' : '#f6f4fc'); }
  var _toggleTheme = window.toggleTheme;
  window.toggleTheme = function (ev) {
    var e = ev || window.event;
    var run = function () { _toggleTheme(); syncThemeMeta(); };
    if (!G || !document.startViewTransition) { run(); return; }
    var x = e && e.clientX ? e.clientX : window.innerWidth - 60, y = e && e.clientY ? e.clientY : 36;
    var r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    var t = document.startViewTransition(run);
    t.ready.then(function () {
      document.documentElement.animate({ clipPath: ['circle(0 at ' + x + 'px ' + y + 'px)', 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 550, easing: 'cubic-bezier(0.16,1,0.3,1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(function () {});
  };
  syncThemeMeta();

  /* ---------------- Command palette (Ctrl/⌘ + K) ---------------- */
  var ACTIONS = [
    { label: 'ثبت‌نام شاگرد جدید', view: 'students', run: function () { switchView('students'); openStudentModal(); } },
    { label: 'صنف جدید', view: 'classes', run: function () { switchView('classes'); openClassModal(); } },
    { label: 'هزینهٔ جدید', view: 'expenses', run: function () { switchView('expenses'); openExpenseModal(); } },
    { label: 'درآمد جدید', view: 'donations', run: function () { switchView('donations'); openDonationModal(); } },
    { label: 'پرسنل جدید', view: 'teachers', run: function () { switchView('teachers'); openTeacherModal(); } },
    { label: 'تغییر تم روشن / تاریک', run: function () { toggleTheme(); } },
    { label: 'خروج از حساب', run: function () { logoutRole(); } },
  ];
  var ICON_BOLT = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>';
  var cmdk = document.createElement('div');
  cmdk.className = 'cmdk-overlay';
  cmdk.innerHTML = '<div class="cmdk" role="dialog" aria-modal="true" aria-label="جست‌وجو و رفتن سریع">' +
    '<div class="cmdk-input"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
    '<input type="text" placeholder="نام بخش یا کاری که می‌خواهید انجام دهید…" aria-label="جست‌وجو" autocomplete="off"></div>' +
    '<div class="cmdk-list" role="listbox"></div>' +
    '<div class="cmdk-foot"><span>↑↓ حرکت</span><span>Enter انتخاب</span><span>Esc بستن</span></div></div>';
  document.body.appendChild(cmdk);
  var cmdInput = $('input', cmdk), cmdList = $('.cmdk-list', cmdk), cmdItems = [], cmdSel = 0;
  function norm(t) { return String(t || '').replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/‌/g, ' ').toLowerCase(); }
  function renderCmd() {
    var q = norm(cmdInput.value.trim());
    var views = Object.keys(VIEW_TITLES).filter(function (v) { return navAllowed(v); }).map(function (v) {
      return { label: navLabel(v), sub: VIEW_TITLES[v].sub, icon: navIcon(v), run: function () { switchView(v); } };
    });
    var acts = ACTIONS.filter(function (a) { return !a.view || navAllowed(a.view); }).map(function (a) { return { label: a.label, sub: '', icon: ICON_BOLT, run: a.run }; });
    // Rank: name starts with the query > name contains it > only the description does.
    var score = function (it) {
      if (!q) return 1;
      var l = norm(it.label);
      return l.indexOf(q) === 0 ? 3 : l.indexOf(q) >= 0 ? 2 : norm(it.sub).indexOf(q) >= 0 ? 1 : 0;
    };
    var ranked = function (list) { return list.map(function (it) { it._s = score(it); return it; }).filter(function (it) { return it._s > 0; }).sort(function (a, b) { return b._s - a._s; }); };
    var groups = [['بخش‌ها', ranked(views)], ['کارها', ranked(acts)]];
    if (q && groups[1][1].length && (!groups[0][1].length || groups[1][1][0]._s > groups[0][1][0]._s)) groups.reverse();
    cmdItems = []; cmdList.innerHTML = '';
    groups.forEach(function (g) {
      if (!g[1].length) return;
      var head = document.createElement('div'); head.className = 'cmdk-group'; head.textContent = g[0]; cmdList.appendChild(head);
      g[1].forEach(function (it) {
        var b = document.createElement('button'); b.type = 'button'; b.className = 'cmdk-item'; b.setAttribute('role', 'option');
        b.innerHTML = it.icon; var sp = document.createElement('span'); sp.textContent = it.label; b.appendChild(sp);
        var idx = cmdItems.length;
        b.addEventListener('click', function () { pick(idx); });
        b.addEventListener('mousemove', function () { select(idx); });
        cmdList.appendChild(b); cmdItems.push({ el: b, run: it.run });
      });
    });
    if (!cmdItems.length) { var e = document.createElement('div'); e.className = 'cmdk-empty'; e.textContent = 'چیزی پیدا نشد.'; cmdList.appendChild(e); }
    select(0);
  }
  function select(i) {
    if (!cmdItems.length) return;
    cmdSel = (i + cmdItems.length) % cmdItems.length;
    cmdItems.forEach(function (it, k) { it.el.classList.toggle('sel', k === cmdSel); it.el.setAttribute('aria-selected', k === cmdSel); });
    cmdItems[cmdSel].el.scrollIntoView({ block: 'nearest' });
  }
  function pick(i) { var it = cmdItems[i]; closeCmd(); if (it) it.run(); }
  function openCmd() {
    if (typeof currentRole === 'undefined' || !currentRole) return;
    cmdk.classList.add('active'); cmdInput.value = ''; renderCmd();
    if (G) G.fromTo($('.cmdk', cmdk), { opacity: 0, y: -12, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.6)', clearProps: 'transform,opacity' });
    cmdInput.focus(); // at once, so keys typed right after Ctrl+K aren't lost
  }
  function closeCmd() { cmdk.classList.remove('active'); }
  cmdInput.addEventListener('input', renderCmd);
  cmdInput.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); select(cmdSel + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); select(cmdSel - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); pick(cmdSel); }
    else if (e.key === 'Escape') { e.preventDefault(); closeCmd(); }
  });
  cmdk.addEventListener('click', function (e) { if (e.target === cmdk) closeCmd(); });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.key === 'ل')) { e.preventDefault(); cmdk.classList.contains('active') ? closeCmd() : openCmd(); }
  });
  var trigger = $('#search-trigger');
  if (trigger) trigger.addEventListener('click', openCmd);
  window.hadafOpenCommand = openCmd;

  /* ---------------- Hero parallax (subtle) ---------------- */
  document.addEventListener('pointermove', function (e) {
    var hero = $('#dash-hero');
    if (!G || !hero || !hero.offsetParent) return;
    var r = hero.getBoundingClientRect();
    if (e.clientY < r.top - 80 || e.clientY > r.bottom + 80) return;
    var dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
    G.to(hero, { rotateX: -dy * 2, rotateY: dx * 3, transformPerspective: 900, duration: 0.8, ease: 'power3.out' });
  }, { passive: true });

  /* ---------------- Login screen: target-rings canvas ---------------- */
  var gate = $('#access-gate'), canvas = $('#gate-canvas'), ctx = canvas && canvas.getContext && canvas.getContext('2d');
  var raf = 0, t0 = 0, pointer = { x: 0.3, y: 0.4 }, dots = [];
  function sizeCanvas() {
    if (!canvas) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = [];
    var n = Math.round(Math.min(60, innerWidth * innerHeight / 26000));
    for (var i = 0; i < n; i++) dots.push({ a: Math.random() * Math.PI * 2, r: 80 + Math.random() * Math.max(innerWidth, innerHeight) * 0.6, s: (0.02 + Math.random() * 0.05) * (Math.random() < 0.5 ? -1 : 1), z: 0.4 + Math.random() * 0.8 });
  }
  function drawGate(ts) {
    if (!ctx) return;
    var t = (ts - t0) / 1000;
    var light = getCurrentTheme() === 'light';
    var W = innerWidth, H = innerHeight;
    ctx.clearRect(0, 0, W, H);
    // Rings sit behind the (blurred, glassy) login card: left column in RTL on desktop, top on phones.
    var cx = W * (innerWidth > 900 ? 0.3 : 0.5) + (pointer.x - 0.5) * 30, cy = H * (innerWidth > 900 ? 0.5 : 0.62) + (pointer.y - 0.5) * 30;
    // soft glow
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.6);
    g.addColorStop(0, light ? 'rgba(124,77,255,0.16)' : 'rgba(132,86,255,0.28)');
    g.addColorStop(0.5, light ? 'rgba(242,169,0,0.05)' : 'rgba(242,169,0,0.06)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // concentric rings of the target, slowly breathing
    var ringCol = light ? '90,50,200' : '190,160,255';
    for (var i = 1; i <= 9; i++) {
      var rr = i * 58 + Math.sin(t * 0.6 + i * 0.7) * 4;
      ctx.beginPath();
      ctx.setLineDash(i % 3 === 0 ? [2, 10] : []);
      ctx.lineDashOffset = -t * 6 * (i % 2 ? 1 : -1);
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(' + ringCol + ',' + (0.16 - i * 0.012) + ')';
      ctx.lineWidth = i === 1 ? 1.5 : 1;
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // gold arc sweeping round the target — the «هدف» arrow
    var a0 = t * 0.5;
    ctx.beginPath(); ctx.arc(cx, cy, 58 * 3, a0, a0 + 1.1);
    ctx.strokeStyle = light ? 'rgba(199,138,0,0.55)' : 'rgba(245,184,46,0.65)'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fillStyle = light ? 'rgba(199,138,0,0.9)' : 'rgba(245,184,46,0.95)'; ctx.fill();
    // orbiting particles
    dots.forEach(function (d) {
      var a = d.a + t * d.s;
      var x = cx + Math.cos(a) * d.r, y = cy + Math.sin(a) * d.r * 0.92;
      ctx.beginPath(); ctx.arc(x, y, 1.2 * d.z, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + ringCol + ',' + (0.25 + 0.35 * d.z) + ')'; ctx.fill();
    });
    if (!reduce) raf = requestAnimationFrame(drawGate);
  }
  function startGate() {
    if (!ctx || raf) return;
    sizeCanvas(); t0 = performance.now();
    raf = requestAnimationFrame(drawGate);
    if (reduce) raf = 0;
    if (G) {
      G.fromTo($$('.gate-hero > *'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out', clearProps: 'transform,opacity' });
      G.fromTo('.gate-card', { opacity: 0, y: 24, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'expo.out', delay: 0.1, clearProps: 'transform,opacity' });
    }
  }
  function stopGate() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  window.addEventListener('pointermove', function (e) { pointer.x = e.clientX / innerWidth; pointer.y = e.clientY / innerHeight; }, { passive: true });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopGate(); else if (gate && gate.classList.contains('active')) startGate();
  });

  // Gate shown/hidden → start/stop the canvas; hidden after login → animate the app in.
  var wasGate = gate && gate.classList.contains('active');
  if (gate) new MutationObserver(function () {
    var on = gate.classList.contains('active');
    if (on === wasGate) return;
    wasGate = on;
    if (on) { startGate(); if (tabbar) tabbar.style.display = 'none'; }
    else {
      stopGate();
      buildTabbar(); refreshIdentity(); moveIndicator(true);
      if (G) G.fromTo('.sidebar', { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.7, ease: 'expo.out', clearProps: 'transform,opacity' });
      enterView($('.view.active'));
    }
  }).observe(gate, { attributes: true, attributeFilter: ['class'] });
  if (wasGate) startGate();

  // Gate role tabs: small spring on switch
  var _switchGateTab = window.switchGateTab;
  window.switchGateTab = function (role) {
    _switchGateTab(role);
    if (G) G.fromTo('#gate-role-' + role + ' > *', { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out', clearProps: 'transform,opacity' });
  };

  /* ---------------- Resize ---------------- */
  var rz = 0;
  window.addEventListener('resize', function () {
    clearTimeout(rz);
    rz = setTimeout(function () { window.hadafRedrawCharts(); moveIndicator(true); if (raf) sizeCanvas(); }, 150);
  });

  /* ---------------- Initial state ---------------- */
  refreshIdentity();
  buildTabbar();
  requestAnimationFrame(function () { moveIndicator(true); var v = $('.view.active'); if (v && !(gate && gate.classList.contains('active'))) enterView(v); });
})();
