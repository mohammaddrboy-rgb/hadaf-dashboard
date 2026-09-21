/* ============================================================
 * Hadaf dashboard — shared data service (Node.js, stdlib only)
 * Stores the whole dashboard `db` object as one JSON file so every
 * device/browser reads and writes the SAME data.
 *
 * Endpoints (same-origin, proxied by nginx at /api/):
 *   GET  /api/health         -> { ok }
 *   GET  /api/db             -> { ok, version, data }
 *   PUT  /api/db  (or POST)  -> body { baseVersion?, force?, data }
 *                               200 { ok, version } on success
 *                               409 { ok:false, conflict:true, version, data } on version mismatch
 *
 * Config via env:
 *   PORT         (default 8791)
 *   HADAF_DATA_DIR (default /var/www/hadaf-data)
 *   STATIC_DIR   (optional) if set, also serves static files from it (local testing only)
 * ============================================================ */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 8791);
const HOST = process.env.HOST || '127.0.0.1';
const DATA_DIR = process.env.HADAF_DATA_DIR || '/var/www/hadaf-data';
const DB_FILE = path.join(DATA_DIR, 'db.json');
const META_FILE = path.join(DATA_DIR, 'meta.json');
const STATIC_DIR = process.env.STATIC_DIR || '';
const MAX_BODY = 30 * 1024 * 1024; // 30 MB

function ensureDir() { try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {} }
function readMeta() { try { return JSON.parse(fs.readFileSync(META_FILE, 'utf8')); } catch (e) { return { version: 0 }; } }
function readData() { try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { return null; } }
function writeAtomic(file, str) { const tmp = file + '.tmp-' + process.pid; fs.writeFileSync(tmp, str); fs.renameSync(tmp, file); }

function sendJson(res, code, obj) {
  const s = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(s);
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
function serveStatic(req, res, urlPath) {
  let rel = decodeURIComponent(urlPath.split('?')[0]);
  if (rel === '/' || rel === '') rel = '/index.html';
  const full = path.normalize(path.join(STATIC_DIR, rel));
  if (!full.startsWith(path.normalize(STATIC_DIR))) { res.writeHead(403); return res.end('forbidden'); }
  fs.readFile(full, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
}

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '').split('?')[0];

  if (urlPath === '/api/health') return sendJson(res, 200, { ok: true, version: readMeta().version });

  if (urlPath === '/api/db' && req.method === 'GET') {
    ensureDir();
    return sendJson(res, 200, { ok: true, version: readMeta().version, data: readData() });
  }

  if (urlPath === '/api/db' && (req.method === 'PUT' || req.method === 'POST')) {
    let body = '';
    let tooBig = false;
    req.on('data', (c) => { body += c; if (body.length > MAX_BODY) { tooBig = true; req.destroy(); } });
    req.on('end', () => {
      if (tooBig) return;
      ensureDir();
      let payload;
      try { payload = JSON.parse(body); } catch (e) { return sendJson(res, 400, { ok: false, error: 'bad_json' }); }
      if (!payload || typeof payload.data !== 'object' || payload.data === null) return sendJson(res, 400, { ok: false, error: 'no_data' });
      const meta = readMeta();
      const force = payload.force === true;
      if (!force && typeof payload.baseVersion === 'number' && payload.baseVersion !== meta.version) {
        return sendJson(res, 409, { ok: false, conflict: true, version: meta.version, data: readData() });
      }
      try {
        writeAtomic(DB_FILE, JSON.stringify(payload.data));
        const nv = (meta.version || 0) + 1;
        writeAtomic(META_FILE, JSON.stringify({ version: nv, updatedAt: new Date().toISOString() }));
        return sendJson(res, 200, { ok: true, version: nv });
      } catch (e) {
        return sendJson(res, 500, { ok: false, error: 'write_failed' });
      }
    });
    return;
  }

  if (STATIC_DIR) return serveStatic(req, res, urlPath);
  res.writeHead(404); res.end('not found');
});

server.listen(PORT, HOST, () => {
  ensureDir();
  console.log('hadaf-sync listening on ' + HOST + ':' + PORT + ' data=' + DATA_DIR + (STATIC_DIR ? ' static=' + STATIC_DIR : ''));
});
