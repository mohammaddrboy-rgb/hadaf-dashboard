/* ============================================================
 * Hadaf dashboard — shared data service (Node.js, stdlib only)
 * Stores the whole dashboard `db` object as one JSON file so every
 * device/browser reads and writes the SAME data.
 *
 * Endpoints (same-origin, proxied by nginx at /api/):
 *   GET  /api/health           -> { ok }
 *   GET  /api/directory        -> { ok, empty, shareholders:[{id,name}], teachers:[{id,name,role}] }
 *                                 (public: just the names for the login screen)
 *   POST /api/login            -> body { role, id?, code?, password }
 *                                 200 { ok, token, role, actorId, actorName }
 *                                 401 wrong credentials · 429 too many attempts · 409 { empty:true } no data yet
 *   POST /api/logout           -> ends the session of the Bearer token
 *   GET  /api/db[?since=N]     -> { ok, version, data } (or { unchanged:true } when version === N)
 *   PUT  /api/db  (or POST)    -> body { baseVersion, force?, data }
 *                                 200 { ok, version } on success
 *                                 409 { ok:false, conflict:true, version, data } when baseVersion is stale
 *
 * Every /api/db call needs "Authorization: Bearer <token>" from /api/login.
 * The only exception is the very first upload into an empty server (seeding).
 *
 * What each role gets:
 *   - shareholder: everything, including login passwords (they manage them).
 *   - manager / teacher / employee: everything except passwords (replaced by
 *     HIDDEN_PASSWORD). Their writes can't change passwords of existing people,
 *     shareholder records or assets.
 *   - student: only their own profile, enrollments, attendance and the class
 *     list; read-only.
 *
 * Config via env:
 *   PORT           (default 8791)
 *   HOST           (default 127.0.0.1)
 *   HADAF_DATA_DIR (default /var/www/hadaf-data)
 *   STATIC_DIR     (optional) if set, also serves static files from it (local testing only)
 * ============================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 8791);
const HOST = process.env.HOST || '127.0.0.1';
const DATA_DIR = process.env.HADAF_DATA_DIR || '/var/www/hadaf-data';
const DB_FILE = path.join(DATA_DIR, 'db.json');
const META_FILE = path.join(DATA_DIR, 'meta.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const STATIC_DIR = process.env.STATIC_DIR || '';
const MAX_BODY = 30 * 1024 * 1024; // 30 MB

const HIDDEN_PASSWORD = '__hidden__';          // must match HIDDEN_PASSWORD in js/app.js
const SESSION_TTL_MS = 30 * 24 * 3600 * 1000;  // 30 days
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS_PER_IP = 20;
const MAX_FAILS_PER_ACCOUNT = 10;
const PERSONNEL_ROLE = { manager: 'مدیریت', teacher: 'مدرس', employee: 'کارمند' };
const PASSWORD_COLLECTIONS = ['shareholders', 'teachers', 'studentProfiles'];
const SHAREHOLDER_ONLY_KEYS = ['shareholders', 'assets'];
const UNSAFE_ID_CHARS = /[<>"'`\\\s&]/;

function ensureDir() { try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {} }
function readJson(file, fallback) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; } }
function readMeta() { return readJson(META_FILE, { version: 0 }); }
function readData() { return readJson(DB_FILE, null); }
function writeAtomic(file, str) { const tmp = file + '.tmp-' + process.pid; fs.writeFileSync(tmp, str); fs.renameSync(tmp, file); }

function sendJson(res, code, obj) {
  const s = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(s);
}

/* ---------------- Sessions ---------------- */
let sessions = null;
function loadSessions() {
  if (sessions) return sessions;
  sessions = readJson(SESSIONS_FILE, {});
  return sessions;
}
function saveSessions() { try { ensureDir(); writeAtomic(SESSIONS_FILE, JSON.stringify(sessions)); } catch (e) {} }
function createSession(role, actorId) {
  loadSessions();
  const now = Date.now();
  for (const t of Object.keys(sessions)) if (now - sessions[t].created > SESSION_TTL_MS) delete sessions[t];
  const token = crypto.randomBytes(32).toString('hex');
  sessions[token] = { role, actorId, created: now };
  saveSessions();
  return token;
}
function tokenOf(req) {
  const h = req.headers.authorization || '';
  const m = /^Bearer\s+([a-f0-9]{64})$/i.exec(h);
  return m ? m[1] : '';
}
/* Returns the session for the request, or null. A session also ends when its
   person is removed from the data or their role changes. */
function sessionOf(req, data) {
  const token = tokenOf(req);
  if (!token) return null;
  loadSessions();
  const s = sessions[token];
  if (!s) return null;
  if (Date.now() - s.created > SESSION_TTL_MS || !findActor(data, s.role, s.actorId)) {
    delete sessions[token]; saveSessions(); return null;
  }
  return s;
}

function findActor(data, role, actorId) {
  if (!data) return null;
  if (role === 'shareholder') return (data.shareholders || []).find((x) => x.id === actorId) || null;
  if (PERSONNEL_ROLE[role]) return (data.teachers || []).find((x) => x.id === actorId && x.role === PERSONNEL_ROLE[role]) || null;
  if (role === 'student') return (data.studentProfiles || []).find((x) => x.id === actorId) || null;
  return null;
}
function passwordMatches(given, real) {
  if (typeof given !== 'string' || typeof real !== 'string' || !real || real === HIDDEN_PASSWORD) return false;
  const a = crypto.createHash('sha256').update(given).digest();
  const b = crypto.createHash('sha256').update(real).digest();
  return crypto.timingSafeEqual(a, b);
}

/* ---------------- Login throttling ---------------- */
const fails = new Map(); // key -> [timestamps]
function recentFails(key) {
  const now = Date.now();
  const list = (fails.get(key) || []).filter((t) => now - t < LOGIN_WINDOW_MS);
  if (list.length) fails.set(key, list); else fails.delete(key);
  return list;
}
function noteFail(key) { const l = recentFails(key); l.push(Date.now()); fails.set(key, l); }
function clientIp(req) {
  // nginx must set X-Real-IP (see README); otherwise every client looks like 127.0.0.1
  return String(req.headers['x-real-ip'] || req.socket.remoteAddress || '');
}

/* ---------------- Per-role views & write rules ---------------- */
function hidePasswords(data) {
  for (const k of PASSWORD_COLLECTIONS) {
    (data[k] || []).forEach((r) => { if (r && typeof r === 'object' && 'password' in r) r.password = HIDDEN_PASSWORD; });
  }
  delete data.accessPins;
}
function studentView(data, profileId) {
  const out = {};
  // Keep scalar settings/one-time-migration flags so the client doesn't re-run migrations.
  for (const k of Object.keys(data)) if (!Array.isArray(data[k]) && (typeof data[k] !== 'object' || data[k] === null)) out[k] = data[k];
  out.referralSettings = data.referralSettings;
  out.discountCodeSettings = data.discountCodeSettings;
  for (const k of Object.keys(data)) if (Array.isArray(data[k])) out[k] = [];
  const me = (data.studentProfiles || []).find((p) => p.id === profileId);
  out.studentProfiles = me ? [Object.assign({}, me, { password: HIDDEN_PASSWORD })] : [];
  out.students = (data.students || []).filter((s) => s.profileId === profileId);
  const myEnrollments = new Set(out.students.map((s) => s.id));
  const myClasses = new Set(out.students.map((s) => s.classId));
  out.classes = data.classes || [];
  out.teachers = (data.teachers || []).map((t) => ({ id: t.id, name: t.name, role: t.role, password: HIDDEN_PASSWORD }));
  const pick = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const r = {};
    for (const id of Object.keys(obj)) if (myEnrollments.has(id)) r[id] = obj[id];
    return r;
  };
  out.attendance = (data.attendance || []).filter((a) => myClasses.has(a.classId)).map((a) => {
    const r = Object.assign({}, a);
    for (const k of Object.keys(r)) if (r[k] && typeof r[k] === 'object' && !Array.isArray(r[k])) r[k] = pick(r[k]);
    return r;
  });
  out.__view = 'student';
  return out;
}
function viewFor(session, data) {
  if (!data) return data;
  const copy = JSON.parse(JSON.stringify(data));
  if (session.role === 'student') return studentView(copy, session.actorId);
  if (session.role !== 'shareholder') hidePasswords(copy);
  return copy;
}
/* Rejects data whose record ids could break out of the page's HTML/JS. */
function validateData(data) {
  for (const k of Object.keys(data)) {
    const v = data[k];
    if (!Array.isArray(v)) continue;
    for (const r of v) {
      if (!r || typeof r !== 'object' || !('id' in r)) continue;
      const okId = (typeof r.id === 'number' && isFinite(r.id)) || (typeof r.id === 'string' && r.id.length <= 200 && !UNSAFE_ID_CHARS.test(r.id));
      if (!okId) return 'bad_id:' + k;
    }
  }
  return '';
}
/* Keeps stored passwords and shareholder-only data unless the writer may change them. */
function protectOnWrite(session, incoming, current) {
  if (!current) return;
  const isShareholder = session && session.role === 'shareholder';
  for (const k of PASSWORD_COLLECTIONS) {
    const old = new Map((current[k] || []).filter((r) => r && r.id).map((r) => [r.id, r]));
    (incoming[k] || []).forEach((r) => {
      if (!r || typeof r !== 'object') return;
      const prev = old.get(r.id);
      if (prev) {
        if (!isShareholder || !r.password || r.password === HIDDEN_PASSWORD) r.password = prev.password;
      } else if (r.password === HIDDEN_PASSWORD) {
        r.password = '';
      }
    });
  }
  if (!isShareholder) {
    for (const k of SHAREHOLDER_ONLY_KEYS) {
      if (current[k] === undefined) delete incoming[k]; else incoming[k] = current[k];
    }
  }
  if (current.accessPins !== undefined) incoming.accessPins = current.accessPins;
}

/* ---------------- Static files (local testing only) ---------------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
function serveStatic(req, res, urlPath) {
  let rel;
  try { rel = decodeURIComponent(urlPath); } catch (e) { res.writeHead(400); return res.end('bad request'); }
  if (rel === '/' || rel === '') rel = '/index.html';
  const root = path.resolve(STATIC_DIR);
  const full = path.resolve(path.join(root, rel));
  if (full !== root && !full.startsWith(root + path.sep)) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(full, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
}

function readBody(req, cb) {
  let body = '';
  let tooBig = false;
  req.setEncoding('utf8');
  req.on('data', (c) => { if (tooBig) return; body += c; if (body.length > MAX_BODY) { tooBig = true; cb(413); req.destroy(); } });
  req.on('end', () => {
    if (tooBig) return;
    let payload;
    try { payload = JSON.parse(body); } catch (e) { return cb(400); }
    cb(0, payload);
  });
}

/* ---------------- Handlers ---------------- */
function handleDirectory(res) {
  const data = readData();
  if (!data) return sendJson(res, 200, { ok: true, empty: true, shareholders: [], teachers: [] });
  sendJson(res, 200, {
    ok: true, empty: false, version: readMeta().version,
    shareholders: (data.shareholders || []).map((s) => ({ id: s.id, name: s.name })),
    teachers: (data.teachers || []).map((t) => ({ id: t.id, name: t.name, role: t.role })),
  });
}

function handleLogin(req, res) {
  readBody(req, (err, p) => {
    if (err) return sendJson(res, err, { ok: false, error: 'bad_request' });
    const data = readData();
    if (!data) return sendJson(res, 409, { ok: false, empty: true });
    const role = p && p.role;
    const ip = clientIp(req);
    const acctKey = 'acct:' + role + ':' + String(p && (p.id || p.code) || '').toLowerCase();
    if (recentFails('ip:' + ip).length >= MAX_FAILS_PER_IP || recentFails(acctKey).length >= MAX_FAILS_PER_ACCOUNT) {
      return sendJson(res, 429, { ok: false, error: 'too_many_attempts' });
    }
    let actor = null;
    if (role === 'student') {
      const code = String(p.code || '').trim().toLowerCase();
      actor = code ? (data.studentProfiles || []).find((x) => String(x.code || '').toLowerCase() === code) : null;
    } else {
      actor = findActor(data, role, String(p.id || ''));
    }
    if (!actor || !passwordMatches(String(p.password || ''), actor.password)) {
      noteFail('ip:' + ip); noteFail(acctKey);
      return sendJson(res, 401, { ok: false, error: 'bad_credentials' });
    }
    fails.delete(acctKey);
    const token = createSession(role, actor.id);
    sendJson(res, 200, { ok: true, token, role, actorId: actor.id, actorName: actor.name || '' });
  });
}

function handleLogout(req, res) {
  const token = tokenOf(req);
  loadSessions();
  if (token && sessions[token]) { delete sessions[token]; saveSessions(); }
  sendJson(res, 200, { ok: true });
}

function handleGetDb(req, res, query) {
  ensureDir();
  const meta = readMeta();
  const data = readData();
  if (!data) return sendJson(res, 200, { ok: true, version: meta.version, data: null });
  const session = sessionOf(req, data);
  if (!session) return sendJson(res, 401, { ok: false, error: 'auth_required' });
  const since = query.get('since');
  if (since !== null && Number(since) === meta.version) return sendJson(res, 200, { ok: true, version: meta.version, unchanged: true });
  sendJson(res, 200, { ok: true, version: meta.version, data: viewFor(session, data) });
}

function handlePutDb(req, res) {
  readBody(req, (err, payload) => {
    if (err) return sendJson(res, err, { ok: false, error: err === 413 ? 'too_large' : 'bad_json' });
    ensureDir();
    if (!payload || typeof payload.data !== 'object' || payload.data === null || Array.isArray(payload.data)) {
      return sendJson(res, 400, { ok: false, error: 'no_data' });
    }
    const current = readData();
    const meta = readMeta();
    let session = null;
    if (current) {
      session = sessionOf(req, current);
      if (!session) return sendJson(res, 401, { ok: false, error: 'auth_required' });
      if (session.role === 'student') return sendJson(res, 403, { ok: false, error: 'read_only' });
    }
    // Without data on the server anyone may seed it once; after that a login is required.
    const bad = validateData(payload.data);
    if (bad) return sendJson(res, 400, { ok: false, error: bad });
    if (payload.data.__view) return sendJson(res, 400, { ok: false, error: 'partial_view' });
    const force = payload.force === true && session && session.role === 'shareholder';
    if (current && !force && payload.baseVersion !== meta.version) {
      return sendJson(res, 409, { ok: false, conflict: true, version: meta.version, data: viewFor(session, current) });
    }
    protectOnWrite(session, payload.data, current);
    try {
      writeAtomic(DB_FILE, JSON.stringify(payload.data));
      const nv = (meta.version || 0) + 1;
      writeAtomic(META_FILE, JSON.stringify({ version: nv, updatedAt: new Date().toISOString() }));
      return sendJson(res, 200, { ok: true, version: nv });
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: 'write_failed' });
    }
  });
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const urlPath = url.pathname;
    if (urlPath === '/api/health') return sendJson(res, 200, { ok: true, version: readMeta().version });
    if (urlPath === '/api/directory' && req.method === 'GET') return handleDirectory(res);
    if (urlPath === '/api/login' && req.method === 'POST') return handleLogin(req, res);
    if (urlPath === '/api/logout' && req.method === 'POST') return handleLogout(req, res);
    if (urlPath === '/api/db' && req.method === 'GET') return handleGetDb(req, res, url.searchParams);
    if (urlPath === '/api/db' && (req.method === 'PUT' || req.method === 'POST')) return handlePutDb(req, res);
    if (urlPath.startsWith('/api/')) return sendJson(res, 404, { ok: false, error: 'not_found' });
    if (STATIC_DIR) return serveStatic(req, res, urlPath);
    res.writeHead(404); res.end('not found');
  } catch (e) {
    console.error('request failed', e);
    try { sendJson(res, 500, { ok: false, error: 'server_error' }); } catch (e2) {}
  }
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    ensureDir();
    console.log('hadaf-sync listening on ' + HOST + ':' + PORT + ' data=' + DATA_DIR + (STATIC_DIR ? ' static=' + STATIC_DIR : ''));
  });
}
module.exports = { server, HIDDEN_PASSWORD };
