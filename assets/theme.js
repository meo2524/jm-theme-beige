/* STUB — full implementation coming next session */

// ---- Sticky header scroll class ----
(function () {
  const header = document.querySelector('[data-header]');
  if (!header) return;
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ---- Mobile menu ----
(function () {
  const toggle  = document.querySelector('[data-menu-toggle]');
  const menu    = document.querySelector('[data-mobile-menu]');
  const overlay = document.querySelector('[data-nav-overlay]');
  if (!toggle || !menu) return;

  function openMenu() {
    menu.classList.add('is-open');
    overlay && overlay.classList.add('is-visible');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    menu.classList.remove('is-open');
    overlay && overlay.classList.remove('is-visible');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  overlay && overlay.addEventListener('click', closeMenu);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
})();

// ---- Cart count update ----
document.addEventListener('cart:updated', function (e) {
  const counts = document.querySelectorAll('[data-cart-count]');
  const count  = e.detail?.count ?? 0;
  counts.forEach(el => {
    el.textContent = count;
    el.classList.toggle('is-hidden', count === 0);
    if (count > 0) {
      el.classList.add('is-bumping');
      el.addEventListener('animationend', () => el.classList.remove('is-bumping'), { once: true });
    }
  });
});
