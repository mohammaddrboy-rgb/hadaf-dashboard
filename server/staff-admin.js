#!/usr/bin/env node
/* ============================================================
 * Adds a person to the personnel list, or sets someone's login password,
 * directly in the server's data — for accounts whose password must not be
 * written into the (public) repository.
 *
 *   node server/staff-admin.js add --name "Zahra Alizada" --role "مدیر آنلاین" \
 *        --gender female --password 'TEMP-PASSWORD' [--phone 07xx]
 *   node server/staff-admin.js set-password --code OM1405080001 --password 'NEW'
 *
 * Uses HADAF_DATA_DIR (default /var/www/hadaf-data), like server.js. The
 * running sync server picks the change up on its next request; devices
 * reload it because the data version goes up. Run as the user that owns
 * the data folder (e.g. with sudo -u).
 * ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Scope = require(path.join(__dirname, '..', 'js', 'branch-scope.js'));

const DATA_DIR = process.env.HADAF_DATA_DIR || '/var/www/hadaf-data';
const DB_FILE = path.join(DATA_DIR, 'db.json');
const META_FILE = path.join(DATA_DIR, 'meta.json');
const ROLES = ['مدرس', 'مدیریت', 'مدیر آنلاین', 'کارمند'];
const GENDERS = ['female', 'male', ''];

function fail(msg) { console.error('Error: ' + msg); process.exit(1); }
function args(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) { out[argv[i].slice(2)] = argv[i + 1] === undefined ? '' : argv[i + 1]; i++; }
    else out._.push(argv[i]);
  }
  return out;
}
function writeAtomic(file, str) { const tmp = file + '.tmp-' + process.pid; fs.writeFileSync(tmp, str); fs.renameSync(tmp, file); }
function load() {
  let data, meta;
  try { data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (e) { fail('cannot read ' + DB_FILE + ' (' + e.message + ')'); }
  try { meta = JSON.parse(fs.readFileSync(META_FILE, 'utf8')); } catch (e) { meta = { version: 0 }; }
  return { data, meta };
}
function store(data, meta) {
  writeAtomic(DB_FILE, JSON.stringify(data));
  writeAtomic(META_FILE, JSON.stringify({ version: (meta.version || 0) + 1, updatedAt: new Date().toISOString() }));
}
/* Gregorian -> Solar Hijri, same algorithm as g2jParts in js/app.js. */
function jalali(date) {
  let gy = date.getFullYear(), gm = date.getMonth() + 1, gd = date.getDate();
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = (gy <= 1600) ? 0 : 979; gy -= (gy <= 1600) ? 621 : 1600;
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd + gdm[gm - 1];
  jy += 33 * Math.floor(days / 12053); days %= 12053;
  jy += 4 * Math.floor(days / 1461); days %= 1461;
  if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365; }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  return [jy, jm];
}
/* Same pattern as generatePersonnelCode in js/app.js: letter(s) + Hijri year
   + month + 4-digit sequence, e.g. OM1405080001. */
function personnelCode(teachers, role, date) {
  const letter = role === 'مدیر آنلاین' ? 'OM' : role === 'مدیریت' ? 'M' : role === 'کارمند' ? 'E' : 'T';
  const [jy, jm] = jalali(date);
  const prefix = letter + jy + String(jm).padStart(2, '0');
  let max = 0;
  teachers.forEach((t) => {
    if (t && typeof t.code === 'string' && t.code.indexOf(prefix) === 0) {
      const n = parseInt(t.code.slice(prefix.length), 10); if (!isNaN(n) && n > max) max = n;
    }
  });
  return prefix + String(max + 1).padStart(4, '0');
}
function isoDay(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function checkPassword(pw, data, exceptId) {
  if (!pw || pw.length < 6) fail('--password must have at least 6 characters');
  const taken = [...(data.teachers || []), ...(data.shareholders || [])].some((p) => p && p.id !== exceptId && p.password === pw);
  if (taken) fail('that password is already used by someone else; choose another');
}

const a = args(process.argv.slice(2));
const cmd = a._[0];
const { data, meta } = load();
data.teachers = Array.isArray(data.teachers) ? data.teachers : [];

if (cmd === 'add') {
  const name = String(a.name || '').trim();
  const role = String(a.role || '').trim();
  const gender = String(a.gender || '').trim();
  if (!name) fail('--name is required');
  if (!ROLES.includes(role)) fail('--role must be one of: ' + ROLES.join(', '));
  if (!GENDERS.includes(gender)) fail('--gender must be female or male');
  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const existing = data.teachers.find((t) => t && norm(t.name) === norm(name));
  if (existing) fail('"' + name + '" is already in the personnel list (code ' + existing.code + '); use set-password to change the password');
  checkPassword(String(a.password || ''), data, null);
  if (role === 'مدیریت' && !Scope.BRANCHES.includes(a.branch)) fail('a branch manager needs --branch, one of: ' + Scope.BRANCHES.join(', '));
  const now = new Date();
  const rec = {
    id: Date.now().toString(36) + crypto.randomBytes(3).toString('hex'),
    code: personnelCode(data.teachers, role, now),
    name, role,
    branch: role === Scope.ONLINE_MANAGER_ROLE ? Scope.ONLINE : String(a.branch || ''),
    gender,
    phone: String(a.phone || ''), subjects: '',
    contractStart: isoDay(now), contractEnd: '',
    payType: '', payAmount: 0, dailyHours: 0, payPercent: 0,
    photo: '', idPhoto: '', password: String(a.password), note: '', createdAt: isoDay(now),
    canRequestAdvance: false,
  };
  data.teachers.unshift(rec);
  store(data, meta);
  const check = load().data.teachers.find((t) => t.id === rec.id);
  if (!check) fail('the record was overwritten by a save at the same moment; run the command again');
  console.log('Added ' + rec.name + ' — role ' + rec.role + ', branch ' + (rec.branch || '-') + ', code ' + rec.code);
  console.log('Login: «مدیر» tab, choose "' + rec.name + '", password as given. Salary type is not set yet (a shareholder sets it in «پرسنل و مدرسان»).');
} else if (cmd === 'set-password') {
  const code = String(a.code || '').trim().toLowerCase();
  const t = data.teachers.find((x) => x && String(x.code || '').toLowerCase() === code);
  if (!t) fail('no personnel with code ' + a.code);
  checkPassword(String(a.password || ''), data, t.id);
  t.password = String(a.password);
  store(data, meta);
  console.log('Password set for ' + t.name + ' (' + t.code + ').');
} else {
  console.log('Usage:\n  node server/staff-admin.js add --name "Name" --role "مدیر آنلاین" --gender female --password \'TEMP\' [--branch "شعبه مرکزی"] [--phone 07..]\n  node server/staff-admin.js set-password --code OM1405080001 --password \'NEW\'');
  process.exit(cmd ? 1 : 0);
}
