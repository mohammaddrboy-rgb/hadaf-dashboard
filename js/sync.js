/* ============================================================
 * Hadaf dashboard — client sync layer
 * Makes the dashboard share one database across all devices/users by
 * reading/writing to the server (/api/db). Falls back to local-only
 * (localStorage) when the server is unreachable, so nothing breaks offline.
 *
 * Relies on app.js globals (shared classic-script scope): db, STORE_KEY,
 * migrateLegacyData, renderAll, applyRoleVisibility, populateGateSelects,
 * attendanceDirty. app.js sets window.__hadafHadLocal at first line.
 * ============================================================ */
(function () {
  var SYNC_URL = '/api/db';
  var POLL_MS = 12000;
  var online = false;
  var serverVersion = null;
  var pushTimer = null, pushing = false, pushAgain = false;
  var booted = false;

  function updateBadge() {
    var txt = online ? 'همگام با سرور ✓' : 'حالت محلی (بدون همگام‌سازی)';
    var col = online ? 'var(--income)' : 'var(--text-faint)';
    var el = document.getElementById('sync-badge');
    if (el) { el.textContent = txt; el.style.color = col; el.title = online ? 'داده‌ها با سرور به اشتراک گذاشته می‌شود' : 'اتصال به سرور برقرار نیست؛ تغییرات فقط روی این دستگاه ذخیره می‌شود'; }
    var el2 = document.getElementById('sync-badge-settings');
    if (el2) { el2.textContent = 'وضعیت: ' + txt; el2.style.color = col; }
  }

  function editingNow() {
    var a = document.activeElement;
    return a && (a.tagName === 'INPUT' || a.tagName === 'SELECT' || a.tagName === 'TEXTAREA');
  }
  function canApplyRemote() {
    var ov = document.getElementById('overlay');
    if (ov && ov.classList.contains('active')) return false;        // a modal is open
    if (typeof attendanceDirty !== 'undefined' && attendanceDirty) return false; // unsaved attendance
    if (pushing || pushTimer) return false;                         // our own write pending
    if (editingNow()) return false;                                 // user is typing
    return true;
  }

  function applyRemote(data, version) {
    try {
      db = data;                                   // reassign shared global binding
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
    if (!online) return;
    if (pushing) { pushAgain = true; return; }
    pushing = true;
    var body = JSON.stringify({ baseVersion: serverVersion, data: db });
    fetch(SYNC_URL, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: body })
      .then(function (r) {
        if (r.status === 409) {
          // Someone else saved since we loaded. Adopt their version number and
          // re-push our data (last-write-wins) so the user's action is not lost.
          return r.json().then(function (j) {
            serverVersion = j.version;
            return fetch(SYNC_URL, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ force: true, data: db }) });
          });
        }
        return r;
      })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.ok) { serverVersion = j.version; online = true; } })
      .catch(function () { online = false; })
      .then(function () {
        pushing = false; updateBadge();
        if (pushAgain) { pushAgain = false; schedulePush(); }
      });
  }
  function schedulePush() {
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(function () { pushTimer = null; pushNow(); }, 800);
  }
  // Called from app.js save()
  window.scheduleServerPush = function () { if (online) schedulePush(); };

  // Settings actions
  window.hadafForceUpload = function () {
    if (!online) { alert('اتصال به سرور برقرار نیست.'); return; }
    if (!confirm('داده‌های این مرورگر به‌عنوان نسخهٔ مشترک روی سرور بارگذاری شود و جایگزین نسخهٔ فعلی سرور گردد؟\nاین کار داده‌های فعلی سرور را بازنویسی می‌کند.')) return;
    fetch(SYNC_URL, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ force: true, data: db }) })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.ok) { serverVersion = j.version; alert('داده‌های این مرورگر روی سرور بارگذاری شد و برای همه به اشتراک گذاشته شد.'); } else { alert('بارگذاری ناموفق بود.'); } })
      .catch(function () { alert('بارگذاری ناموفق بود.'); });
  };
  window.hadafRefreshFromServer = function () {
    pull().then(function (j) {
      if (j && j.data) { applyRemote(j.data, j.version); alert('داده‌ها از سرور دریافت و به‌روزرسانی شد.'); }
      else { alert('اتصال به سرور برقرار نیست.'); }
    });
  };

  function syncTick() {
    return pull().then(function (j) {
      if (j && typeof j.version === 'number' && j.version !== serverVersion && j.data && canApplyRemote()) {
        applyRemote(j.data, j.version);
      }
    });
  }
  function startPoll() {
    setInterval(function () { if (!document.hidden) syncTick(); }, POLL_MS);
    // Also refresh the moment the tab becomes visible / focused, so a device that
    // was in the background immediately shows everyone else's latest changes.
    document.addEventListener('visibilitychange', function () { if (!document.hidden) syncTick(); });
    window.addEventListener('focus', function () { syncTick(); });
  }

  function boot() {
    if (booted) return; booted = true;
    pull().then(function (j) {
      if (!j) { updateBadge(); startPoll(); return; } // offline: stay on localStorage
      online = true;
      var adopted = false;
      try { adopted = localStorage.getItem('hadaf_sync_adopted') === '1'; } catch (e) {}
      var hadLocal = !!window.__hadafHadLocal;
      var serverHasData = j.data && typeof j.data === 'object';

      if (!serverHasData) {
        // Server empty: seed it from this browser's data.
        serverVersion = j.version;
        schedulePush();
      } else if (adopted) {
        // Normal ongoing behaviour: the server is the shared source of truth.
        applyRemote(j.data, j.version);
      } else if (hadLocal) {
        // First time this browser joins the shared server AND it has its own local data.
        // Let the operator decide which copy wins (avoids silently losing real data).
        var keepServer = confirm(
          'این سامانه اکنون داده‌ها را بین همهٔ دستگاه‌ها به اشتراک می‌گذارد.\n\n' +
          '• برای دریافت نسخهٔ مشترک از سرور (توصیه‌شده) روی «OK / تأیید» بزنید.\n' +
          '• اگر داده‌های همین مرورگر درست‌تر است و می‌خواهید آن را نسخهٔ مشترک کنید، روی «Cancel / لغو» بزنید.'
        );
        if (keepServer) {
          applyRemote(j.data, j.version);
        } else {
          serverVersion = j.version;
          if (window.hadafForceUpload) {
            // push local as the shared copy
            fetch(SYNC_URL, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ force: true, data: db }) })
              .then(function (r) { return r.json(); })
              .then(function (jj) { if (jj && jj.ok) serverVersion = jj.version; });
          }
        }
      } else {
        // Fresh browser, server has data: adopt it.
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
