/* ════════════════════════════════════════════════════════════
   MOTION.JS — Mend & Co
   2026-tech motion layer. Plugs into existing markup via data-*.
   All animations transform/opacity only. Honours reduced-motion.

   Hooks:
     [data-reveal]               fade/slide-up on enter
     [data-word-reveal]          children spans fade-in stagger
     [data-count-up]             integer tick from 0 to value on enter
     [data-scroll-progress]      fills as page scrolls
     [data-pulse-dot]            ensures dot is animating (CSS-driven)
   ════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ── 1. Reveal on scroll ─────────────────────────────────── */

  function initReveal() {
    var els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;

    if (prefersReduced || !hasIO) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseInt(el.getAttribute('data-reveal-delay'), 10) || 0;
        if (delay) {
          setTimeout(function () { el.classList.add('is-visible'); }, delay);
        } else {
          el.classList.add('is-visible');
        }
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ── 2. Word reveal (hero headlines) ─────────────────────── */
  /*
   * Markup:  <h1 data-word-reveal>Biometric health. Decoded nightly.</h1>
   * Each word is wrapped in a span; spans fade-in on enter, 60ms stagger.
   */

  function splitWords(el) {
    if (el.dataset.wordSplit === 'done') return;
    var text = el.textContent;
    el.textContent = '';
    text.split(/(\s+)/).forEach(function (chunk) {
      if (/^\s+$/.test(chunk)) {
        el.appendChild(document.createTextNode(chunk));
      } else if (chunk.length) {
        var span = document.createElement('span');
        span.className = 'word-reveal__word';
        span.textContent = chunk;
        el.appendChild(span);
      }
    });
    el.dataset.wordSplit = 'done';
  }

  function initWordReveal() {
    var els = document.querySelectorAll('[data-word-reveal]');
    if (!els.length) return;

    els.forEach(splitWords);

    if (prefersReduced || !hasIO) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.4 });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ── 3. Count-up numbers ─────────────────────────────────── */
  /*
   * Markup: <span data-count-up="2100" data-count-suffix="+">2,100+</span>
   * Reads target value from attr, ticks from 0 to value over ~1.4s.
   */

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count-up'), 10);
    if (isNaN(target)) return;
    var suffix = el.getAttribute('data-count-suffix') || '';
    var prefix = el.getAttribute('data-count-prefix') || '';
    var duration = parseInt(el.getAttribute('data-count-duration'), 10) || 1400;
    var useCommas = el.getAttribute('data-count-commas') !== 'false';
    var start = performance.now();

    function format(n) {
      var rounded = Math.round(n);
      var str = useCommas ? rounded.toLocaleString('en-US') : String(rounded);
      return prefix + str + suffix;
    }

    function tick(now) {
      var elapsed = now - start;
      var t = Math.min(elapsed / duration, 1);
      el.textContent = format(target * easeOutCubic(t));
      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function initCountUp() {
    var els = document.querySelectorAll('[data-count-up]');
    if (!els.length) return;

    if (prefersReduced || !hasIO) {
      els.forEach(function (el) {
        var v = parseInt(el.getAttribute('data-count-up'), 10);
        if (!isNaN(v)) {
          var pre = el.getAttribute('data-count-prefix') || '';
          var suf = el.getAttribute('data-count-suffix') || '';
          el.textContent = pre + v.toLocaleString('en-US') + suf;
        }
      });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ── 4. Scroll progress bar ──────────────────────────────── */
  /*
   * Markup: <div data-scroll-progress></div>  (one per page, fixed top)
   */

  function initScrollProgress() {
    var bar = document.querySelector('[data-scroll-progress]');
    if (!bar) return;
    if (prefersReduced) {
      bar.style.transform = 'scaleX(1)';
      return;
    }

    var ticking = false;
    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      bar.style.transform = 'scaleX(' + pct + ')';
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });

    window.addEventListener('resize', update, { passive: true });
    update();
  }

  /* ── 5. Spec pill tap tooltip ────────────────────────────── */
  /*
   * Markup: <span class="mc-spec-pill" data-spec-tip="message">
   * On click/tap, injects a tooltip element + toggles is-tip-open.
   * One tooltip open at a time. Closes on outside click or Esc.
   */

  function initSpecTooltips() {
    var pills = document.querySelectorAll('.mc-spec-pill[data-spec-tip]');
    if (!pills.length) return;

    function closeAll() {
      document.querySelectorAll('.mc-spec-pill.is-tip-open').forEach(function (p) {
        p.classList.remove('is-tip-open');
      });
    }

    pills.forEach(function (pill) {
      var tip = document.createElement('span');
      tip.className = 'mc-spec-tooltip';
      tip.setAttribute('role', 'tooltip');
      tip.textContent = pill.getAttribute('data-spec-tip') || '';
      pill.appendChild(tip);

      pill.addEventListener('click', function (e) {
        e.stopPropagation();
        var wasOpen = pill.classList.contains('is-tip-open');
        closeAll();
        if (!wasOpen) pill.classList.add('is-tip-open');
      });
    });

    document.addEventListener('click', closeAll);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAll();
    });
  }

  /* ── 6. Boot ─────────────────────────────────────────────── */

  function boot() {
    initReveal();
    initWordReveal();
    initCountUp();
    initScrollProgress();
    initSpecTooltips();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* Re-scan on Shopify section reload (theme editor) */
  document.addEventListener('shopify:section:load', boot);
})();
