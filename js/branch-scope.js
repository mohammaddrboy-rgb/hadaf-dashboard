/* ============================================================
 * Branches and what a branch manager may see and change.
 * Shared by the browser (window.HadafBranchScope) and the sync server
 * (require('../js/branch-scope.js')), so both apply the same rules.
 *
 * Branch managers: Aminullah Zafari — شعبه مرکزی, Sharif Wafa — شعبه قلعه نو,
 * Barat Ebrahimi — شعبه سرپل (KNOWN_MANAGERS below).
 *
 * A branch manager (personnel role «مدیریت») works in one branch, stored
 * on their personnel record as `branch`. They see only that branch's:
 *   classes (branch), enrollments and attendance of those classes, student
 *   profiles enrolled there (or registered there), expenses, book
 *   purchases and other income (branch), seminars held there or online,
 *   and personnel whose home branch it is, who teach a class there, or who
 *   have no branch and no class yet (newly added staff).
 * Projects, meetings and class types are shared by everyone. A manager
 * without a branch sees no branch data until a shareholder sets one.
 *
 * The server sends managers only their part (scopeView) and, when they
 * save, keeps everything outside it exactly as it was (mergeWrite).
 * ============================================================ */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HadafBranchScope = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var BRANCHES = ['شعبه مرکزی', 'شعبه قلعه نو', 'شعبه سرپل'];
  var ONLINE = 'آنلاین';
  var MANAGER_ROLE = 'مدیریت';
  // Old branch names (Persian, Arabic-Indic or Latin digits) -> new names.
  var RENAMES = {
    'شعبه ۲': BRANCHES[1], 'شعبه ٢': BRANCHES[1], 'شعبه 2': BRANCHES[1],
    'شعبه ۳': BRANCHES[2], 'شعبه ٣': BRANCHES[2], 'شعبه 3': BRANCHES[2],
  };
  // Branch managers named by the academy; each inner list is one part of the
  // name (any spelling in it may match).
  var KNOWN_MANAGERS = [
    { branch: BRANCHES[0], parts: [['امین', 'amin'], ['ظفری', 'zafari']] },
    { branch: BRANCHES[1], parts: [['شریف', 'sharif'], ['وفا', 'wafa']] },
    { branch: BRANCHES[2], parts: [['برات', 'barat'], ['ابراهیمی', 'ibrahimi', 'ebrahimi']] },
  ];
  // Bumped when the list above changes: the named managers are then moved to
  // their listed branch once, even if a branch was already set.
  var MANAGER_ASSIGNMENT = 2;
  // Collections whose records belong to a branch (everything else is shared).
  var SCOPED = ['classes', 'students', 'studentProfiles', 'attendance', 'expenses', 'bookPurchases',
    'donations', 'seminars', 'teachers', 'teacherAdvances', 'advanceRequests', 'discountCodes',
    'activityLog', 'teacherAttendance'];

  function arr(v) { return Array.isArray(v) ? v : []; }
  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function normName(s) {
    return String(s || '').toLowerCase().replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[\s‌‏‎]+/g, '');
  }
  function knownManagerBranch(name) {
    var n = normName(name);
    if (!n) return '';
    for (var i = 0; i < KNOWN_MANAGERS.length; i++) {
      var ok = KNOWN_MANAGERS[i].parts.every(function (alts) { return alts.some(function (a) { return n.indexOf(normName(a)) >= 0; }); });
      if (ok) return KNOWN_MANAGERS[i].branch;
    }
    return '';
  }

  /* Renames old branches everywhere and gives the named managers their
     branch: once per MANAGER_ASSIGNMENT for the named managers, otherwise
     only to managers whose branch was never set (so a shareholder's later
     choice stays). Returns true when something changed. Safe to run any
     number of times. */
  function migrate(data) {
    if (!isObj(data)) return false;
    var changed = false;
    Object.keys(data).forEach(function (k) {
      arr(data[k]).forEach(function (r) {
        if (!isObj(r)) return;
        if (typeof r.branch === 'string' && RENAMES[r.branch.trim()]) { r.branch = RENAMES[r.branch.trim()]; changed = true; }
        if (k === 'seminars' && typeof r.location === 'string' && RENAMES[r.location.trim()]) { r.location = RENAMES[r.location.trim()]; changed = true; }
      });
    });
    var reassign = data.managerBranchAssignment !== MANAGER_ASSIGNMENT;
    arr(data.teachers).forEach(function (t) {
      if (!isObj(t) || t.role !== MANAGER_ROLE || (t.branch !== undefined && !reassign)) return;
      var b = knownManagerBranch(t.name);
      if (b && t.branch !== b) { t.branch = b; changed = true; }
    });
    if (reassign) { data.managerBranchAssignment = MANAGER_ASSIGNMENT; changed = true; }
    return changed;
  }

  function managerBranch(data, actorId) {
    var t = arr(data && data.teachers).find(function (x) { return isObj(x) && x.id === actorId; });
    return t && t.role === MANAGER_ROLE ? String(t.branch || '') : '';
  }

  /* Which records of `data` belong to `branch`, built collection by
     collection because later rules depend on earlier ones. */
  function Ctx(data, branch, actorId, actorName) {
    var B = branch;
    var classIn = {}, classTeachers = {}, enrollIn = {}, profileIn = {}, teacherIn = {};
    arr(data.classes).forEach(function (c) {
      if (!isObj(c)) return;
      [c.teacherId, c.teacher2Id].forEach(function (tid) { if (tid) (classTeachers[tid] = classTeachers[tid] || {})[c.branch || ''] = 1; });
      if (B && c.branch === B) classIn[c.id] = 1;
    });
    arr(data.students).forEach(function (s) { if (isObj(s) && classIn[s.classId]) { enrollIn[s.id] = 1; profileIn[s.profileId] = 1; } });
    arr(data.studentProfiles).forEach(function (p) { if (isObj(p) && B && p.branch === B) profileIn[p.id] = 1; });
    arr(data.teachers).forEach(function (t) {
      if (!isObj(t)) return;
      var teaches = classTeachers[t.id];
      if (t.id === actorId || (B && (t.branch === B || (teaches && teaches[B]))) || (B && !t.branch && !teaches)) teacherIn[t.id] = 1;
    });
    this.rules = {
      classes: function (c) { return !!classIn[c.id]; },
      students: function (s) { return !!enrollIn[s.id]; },
      studentProfiles: function (p) { return !!profileIn[p.id]; },
      attendance: function (a) { return !!classIn[a.classId]; },
      expenses: function (e) { return !!B && e.branch === B; },
      bookPurchases: function (b) { return !!B && b.branch === B; },
      donations: function (d) { return !!B && d.branch === B; },
      seminars: function (s) { return s.location === ONLINE || (!!B && s.location === B); },
      teachers: function (t) { return !!teacherIn[t.id]; },
      teacherAdvances: function (a) { return !!teacherIn[a.teacherId]; },
      advanceRequests: function (a) { return !!teacherIn[a.teacherId]; },
      discountCodes: function (d) { return d.status !== 'used' || !!enrollIn[d.usedEnrollmentId]; },
      activityLog: function (l) { return l.role === 'manager' && l.actor === actorName; },
    };
    this.teacherIn = teacherIn;
  }
  Ctx.prototype.visible = function (key, rec) {
    var rule = this.rules[key];
    return !rule || (isObj(rec) && rule(rec));
  };
  // Personnel discipline records hold everyone's marks/hours for one day.
  function pickPeople(obj, keep) {
    var out = {};
    Object.keys(obj || {}).forEach(function (id) { if (keep(id)) out[id] = obj[id]; });
    return out;
  }

  /* Trims `data` (a copy) in place to what the manager may see. */
  function scopeView(data, branch, actorId, actorName) {
    var ctx = new Ctx(data, branch, actorId, actorName);
    SCOPED.forEach(function (k) {
      if (!Array.isArray(data[k])) return;
      if (k === 'teacherAttendance') {
        data[k] = data[k].filter(isObj).map(function (r) {
          var o = Object.assign({}, r);
          if (isObj(r.marks)) o.marks = pickPeople(r.marks, function (id) { return ctx.teacherIn[id]; });
          if (isObj(r.hours)) o.hours = pickPeople(r.hours, function (id) { return ctx.teacherIn[id]; });
          return o;
        });
        return;
      }
      data[k] = data[k].filter(function (r) { return ctx.visible(k, r); });
    });
    return data;
  }

  function keyOf(k, r) {
    if (!isObj(r)) return null;
    if (k === 'attendance') return r.classId + '|' + r.date;
    if (k === 'teacherAttendance') return 'd|' + r.date;
    return r.id !== undefined ? 'id|' + r.id : null;
  }

  /* A manager saved `incoming` (built on their trimmed view). Rebuilds the
     full data in place: records outside their part stay exactly as in
     `current`; inside it their version wins, but a change that would move a
     record out of their part (e.g. a class to another branch) or create
     one outside it is ignored. */
  function mergeWrite(incoming, current, branch, actorId, actorName) {
    var before = new Ctx(current, branch, actorId, actorName);
    var curByKey = {};
    SCOPED.forEach(function (k) {
      if (!Array.isArray(current[k])) return;
      var m = curByKey[k] = {};
      current[k].forEach(function (r) { var key = keyOf(k, r); if (key !== null) m[key] = r; });
    });
    // 1. Hidden current records + the manager's records.
    SCOPED.forEach(function (k) {
      if (k === 'teacherAttendance') return;
      if (k === 'activityLog') return;
      var cur = arr(current[k]);
      if (!Array.isArray(incoming[k])) { if (Array.isArray(current[k])) incoming[k] = cur.slice(); return; }
      var hidden = {}, out = [];
      cur.forEach(function (r) { if (!before.visible(k, r)) { var key = keyOf(k, r); if (key !== null) hidden[key] = 1; } });
      incoming[k].forEach(function (r) { var key = keyOf(k, r); if (key === null || !hidden[key]) out.push(r); });
      cur.forEach(function (r) { var key = keyOf(k, r); if (key === null || hidden[key]) out.push(r); });
      incoming[k] = out;
    });
    // 2. Drop or revert the manager's records that end up outside their branch.
    var after = new Ctx(incoming, branch, actorId, actorName);
    SCOPED.forEach(function (k) {
      if (k === 'teacherAttendance' || k === 'activityLog' || !Array.isArray(incoming[k])) return;
      var cur = curByKey[k] || {};
      incoming[k] = incoming[k].map(function (r) {
        var key = keyOf(k, r);
        var old = key !== null ? cur[key] : undefined;
        if (old !== undefined && !before.visible(k, old)) return old;   // hidden: untouched
        if (after.visible(k, r)) return r;
        return old;                                                   // moved out: keep the old one; new: drop
      }).filter(function (r) { return r !== undefined; });
    });
    // A manager can't change their own role or branch.
    var me = arr(current.teachers).find(function (t) { return isObj(t) && t.id === actorId; });
    arr(incoming.teachers).forEach(function (t, i) {
      if (isObj(t) && me && t.id === actorId) incoming.teachers[i] = Object.assign({}, t, { role: me.role, branch: me.branch });
    });
    // Nor delete a student or teacher that another branch still uses.
    function restore(k, ids) {
      if (!Array.isArray(incoming[k])) return;
      var have = {};
      incoming[k].forEach(function (r) { if (isObj(r)) have[r.id] = 1; });
      arr(current[k]).forEach(function (r) { if (isObj(r) && ids[r.id] && !have[r.id]) incoming[k].push(r); });
    }
    var usedProfiles = {}, usedTeachers = {};
    arr(incoming.students).forEach(function (s) { if (isObj(s) && !after.visible('students', s)) usedProfiles[s.profileId] = 1; });
    arr(incoming.classes).forEach(function (c) { if (isObj(c) && !after.visible('classes', c)) { usedTeachers[c.teacherId] = 1; usedTeachers[c.teacher2Id] = 1; } });
    restore('studentProfiles', usedProfiles);
    restore('teachers', usedTeachers);
    // 3. Personnel discipline: their marks/hours for their people, everyone else's as before.
    if (Array.isArray(incoming.teacherAttendance) || Array.isArray(current.teacherAttendance)) {
      var days = {}, order = [];
      arr(current.teacherAttendance).forEach(function (r) { if (isObj(r) && !days[r.date]) { days[r.date] = { cur: r }; order.push(r.date); } });
      arr(incoming.teacherAttendance).forEach(function (r) {
        if (!isObj(r)) return;
        if (!days[r.date]) { days[r.date] = {}; order.push(r.date); }
        days[r.date].inc = r;
      });
      incoming.teacherAttendance = order.map(function (d) {
        var c = days[d].cur || {}, n = days[d].inc || {};
        var o = Object.assign({}, c, n, { date: d });
        ['marks', 'hours'].forEach(function (f) {
          if (!isObj(c[f]) && !isObj(n[f])) return;
          var v = pickPeople(c[f], function (id) { return !after.teacherIn[id]; });
          Object.keys(n[f] || {}).forEach(function (id) { if (after.teacherIn[id]) v[id] = n[f][id]; });
          o[f] = v;
        });
        return o;
      });
    }
    // 4. Activity log: only adds entries.
    if (Array.isArray(current.activityLog) || Array.isArray(incoming.activityLog)) {
      var seen = {}, log = [];
      arr(current.activityLog).forEach(function (l) { if (isObj(l)) seen[l.id] = 1; });
      arr(incoming.activityLog).forEach(function (l) { if (isObj(l) && !seen[l.id]) { seen[l.id] = 1; log.push(l); } });
      incoming.activityLog = log.concat(arr(current.activityLog));
    }
    return incoming;
  }

  /* Gives a new record a free code when its code (student / personnel /
     shareholder login code) is already taken by another record — e.g. two
     managers who can't see each other's students registering at once. */
  function fixDuplicateCodes(incoming, current) {
    var changed = false;
    ['studentProfiles', 'teachers', 'shareholders'].forEach(function (k) {
      var list = arr(incoming[k]);
      var old = {};
      arr(current && current[k]).forEach(function (r) { if (isObj(r)) old[r.id] = r.code; });
      var owner = {};
      // Records that already had their code keep it; new or changed ones come second.
      var ordered = list.filter(function (r) { return isObj(r) && r.code && old[r.id] === r.code; })
        .concat(list.filter(function (r) { return isObj(r) && r.code && old[r.id] !== r.code; }));
      ordered.forEach(function (r) {
        var code = String(r.code);
        if (!owner[code.toLowerCase()]) { owner[code.toLowerCase()] = r.id; return; }
        var m = /^(.*?)(\d{4})$/.exec(code);
        var prefix = m ? m[1] : code + '-';
        var max = 0;
        list.forEach(function (x) {
          if (!isObj(x) || typeof x.code !== 'string' || x.code.indexOf(prefix) !== 0) return;
          var n = Number(x.code.slice(prefix.length)); if (isFinite(n) && n > max) max = n;
        });
        r.code = prefix + String(max + 1).padStart(4, '0');
        owner[r.code.toLowerCase()] = r.id;
        changed = true;
      });
    });
    return changed;
  }

  return {
    BRANCHES: BRANCHES, ONLINE: ONLINE, MANAGER_ROLE: MANAGER_ROLE, SCOPED: SCOPED,
    migrate: migrate, managerBranch: managerBranch, knownManagerBranch: knownManagerBranch,
    scopeView: scopeView, mergeWrite: mergeWrite, fixDuplicateCodes: fixDuplicateCodes,
  };
});
