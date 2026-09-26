/* ============================================================
 * Hadaf dashboard — client sync layer
 * Shares one database across all devices via /api/db without losing edits.
 *
 * How it works:
 *  - After login the server hands out a session token; every data request
 *    carries it. Before login only the public name list (/api/directory) is
 *    fetched, for the login screen.
 *  - We remember the last copy we got from / saved to the server (the "base",
 *    kept in localStorage so it survives reloads). Every local change marks the
 *    data dirty and is pushed with the base's version number.
 *  - If another device saved in the meantime the server answers 409 with its
 *    copy. We then do a three-way merge (base → mine, base → theirs), record by
 *    record and field by field, and push the merged result. So two people
 *    adding or editing different things at the same time both keep their work;
 *    only a change to the very same field of the very same record is decided in
 *    favour of the device saving last.
 *  - A background pull never overwrites edits that haven't reached the server.
 *
 * Relies on app.js globals (shared classic-script scope): db, STORE_KEY,
 * persistLocal, migrateLegacyData, renderAll, applyRoleVisibility,
 * populateGateSelects, attendanceDirty, currentRole, logoutRole.
 * ============================================================ */
(function () {
  var API = '/api';
  var POLL_MS = 10000;
  var PUSH_DEBOUNCE = 500;
  var RETRY_MS = 5000;
  var DIRTY_KEY = 'hadaf_sync_dirty';
  var BASE_KEY = 'hadaf_sync_base';
  var TOKEN_KEY = 'hadaf_token';
  var LOG_CAP = 800;

  var online = false;
  var saveError = '';       // set when the server refused our data (not a network problem)
  var serverVersion = null;
  var base = null;          // last server copy this device knows (for three-way merge)
  var pushing = false;
  var pushTimer = null, retryTimer = null;
  var dirtySeq = 0;         // bumped on every local change
  var confirmedSeq = 0;     // last seq confirmed saved on the server
  var booted = false, polling = false;

  // Restore "unpushed edits exist" and the merge base across reloads.
  try { if (localStorage.getItem(DIRTY_KEY) === '1') dirtySeq = 1; } catch (e) {}
  try {
    var saved = JSON.parse(localStorage.getItem(BASE_KEY) || 'null');
    if (saved && typeof saved.version === 'number' && saved.data) { base = saved.data; serverVersion = saved.version; }
  } catch (e) {}

  function token() { try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } }
  function setToken(t) { try { t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY); } catch (e) {} }
  function headers(json) {
    var h = {};
    if (json) h['Content-Type'] = 'application/json';
    var t = token(); if (t) h.Authorization = 'Bearer ' + t;
    return h;
  }
  function isStudentView() { return !!(db && db.__view); }

  function hasUnpushed() { return dirtySeq > confirmedSeq; }
  function persistDirty() { try { hasUnpushed() ? localStorage.setItem(DIRTY_KEY, '1') : localStorage.removeItem(DIRTY_KEY); } catch (e) {} }
  function setBase(data, version) {
    base = data; serverVersion = version;
    if (data && data.__view) return; // never cache a student's trimmed copy
    try { localStorage.setItem(BASE_KEY, JSON.stringify({ version: version, data: data })); }
    catch (e) { try { localStorage.removeItem(BASE_KEY); } catch (e2) {} }
  }
  function clone(o) { return o === undefined ? undefined : JSON.parse(JSON.stringify(o)); }

  function updateBadge() {
    var unp = hasUnpushed();
    var txt = saveError ? 'خطا: سرور تغییرات را نپذیرفت' : !online ? 'حالت محلی (بدون همگام‌سازی)' : !token() ? 'منتظر ورود' : unp ? 'در حال ذخیره روی سرور…' : 'همگام با سرور ✓';
    var col = saveError ? 'var(--cost)' : !online ? 'var(--text-faint)' : unp ? 'var(--gold-soft, #c9a227)' : 'var(--income)';
    var el = document.getElementById('sync-badge');
    if (el) { el.textContent = txt; el.style.color = col; el.title = online ? 'داده‌ها با سرور به اشتراک گذاشته می‌شود' : 'اتصال به سرور برقرار نیست؛ تغییرات ذخیره می‌شوند و پس از اتصال ارسال می‌گردند'; }
    var el2 = document.getElementById('sync-badge-settings');
    if (el2) { el2.textContent = 'وضعیت: ' + txt; el2.style.color = col; }
  }

  /* ---------------- Three-way merge ---------------- */
  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function same(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (var i = 0; i < a.length; i++) if (!same(a[i], b[i])) return false;
      return true;
    }
    var ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (var j = 0; j < ka.length; j++) { var k = ka[j]; if (!Object.prototype.hasOwnProperty.call(b, k) || !same(a[k], b[k])) return false; }
    return true;
  }
  // Identity of a list item so the same record can be matched across copies.
  function itemKey(x) {
    if (!isObj(x)) return null;
    if (typeof x.id === 'string' || typeof x.id === 'number') return 'id:' + x.id;
    if (x.classId !== undefined && x.date !== undefined) return 'att:' + x.classId + '|' + x.date; // class attendance
    if (x.date !== undefined && x.marks !== undefined) return 'date:' + x.date;                   // personnel attendance
    return null;
  }
  function keyedList(arr) {
    var map = {}, order = [];
    for (var i = 0; i < arr.length; i++) {
      var k = itemKey(arr[i]);
      if (k === null || Object.prototype.hasOwnProperty.call(map, k)) return null;
      map[k] = arr[i]; order.push(k);
    }
    return { map: map, order: order };
  }
  /* b = base (undefined when unknown or absent), m = mine, t = theirs.
     undefined in the result means "leave the key/record out". */
  function merge3(b, m, t, baseKnown) {
    if (same(m, t)) return m;
    if (baseKnown) {
      if (same(m, b)) return t;   // only they changed it
      if (same(t, b)) return m;   // only I changed it
    }
    if (isObj(m) && isObj(t)) {
      var out = {}, keys = {}, k;
      for (k in m) keys[k] = 1;
      for (k in t) keys[k] = 1;
      for (k in keys) {
        var bk = isObj(b) ? b[k] : undefined;
        var v = merge3(bk, m[k], t[k], baseKnown && isObj(b));
        if (v !== undefined) out[k] = v;
      }
      return out;
    }
    if (Array.isArray(m) && Array.isArray(t)) {
      var M = keyedList(m), T = keyedList(t), B = Array.isArray(b) ? keyedList(b) : null;
      if (M && T && (B || !Array.isArray(b))) {
        var bKnown = baseKnown && !!B;
        var res = {}, key, i;
        var all = M.order.concat(T.order.filter(function (x) { return !Object.prototype.hasOwnProperty.call(M.map, x); }));
        for (i = 0; i < all.length; i++) {
          key = all[i];
          var bv = B ? B.map[key] : undefined;
          var r = merge3(bv, M.map[key], T.map[key], bKnown);
          if (r !== undefined) res[key] = r;
        }
        // Keep my order; slot records only they have in after their predecessor in their list.
        var order = M.order.filter(function (x) { return Object.prototype.hasOwnProperty.call(res, x); });
        for (i = 0; i < T.order.length; i++) {
          key = T.order[i];
          if (Object.prototype.hasOwnProperty.call(M.map, key) || !Object.prototype.hasOwnProperty.call(res, key)) continue;
          var pos = 0;
          for (var j = i - 1; j >= 0; j--) { var at = order.indexOf(T.order[j]); if (at >= 0) { pos = at + 1; break; } }
          order.splice(pos, 0, key);
        }
        return order.map(function (x) { return res[x]; });
      }
    }
    // Same field changed on both sides (or can't be merged finer).
    if (m === undefined) {
      // I deleted it; keep it only if they changed it meanwhile (don't lose their edit).
      return (baseKnown && same(t, b)) ? undefined : t;
    }
    if (t === undefined) return (baseKnown && same(m, b)) ? undefined : m;
    return baseKnown ? m : t; // known base: last writer (me) wins; unknown base: keep the server's
  }
  function mergeData(baseData, mine, theirs) {
    var merged = merge3(baseData || undefined, mine, theirs, !!baseData);
    if (merged && Array.isArray(merged.activityLog) && merged.activityLog.length > LOG_CAP) {
      merged.activityLog.sort(function (a, b) { return String(b.ts || '').localeCompare(String(a.ts || '')); });
      merged.activityLog.length = LOG_CAP;
    }
    return merged;
  }
  window.hadafMerge3 = mergeData; // exposed for testing

  /* ---------------- Applying server data ---------------- */
  function editingNow() {
    var a = document.activeElement;
    return a && (a.tagName === 'INPUT' || a.tagName === 'SELECT' || a.tagName === 'TEXTAREA');
  }
  function canApplyRemote() {
    if (hasUnpushed()) return false;                                // never overwrite unpushed local edits
    if (pushing) return false;
    var ov = document.getElementById('overlay');
    if (ov && ov.classList.contains('active')) return false;        // a modal is open
    if (typeof attendanceDirty !== 'undefined' && attendanceDirty) return false;
    if (editingNow()) return false;                                 // user is typing
    return true;
  }
  function useData(data) {
    db = data;
    window.db = data;
    if (typeof migrateLegacyData === 'function') migrateLegacyData();
    if (typeof persistLocal === 'function') persistLocal();
    if (typeof populateGateSelects === 'function') populateGateSelects();
    if (typeof renderAll === 'function') renderAll();
    if (typeof applyRoleVisibility === 'function') applyRoleVisibility();
  }
  function applyRemote(data, version) {
    try {
      setBase(clone(data), version);
      useData(data);
      updateBadge();
    } catch (e) { if (window.console) console.warn('sync applyRemote failed', e); }
  }

  /* ---------------- Network ---------------- */
  function authLost() {
    setToken('');
    updateBadge();
    if (typeof currentRole !== 'undefined' && currentRole && typeof logoutRole === 'function') {
      logoutRole(true);
      alert('نشست شما پایان یافته است؛ لطفاً دوباره وارد شوید.');
    }
  }
  // Resolves to the parsed JSON, { unchanged:true }, or null (offline / not logged in).
  function pull(force) {
    if (!token()) return Promise.resolve(null);
    var url = API + '/db' + (!force && serverVersion !== null && base ? '?since=' + serverVersion : '');
    return fetch(url, { cache: 'no-store', headers: headers(false) })
      .then(function (r) {
        if (r.status === 401) { online = true; authLost(); return null; }
        if (!r.ok) throw new Error('http ' + r.status);
        return r.json();
      })
      .then(function (j) { if (j) online = true; updateBadge(); return j; })
      .catch(function () { online = false; updateBadge(); return null; });
  }

  function pushNow() {
    if (pushing || !hasUnpushed()) return;
    if (isStudentView() || (typeof currentRole !== 'undefined' && currentRole === 'student')) { confirmedSeq = dirtySeq; persistDirty(); return; }
    var seeding = !token();
    if (seeding && serverVersion !== 0) return; // must log in first (only an empty server takes unauthenticated data)
    pushing = true;
    var seq = dirtySeq;                       // snapshot of what we're about to save
    var dataStr = JSON.stringify(db);
    var body = '{"baseVersion":' + JSON.stringify(serverVersion) + ',"data":' + dataStr + '}';
    fetch(API + '/db', { method: 'PUT', headers: headers(true), body: body })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, j: j }; });
      })
      .then(function (res) {
        online = true;
        saveError = '';
        if (res.status === 200 && res.j.ok) {
          setBase(JSON.parse(dataStr), res.j.version);
          confirmedSeq = seq;                 // everything up to `seq` is now on the server
          persistDirty();
        } else if (res.status === 409 && res.j.conflict) {
          // Someone else saved first: merge their copy with ours and try again.
          var theirs = res.j.data;
          var merged = mergeData(base, db, theirs);
          setBase(theirs, res.j.version);
          useData(merged);
          dirtySeq++;                         // the merged copy still has to be saved
          persistDirty();
        } else if (res.status === 401) {
          authLost();
        } else if (res.status === 403) {
          confirmedSeq = dirtySeq; persistDirty(); // read-only account: nothing we can save
        } else if (res.status === 400 || res.status === 413) {
          // The server refuses this data; retrying the same thing won't help. Keep the
          // edits (dirty) and try again with the next change; show it on the badge.
          saveError = (res.j && res.j.error) || String(res.status);
          if (window.console) console.warn('server rejected data:', saveError);
        } else {
          throw new Error('http ' + res.status);
        }
      })
      .catch(function () { online = false; scheduleRetry(); })
      .then(function () {
        pushing = false;
        updateBadge();
        if (hasUnpushed() && !saveError && !pushTimer && !retryTimer && token()) schedulePush(); // more edits arrived, or merged data to save
      });
  }
  function schedulePush() {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(function () { pushTimer = null; pushNow(); }, PUSH_DEBOUNCE);
  }
  function scheduleRetry() {
    if (retryTimer) return;
    retryTimer = setTimeout(function () { retryTimer = null; if (hasUnpushed()) pushNow(); }, RETRY_MS);
  }
  // Called from app.js save() on every change.
  window.scheduleServerPush = function () {
    if (isStudentView() || (typeof currentRole !== 'undefined' && currentRole === 'student')) return;
    dirtySeq++; persistDirty(); updateBadge(); schedulePush();
  };

  /* ---------------- Login / logout ---------------- */
  // Resolves to { ok, actorId, actorName } or { error: 'bad' | 'rate' | 'offline' }.
  window.hadafServerLogin = function (role, ident, password) {
    var body = { role: role, password: password };
    if (role === 'student') body.code = ident; else body.id = ident;
    return fetch(API + '/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) {
        if (r.status === 401) return { error: 'bad' };
        if (r.status === 429) return { error: 'rate' };
        if (!r.ok) return { error: 'offline' };
        return r.json().then(function (j) {
          if (!j || !j.ok || !j.token) return { error: 'offline' };
          online = true;
          setToken(j.token);
          return { ok: true, actorId: j.actorId, actorName: j.actorName };
        });
      })
      .catch(function () { return { error: 'offline' }; });
  };
  // Brings this device up to date for the user who just logged in.
  window.hadafAfterLogin = function () {
    if (!token()) { updateBadge(); return Promise.resolve(); }
    if (isStudentView()) { confirmedSeq = dirtySeq; persistDirty(); }
    return pull(true).then(function (j) {
      if (j && j.data) {
        if (hasUnpushed() && !j.data.__view) {
          // Edits made on this device earlier: merge them into the shared copy and save.
          var merged = mergeData(base, db, j.data);
          setBase(j.data, j.version);
          useData(merged);
          schedulePush();
        } else {
          confirmedSeq = dirtySeq; persistDirty();
          applyRemote(j.data, j.version);
        }
      }
      startPoll();
      updateBadge();
    });
  };
  window.hadafServerLogout = function () {
    var t = token();
    if (!t) return Promise.resolve();
    // Let a pending save (e.g. the logout entry) go out with the old session first.
    var waited = 0;
    return new Promise(function (resolve) {
      (function wait() {
        if ((pushTimer || pushing) && waited < 4000) { if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; pushNow(); } waited += 100; return setTimeout(wait, 100); }
        fetch(API + '/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + t } }).catch(function () {}).then(function () {
          setToken('');
          updateBadge();
          resolve();
        });
      })();
    });
  };

  /* ---------------- Settings actions ---------------- */
  window.hadafForceUpload = function () {
    if (!token()) { alert('برای این کار ابتدا وارد شوید.'); return; }
    if (!confirm('داده‌های این مرورگر به‌عنوان نسخهٔ مشترک روی سرور بارگذاری شود و جایگزین نسخهٔ فعلی سرور گردد؟\nاین کار داده‌های فعلی سرور را بازنویسی می‌کند.')) return;
    var dataStr = JSON.stringify(db);
    fetch(API + '/db', { method: 'PUT', headers: headers(true), body: '{"force":true,"baseVersion":' + JSON.stringify(serverVersion) + ',"data":' + dataStr + '}' })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.ok) { setBase(JSON.parse(dataStr), j.version); confirmedSeq = dirtySeq; persistDirty(); online = true; updateBadge(); alert('داده‌های این مرورگر روی سرور بارگذاری شد و برای همه به اشتراک گذاشته شد.'); }
        else if (j && j.conflict) { alert('فقط سهامداران می‌توانند نسخهٔ سرور را جایگزین کنند.'); }
        else { alert('بارگذاری ناموفق بود.'); }
      })
      .catch(function () { alert('بارگذاری ناموفق بود؛ اتصال به سرور برقرار نیست.'); });
  };
  window.hadafRefreshFromServer = function () {
    if (hasUnpushed()) { if (!confirm('تغییرات ذخیره‌نشده‌ای دارید که هنوز روی سرور ارسال نشده است. با دریافت مجدد، این تغییرات با نسخهٔ سرور جایگزین می‌شود. ادامه می‌دهید؟')) return; }
    pull(true).then(function (j) {
      if (j && j.data) { confirmedSeq = dirtySeq; persistDirty(); applyRemote(j.data, j.version); alert('داده‌ها از سرور دریافت و به‌روزرسانی شد.'); }
      else { alert('اتصال به سرور برقرار نیست.'); }
    });
  };

  /* ---------------- Polling ---------------- */
  function syncTick() {
    if (!token()) return Promise.resolve();
    // If we have unpushed local edits, make sure they go up rather than pulling.
    if (hasUnpushed()) { if (!saveError && !pushing && !pushTimer && !retryTimer) schedulePush(); return Promise.resolve(); }
    return pull(false).then(function (j) {
      if (j && j.data && typeof j.version === 'number' && j.version !== serverVersion && canApplyRemote()) {
        applyRemote(j.data, j.version);
      }
    });
  }
  function startPoll() {
    if (polling) return; polling = true;
    setInterval(function () { if (!document.hidden) syncTick(); }, POLL_MS);
    document.addEventListener('visibilitychange', function () {
      // Leaving the tab: send pending edits right away instead of waiting for the debounce.
      if (document.hidden) { if (hasUnpushed() && !pushing) { if (pushTimer) { clearTimeout(pushTimer); pushTimer = null; } pushNow(); } }
      else syncTick();
    });
    window.addEventListener('focus', function () { syncTick(); });
  }

  function boot() {
    if (booted) return; booted = true;
    fetch(API + '/directory', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (dir) {
        if (!dir || !dir.ok) throw new Error('bad directory');
        online = true;
        if (!token() && typeof currentRole !== 'undefined' && currentRole && typeof logoutRole === 'function') {
          // Signed in on this tab before server logins existed: sign in again to get a session.
          logoutRole(true);
        }
        if (dir.empty) {
          // Empty server: seed it from this browser (the only write allowed without login).
          serverVersion = 0; base = null;
          dirtySeq = Math.max(dirtySeq, confirmedSeq + 1); persistDirty(); schedulePush();
        } else {
          window.hadafDirectory = { shareholders: dir.shareholders || [], teachers: dir.teachers || [] };
          if (typeof populateGateSelects === 'function') populateGateSelects();
        }
        if (token()) return window.hadafAfterLogin();
        startPoll();
      })
      .catch(function () {
        // No sync server (plain static hosting) or it's down: work from this browser's copy.
        // Login still tries the server first, so one that comes back later is picked up.
        online = false;
        if (token()) window.hadafAfterLogin(); else startPoll();
      })
      .then(updateBadge);
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
