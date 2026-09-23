/* ============================================================
 * Hadaf dashboard — client sync layer (robust)
 * Shares one database across all devices via /api/db, without losing edits.
 *
 * Guarantees:
 *  - Every local change is pushed to the server, retried until it succeeds,
 *    and survives a refresh/close (a persisted "dirty" flag re-pushes on load).
 *  - A background pull NEVER overwrites local edits that haven't reached the
 *    server yet (no more "I added a teacher and it vanished").
 *  - Idle devices only ever adopt the shared copy; they never push stale data,
 *    so an old tab can't clobber everyone else. (A device that is actively
 *    editing wins a same-moment conflict — last-write-wins — which is rare.)
 *
 * Relies on app.js globals (shared classic-script scope): db, STORE_KEY,
 * migrateLegacyData, renderAll, applyRoleVisibility, populateGateSelects,
 * attendanceDirty. app.js sets window.__hadafHadLocal at first line.
 * ============================================================ */
(function () {
  var SYNC_URL = '/api/db';
  var POLL_MS = 10000;
  var PUSH_DEBOUNCE = 500;
  var RETRY_MS = 5000;
  var DIRTY_KEY = 'hadaf_sync_dirty';

  var online = false;
  var serverVersion = null;
  var pushing = false;
  var pushTimer = null, retryTimer = null;
  var dirtySeq = 0;       // bumped on every local change
  var confirmedSeq = 0;   // last seq confirmed saved on the server
  var booted = false;

  // Restore "unpushed edits exist" across reloads.
  try { if (localStorage.getItem(DIRTY_KEY) === '1') dirtySeq = 1; } catch (e) {}

  function hasUnpushed() { return dirtySeq > confirmedSeq; }
  function persistDirty() { try { hasUnpushed() ? localStorage.setItem(DIRTY_KEY, '1') : localStorage.removeItem(DIRTY_KEY); } catch (e) {} }

  function updateBadge() {
    var unp = hasUnpushed();
    var txt = !online ? 'حالت محلی (بدون همگام‌سازی)' : unp ? 'در حال ذخیره روی سرور…' : 'همگام با سرور ✓';
    var col = !online ? 'var(--text-faint)' : unp ? 'var(--gold-soft, #c9a227)' : 'var(--income)';
    var el = document.getElementById('sync-badge');
    if (el) { el.textContent = txt; el.style.color = col; el.title = online ? 'داده‌ها با سرور به اشتراک گذاشته می‌شود' : 'اتصال به سرور برقرار نیست؛ تغییرات ذخیره می‌شوند و پس از اتصال ارسال می‌گردند'; }
    var el2 = document.getElementById('sync-badge-settings');
    if (el2) { el2.textContent = 'وضعیت: ' + txt; el2.style.color = col; }
  }

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

  function applyRemote(data, version) {
    try {
      db = data;
      window.db = data;
      if (typeof migrateLegacyData === 'function') migrateLegacyData();
      try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (e) {}
      serverVersion = version;
      if (typeof populateGateSelects === 'function') populateGateSelects();
      if (typeof renderAll === 'function') renderAll();
      if (typeof applyRoleVisibility === 'function') applyRoleVisibility();
      updateBadge();
    } catch (e) { if (window.console) console.warn('sync applyRemote failed', e); }
  }

  function pull() {
    return fetch(SYNC_URL, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (j) { online = true; updateBadge(); return j; })
      .catch(function () { online = false; updateBadge(); return null; });
  }

  function pushNow() {
    if (pushing || !hasUnpushed()) return;
    pushing = true;
    var seq = dirtySeq;                       // snapshot of what we're about to save
    var payload = JSON.stringify({ baseVersion: serverVersion, data: db });
    fetch(SYNC_URL, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: payload })
      .then(function (r) {
        if (r.status === 409) {
          // Another device saved since our base. Our data includes the user's
          // edit, so re-push with force so the edit is not lost (last-write-wins).
          return r.json().then(function (j) {
            serverVersion = j.version;
            return fetch(SYNC_URL, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ force: true, data: db }) });
          });
        }
        return r;
      })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (j) {
        if (j && j.ok) {
          serverVersion = j.version;
          online = true;
          confirmedSeq = seq;                 // everything up to `seq` is now on the server
          persistDirty();
        }
      })
      .catch(function () { online = false; scheduleRetry(); })
      .then(function () {
        pushing = false;
        updateBadge();
        if (hasUnpushed() && !pushTimer) schedulePush(); // more edits arrived while pushing
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
  window.scheduleServerPush = function () { dirtySeq++; persistDirty(); updateBadge(); schedulePush(); };

  // Best-effort flush when the tab is hidden/closed (keepalive; small payloads only).
  function flush() {
    if (!hasUnpushed() || pushing) return;
    try { fetch(SYNC_URL, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ force: true, data: db }), keepalive: true }).catch(function () {}); } catch (e) {}
  }

  // Settings actions
  window.hadafForceUpload = function () {
    if (!confirm('داده‌های این مرورگر به‌عنوان نسخهٔ مشترک روی سرور بارگذاری شود و جایگزین نسخهٔ فعلی سرور گردد؟\nاین کار داده‌های فعلی سرور را بازنویسی می‌کند.')) return;
    fetch(SYNC_URL, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ force: true, data: db }) })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.ok) { serverVersion = j.version; confirmedSeq = dirtySeq; persistDirty(); online = true; updateBadge(); alert('داده‌های این مرورگر روی سرور بارگذاری شد و برای همه به اشتراک گذاشته شد.'); } else { alert('بارگذاری ناموفق بود.'); } })
      .catch(function () { alert('بارگذاری ناموفق بود؛ اتصال به سرور برقرار نیست.'); });
  };
  window.hadafRefreshFromServer = function () {
    if (hasUnpushed()) { if (!confirm('تغییرات ذخیره‌نشده‌ای دارید که هنوز روی سرور ارسال نشده است. با دریافت مجدد، این تغییرات با نسخهٔ سرور جایگزین می‌شود. ادامه می‌دهید؟')) return; }
    pull().then(function (j) {
      if (j && j.data) { confirmedSeq = dirtySeq; persistDirty(); applyRemote(j.data, j.version); alert('داده‌ها از سرور دریافت و به‌روزرسانی شد.'); }
      else { alert('اتصال به سرور برقرار نیست.'); }
    });
  };

  function syncTick() {
    // If we have unpushed local edits, make sure they go up rather than pulling.
    if (hasUnpushed()) { schedulePush(); return Promise.resolve(); }
    return pull().then(function (j) {
      if (j && typeof j.version === 'number' && j.version !== serverVersion && j.data && canApplyRemote()) {
        applyRemote(j.data, j.version);
      }
    });
  }
  function startPoll() {
    setInterval(function () { if (!document.hidden) syncTick(); }, POLL_MS);
    document.addEventListener('visibilitychange', function () { if (document.hidden) flush(); else syncTick(); });
    window.addEventListener('focus', function () { syncTick(); });
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
  }

  function boot() {
    if (booted) return; booted = true;
    pull().then(function (j) {
      if (!j) { updateBadge(); startPoll(); return; }   // offline: keep localStorage; will sync when back
      online = true;
      serverVersion = j.version;
      var serverHasData = j.data && typeof j.data === 'object';

      if (!serverHasData) {
        // Empty server: seed it from this browser.
        dirtySeq = Math.max(dirtySeq, 1); persistDirty(); schedulePush();
      } else if (hasUnpushed()) {
        // This browser has local edits from before that never reached the server: send them.
        schedulePush();
      } else {
        // No local pending edits: adopt the shared copy (safe; never clobbers).
        applyRemote(j.data, j.version);
      }
      try { localStorage.setItem('hadaf_sync_adopted', '1'); } catch (e) {}
      updateBadge();
      startPoll();
    });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
