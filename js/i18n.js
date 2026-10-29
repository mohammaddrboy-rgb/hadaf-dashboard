/* ============================================================
 * Dari / English.
 * The dashboard is written in Dari. When English is chosen
 * (localStorage hadaf_lang = 'en'), this file loads the English
 * dictionary (js/i18n-en.js) and translates the page as it is built:
 * every text node, placeholder, title and tooltip, alert/confirm/prompt
 * messages, print windows and Excel exports. The page is shown left to
 * right with Latin digits.
 *
 * Text that is not in the dictionary — names, notes and other things staff
 * typed — is left as it is.
 *
 * Dictionary (window.HADAF_EN):
 *   'ثبت‌نام جدید': 'New registration'            exact phrase
 *   '{0} شاگرد': '{0} students'                     {0}, {1}… match any text,
 *                                                   which is translated too
 * Longer text that has no entry is split at separators (· ، : ( ) / …)
 * and each piece is looked up.
 *
 * Loaded in <head>, before the page body, so nothing flashes in Dari.
 * ============================================================ */
(function () {
  'use strict';
  var DICT_VERSION = '1.0';
  var lang = 'fa';
  try { lang = localStorage.getItem('hadaf_lang') === 'en' ? 'en' : 'fa'; } catch (e) {}
  var en = lang === 'en';
  window.HADAF_LANG = lang;
  window.hadafIsEn = en;
  window.hadafSetLang = function (l) {
    try { localStorage.setItem('hadaf_lang', l === 'en' ? 'en' : 'fa'); } catch (e) {}
    location.reload();
  };
  var root = document.documentElement;
  root.setAttribute('lang', en ? 'en' : 'fa');
  root.setAttribute('dir', en ? 'ltr' : 'rtl');
  if (!en) {
    window.tr = function (s) { return s; };
    window.hadafTranslateHtml = function (h) { return h; };
    window.hadafTranslateRows = function (r) { return r; };
    return;
  }
  root.classList.add('lang-en');

  var PERSIAN = /[؀-ۿ]/;
  var exact = new Map();
  var patterns = [];
  var missing = new Set(), missingWhole = new Set();
  window.__i18nMissing = missing;          // for checking coverage
  window.__i18nMissingWhole = missingWhole;

  function latinDigits(s) {
    return s.replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); })
      .replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); })
      .replace(/٪/g, '%').replace(/٫/g, '.').replace(/٬/g, ',');
  }
  // Keys and text are compared with Latin digits and punctuation, single spaces
  // and Persian letters, so «،» and «,» (or «۵» and «5») match the same entry.
  function norm(s) {
    return latinDigits(String(s).replace(/[\s\u00a0]+/g, ' ').replace(/ي/g, 'ی').replace(/ك/g, 'ک'))
      .replace(/\s*،\s*/g, ', ').replace(/\s*؛\s*/g, '; ').replace(/؟/g, '?').replace(/[«»]/g, '"').trim();
  }
  function punct(s) { return s.replace(/،\s*/g, ', ').replace(/؛\s*/g, '; ').replace(/؟/g, '?').replace(/«|»/g, '"'); }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function load(dict) {
    Object.keys(dict).forEach(function (k) {
      var v = dict[k];
      var key = norm(k);
      if (/\{\d\}/.test(key)) {
        var order = [];
        var re = escRe(key).replace(/\\\{(\d)\\\}/g, function (_, n) { order.push(Number(n)); return '(.+?)'; });
        // «…» around a placeholder, or a key ending in «{0}» after a label, marks a name slot
        var names = /\{\d\}$/.test(key) || /"\{\d\}"/.test(key);
        patterns.push({ re: new RegExp('^' + re + '$'), order: order, out: v, len: key.length, names: names });
      } else exact.set(key, v);
    });
    patterns.sort(function (a, b) { return b.len - a.len; });   // most specific first
  }

  function persianCount(s) { var m = s.match(/[؀-ۿ]/g); return m ? m.length : 0; }
  // Patterns whose {n} part is a name (e.g. «سلام، {0}») may keep that name in
  // Dari; any other pattern only counts when its {n} parts translate too, so a
  // pattern never swallows untranslated Dari around a number.
  function byPattern(s, allowNames) {
    for (var i = 0; i < patterns.length; i++) {
      var p = patterns[i], m = p.re.exec(s);
      if (!m) continue;
      var vals = {}, ok = true;
      for (var j = 0; j < p.order.length; j++) {
        var cap = m[j + 1], v = trCore(cap, true);
        if (PERSIAN.test(cap) && PERSIAN.test(v) && !(allowNames && p.names)) ok = false;
        vals[p.order[j]] = v;
      }
      if (ok) return p.out.replace(/\{(\d)\}/g, function (_, n) { return vals[n] !== undefined ? vals[n] : ''; });
    }
    return null;
  }
  function lookup(s, allowNames) {
    if (exact.has(s)) return exact.get(s);
    var c = s.replace(/\s*:$/, '');
    if (c !== s && exact.has(c)) return exact.get(c) + ':';
    return byPattern(s, allowNames);
  }
  // Separators, strongest first: text is split at the first one present and
  // each piece is translated on its own (and split further if needed).
  var SEPS = [/(\s*\n\s*)/, /(\s+\|\s+|\s*\|\s*)/, /(\s*[·•]\s*)/, /(\s+[—–]\s+)/, /(\s*\(\s*|\s*\)\s*)/,
    /(\s*"\s*)/, /(;\s+)/, /(\.\s+)/, /(\?\s*|!\s*)/, /(,\s+)/, /(:\s+|:$)/, /(\s+-\s+)/, /(\s+\/\s+)/];
  function bySplit(t, from) {
    for (var k = from; k < SEPS.length; k++) {
      var parts = t.split(SEPS[k]);
      if (parts.length < 2) continue;
      return parts.map(function (p, i) {
        if (i % 2) return punct(p);
        if (!p || !PERSIAN.test(p)) return latinDigits(p);
        var h = lookup(norm(p), false);
        if (h !== null) return latinDigits(h);
        return bySplit(norm(p), k + 1);
      }).join('');
    }
    missing.add(t);
    return t;
  }
  function trCore(s, inner) {
    var t = norm(s);
    if (!t || !PERSIAN.test(t)) return latinDigits(t);
    if (exact.has(t)) return latinDigits(exact.get(t));
    var hit = lookup(t, false);
    if (hit !== null) return latinDigits(hit);
    var split = bySplit(t, 0);
    if (PERSIAN.test(split)) {
      // Leftover Dari is a name or other typed text: a name pattern may wrap it.
      var named = byPattern(t, true);
      if (named !== null && persianCount(named) < persianCount(split)) split = named;
      if (!inner) missingWhole.add(t);
    }
    return latinDigits(split);
  }
  /* Translates one string, keeping its leading/trailing spaces. */
  var cache = new Map();
  function tr(s) {
    if (s === null || s === undefined) return s;
    s = String(s);
    if (!PERSIAN.test(s) && !/[۰-۹٠-٩٪]/.test(s)) return s;
    var hit = cache.get(s);
    if (hit !== undefined) return hit;
    var out = trUncached(s);
    if (cache.size > 20000) cache.clear();
    cache.set(s, out);
    return out;
  }
  function trUncached(s) {
    var lead = /^\s*/.exec(s)[0], trail = /\s*$/.exec(s)[0];
    if (s.indexOf('\n') >= 0 && s.trim().indexOf('\n') >= 0) {
      return s.split('\n').map(function (line) { return line.trim() ? tr(line) : line; }).join('\n');
    }
    return lead + trCore(s) + trail;
  }
  window.tr = tr;

  /* ---------------- DOM ---------------- */
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1 };
  var ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  function skipped(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentNode) {
      if (SKIP[e.nodeName] || e.isContentEditable || e.hasAttribute('data-no-tr')) return true;
    }
    return false;
  }
  function trTextNode(n) {
    var v = n.data;
    if (!PERSIAN.test(v) && !/[۰-۹٠-٩٪]/.test(v)) return;
    if (n.parentNode && skipped(n.parentNode)) return;
    var t = tr(v);
    if (t !== v) n.data = t;
  }
  function trAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i], v = el.getAttribute(a);
      if (v && (PERSIAN.test(v) || /[۰-۹]/.test(v))) { var t = tr(v); if (t !== v) el.setAttribute(a, t); }
    }
    if (el.nodeName === 'INPUT' && (el.type === 'button' || el.type === 'submit') && PERSIAN.test(el.value)) el.value = tr(el.value);
  }
  function trTree(node) {
    if (!node) return;
    if (node.nodeType === 3) { trTextNode(node); return; }
    if (node.nodeType !== 1 && node.nodeType !== 9 && node.nodeType !== 11) return;
    if (node.nodeType === 1) { if (SKIP[node.nodeName] || node.hasAttribute('data-no-tr')) return; trAttrs(node); }
    var walker = (node.ownerDocument || node).createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (n) {
        if (n.nodeType === 1) return (SKIP[n.nodeName] || n.hasAttribute('data-no-tr')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var list = [], n;
    while ((n = walker.nextNode())) list.push(n);
    list.forEach(function (t) { var v = t.data; if (PERSIAN.test(v) || /[۰-۹٠-٩٪]/.test(v)) { var o = tr(v); if (o !== v) t.data = o; } });
    if (node.querySelectorAll) {
      var els = node.querySelectorAll('[placeholder],[title],[aria-label],[alt],input[type=button],input[type=submit]');
      for (var i = 0; i < els.length; i++) if (!skipped(els[i])) trAttrs(els[i]);
    }
  }
  window.hadafTranslateTree = trTree;

  var pending = [], queued = false;
  function flush() {
    queued = false;
    var batch = pending; pending = [];
    for (var i = 0; i < batch.length; i++) {
      var m = batch[i];
      if (m.type === 'characterData') trTextNode(m.target);
      else if (m.type === 'attributes') { if (m.target.nodeType === 1 && !skipped(m.target)) trAttrs(m.target); }
      else for (var j = 0; j < m.addedNodes.length; j++) trTree(m.addedNodes[j]);
    }
  }
  var observer = new MutationObserver(function (records) {
    // Translate right away (before paint) so Dari never flashes.
    for (var i = 0; i < records.length; i++) pending.push(records[i]);
    if (!queued) { queued = true; flush(); }
  });

  /* ---------------- Print windows and Excel ---------------- */
  // Translates a whole HTML document string (print windows) and makes it LTR.
  window.hadafTranslateHtml = function (html) {
    try {
      var doc = new DOMParser().parseFromString(String(html), 'text/html');
      doc.documentElement.setAttribute('dir', 'ltr');
      doc.documentElement.setAttribute('lang', 'en');
      trTree(doc.documentElement);
      return '<!doctype html>' + doc.documentElement.outerHTML;
    } catch (e) { return html; }
  };
  // Translates Excel rows: column names and text cells (numbers stay numbers).
  window.hadafTranslateRows = function (rows) {
    return (rows || []).map(function (r) {
      var o = {};
      Object.keys(r).forEach(function (k) { var v = r[k]; o[tr(k)] = typeof v === 'string' ? tr(v) : v; });
      return o;
    });
  };
  // window.open('') + document.write(...) is how receipts and code sheets print.
  var _open = window.open;
  window.open = function (url) {
    var w = _open.apply(window, arguments);
    if (w && (!url || url === 'about:blank')) {
      try {
        var d = w.document, _write = d.write.bind(d);
        d.write = function (h) { return _write(window.hadafTranslateHtml(h)); };
      } catch (e) {}
    }
    return w;
  };
  ['alert', 'confirm', 'prompt'].forEach(function (fn) {
    var orig = window[fn];
    window[fn] = function (msg) {
      var args = Array.prototype.slice.call(arguments);
      if (typeof msg === 'string') args[0] = tr(msg);
      return orig.apply(window, args);
    };
  });

  window.HADAF_I18N_READY = function (dict) {
    load(dict || {});
    trTree(document.documentElement);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  };
  document.write('<script src="js/i18n-en.js?v=' + DICT_VERSION + '"><\/script>');
})();
