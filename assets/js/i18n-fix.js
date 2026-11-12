/* i18n-fix.js — loaded after experience.js. Runs only in Arabic (dir="rtl").
   1. Isolates Latin technical terms (C#, .NET, ASP.NET Core, e-mail, phone) so
      the bidi algorithm stops moving dots, plus signs and hashes around.
   2. Mirrors trailing arrows (↗) as a separate glyph instead of flipping text.
   3. Translates <title>, meta description and Open Graph tags. */
(function () {
  "use strict";

  var root = document.documentElement;
  var isAr = function () { return root.getAttribute("dir") === "rtl"; };
  var ARABIC = /[\u0600-\u06FF]/;
  var LATIN = /[A-Za-z]/;
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, INPUT: 1, OPTION: 1, SELECT: 1, CODE: 1, PRE: 1 };

  // Latin phrase: optional leading dot (.NET), words joined by single spaces,
  // may contain . + # / & @ : _ - and digits (C#, ASP.NET Core, 8/9, a@b.com).
  var LATIN_RUN = /\.?[A-Za-z][A-Za-z0-9.+#\/&@:_-]*(?:[ ][A-Za-z0-9.+#\/&@:_-]+)*|\+\d[\d ]{6,}\d/g;
  var TRAILING = /[.,;:\-\/]+$/;

  var busy = false;

  function wrapTextNode(node) {
    var text = node.nodeValue;
    if (!ARABIC.test(text) || !LATIN.test(text)) return;       // only mixed-script text
    var parent = node.parentNode;
    if (!parent || parent.nodeType !== 1) return;
    if (SKIP[parent.tagName] || parent.closest("bdi.ltr")) return;

    var frag = document.createDocumentFragment();
    var last = 0, m, changed = false;
    LATIN_RUN.lastIndex = 0;
    while ((m = LATIN_RUN.exec(text))) {
      var run = m[0];
      var tail = (run.match(TRAILING) || [""])[0];
      if (tail) run = run.slice(0, run.length - tail.length);
      if (!run) continue;
      if (!LATIN.test(run) && run.charAt(0) !== "+") continue;
      var start = m.index, end = start + run.length;
      if (start > last) frag.appendChild(document.createTextNode(text.slice(last, start)));
      var bdi = document.createElement("bdi");
      bdi.className = "ltr";
      bdi.setAttribute("dir", "ltr");
      bdi.textContent = run;
      frag.appendChild(bdi);
      last = end;
      changed = true;
    }
    if (!changed) return;
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    parent.replaceChild(frag, node);
  }

  function isolateLatin(scope) {
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p || SKIP[p.tagName]) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(wrapTextNode);
  }

  // Leaf elements that are pure Latin (tags, labels) become LTR islands.
  function markLatinLeaves(scope) {
    scope.querySelectorAll("span, small, strong, b, em, kbd, a, button").forEach(function (el) {
      if (el.children.length || el.hasAttribute("data-bidi-auto") || el.classList.contains("morphing-text")) return;
      var t = el.textContent;
      if (LATIN.test(t) && !ARABIC.test(t)) el.setAttribute("data-bidi-auto", "");
    });
  }

  // "استكشف المشروع ↗": split the arrow into its own mirrored span.
  function wrapArrows(scope) {
    scope.querySelectorAll(".featured-action, .project-conversation, .resume-file").forEach(function (el) {
      if (el.querySelector(".dir-arrow")) return;
      var t = el.textContent;
      var m = t.match(/^([\s\S]*?)\s*([↗→])\s*$/);
      if (!m) return;
      el.textContent = m[1] + " ";
      var s = document.createElement("span");
      s.className = "dir-arrow";
      s.setAttribute("aria-hidden", "true");
      s.textContent = m[2];
      el.appendChild(s);
    });
  }

  // Page title + meta
  var META = {
    title: "عبد المعبود محمد | مهندس برمجيات أول Full-Stack .NET",
    description: "الموقع الشخصي والسيرة الذاتية لعبد المعبود محمد، مهندس برمجيات أول Full-Stack .NET في الرياض، المملكة العربية السعودية. خبرة في C# و ASP.NET Core و SQL Server و Clean Architecture و Azure."
  };
  var originals = {};
  function setMeta(sel, attr, value) {
    var el = document.querySelector(sel);
    if (!el) return;
    if (!(sel in originals)) originals[sel] = el.getAttribute(attr);
    el.setAttribute(attr, value === null ? originals[sel] : value);
  }
  function syncMeta(ar) {
    if (!("title" in originals)) originals.title = document.title;
    document.title = ar ? META.title : originals.title;
    setMeta('meta[name="description"]', "content", ar ? META.description : null);
    setMeta('meta[property="og:title"]', "content", ar ? META.title : null);
    setMeta('meta[property="og:description"]', "content", ar ? META.description : null);
    setMeta('meta[name="twitter:title"]', "content", ar ? META.title : null);
    setMeta('meta[name="twitter:description"]', "content", ar ? META.description : null);
  }

  function run() {
    if (busy) return;
    busy = true;
    try {
      var ar = isAr();
      syncMeta(ar);
      if (ar) {
        wrapArrows(document.body);
        isolateLatin(document.body);
        markLatinLeaves(document.body);
      }
    } finally {
      busy = false;
    }
  }

  var timer = null;
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(run, 60);
  }

  window.addEventListener("portfolio:langchange", schedule);
  new MutationObserver(function () { if (!busy && isAr()) schedule(); })
    .observe(document.body, { childList: true, subtree: true, characterData: true });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule);
  else schedule();
})();
