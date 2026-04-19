/* STUB — full implementation coming with cart-drawer build */
(function () {
  const drawer  = document.querySelector('[data-cart-drawer]');
  const toggles = document.querySelectorAll('[data-cart-toggle]');
  const closes  = document.querySelectorAll('[data-cart-close]');
  const overlay = document.querySelector('[data-cart-overlay]');

  if (!drawer) return;

  function openCart()  { drawer.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
  function closeCart() { drawer.setAttribute('aria-hidden', 'true');  document.body.style.overflow = ''; }

  toggles.forEach(btn => btn.addEventListener('click', openCart));
  closes.forEach(btn  => btn.addEventListener('click', closeCart));
  if (overlay) overlay.addEventListener('click', closeCart);

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });
})();
