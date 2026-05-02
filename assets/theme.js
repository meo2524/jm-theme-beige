/* ════════════════════════════════════════════════════════════
   THEME.JS — Mend & Co
   Global page-level behaviour: sticky header, mobile menu,
   cart count badge animation.

   Section-specific JS lives inline in each section file.
   Cart AJAX lives in component-cart-drawer.js (MendCart),
   which dispatches 'cart:updated' after every mutation.
   ════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── STICKY HEADER ─────────────────────────────────────── */
  /*
   * Uses IntersectionObserver on a 1px sentinel injected just
   * below the header. When the sentinel leaves the viewport the
   * header is "scrolled" and gets .is-scrolled. Falls back to a
   * rAF-throttled scroll listener for old browsers.
   */

  var header = document.querySelector('[data-header]');

  if (header) {
    if ('IntersectionObserver' in window) {
      var sentinel = document.createElement('div');
      sentinel.setAttribute('aria-hidden', 'true');
      sentinel.style.cssText = [
        'position:absolute',
        'top:' + (header.offsetHeight || 80) + 'px',
        'left:0',
        'height:1px',
        'width:100%',
        'pointer-events:none',
        'visibility:hidden',
      ].join(';');
      document.body.insertBefore(sentinel, document.body.firstChild);

      new IntersectionObserver(function (entries) {
        header.classList.toggle('is-scrolled', !entries[0].isIntersecting);
      }).observe(sentinel);
    } else {
      /* Fallback — rAF throttle avoids layout thrash on every pixel */
      var _ticking = false;
      function onScroll() {
        if (_ticking) return;
        _ticking = true;
        requestAnimationFrame(function () {
          header.classList.toggle('is-scrolled', window.scrollY > 10);
          _ticking = false;
        });
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  }


  /* ── MOBILE MENU ────────────────────────────────────────── */

  var menuToggle = document.querySelector('[data-menu-toggle]');
  var mobileMenu = document.querySelector('[data-mobile-menu]');
  var navOverlay = document.querySelector('[data-nav-overlay]');
  var _menuLastFocus = null;

  function _menuFocusable() {
    if (!mobileMenu) return [];
    return Array.from(mobileMenu.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
  }

  function _menuTrapHandler(e) {
    if (e.key === 'Escape') {
      closeMenu();
      return;
    }
    if (e.key !== 'Tab') return;
    var focusable = _menuFocusable();
    if (!focusable.length) return;
    var first = focusable[0];
    var last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  }

  function openMenu() {
    if (!mobileMenu || !menuToggle) return;
    _menuLastFocus = document.activeElement;
    mobileMenu.classList.add('is-open');
    mobileMenu.removeAttribute('aria-hidden');
    if (navOverlay) { navOverlay.classList.add('is-visible'); navOverlay.removeAttribute('aria-hidden'); }
    menuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', _menuTrapHandler);
    requestAnimationFrame(function () {
      var focusable = _menuFocusable();
      if (focusable.length) focusable[0].focus();
    });
  }

  function closeMenu() {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    if (navOverlay) { navOverlay.classList.remove('is-visible'); navOverlay.setAttribute('aria-hidden', 'true'); }
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', _menuTrapHandler);
    if (_menuLastFocus) { _menuLastFocus.focus(); _menuLastFocus = null; }
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', function () {
      menuToggle.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu();
    });
  }

  if (navOverlay) navOverlay.addEventListener('click', closeMenu);

  var menuCloseBtn = document.querySelector('[data-menu-close]');
  if (menuCloseBtn) menuCloseBtn.addEventListener('click', closeMenu);


  /* ── CART COUNT BADGE ANIMATION ─────────────────────────── */
  /*
   * MendCart dispatches 'cart:updated' with { detail: { count } }
   * after every add / change / remove. We own the .is-hidden toggle
   * and bump animation here so MendCart stays data-only.
   */

  document.addEventListener('cart:updated', function (e) {
    var count = (e.detail && e.detail.count != null) ? e.detail.count : 0;

    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.classList.toggle('is-hidden', count === 0);

      if (count > 0) {
        /* Force reflow so animation restarts if fired in quick succession */
        el.classList.remove('is-bumping');
        void el.offsetWidth;
        el.classList.add('is-bumping');
        el.addEventListener('animationend', function () {
          el.classList.remove('is-bumping');
        }, { once: true });
      }
    });
  });

})();
