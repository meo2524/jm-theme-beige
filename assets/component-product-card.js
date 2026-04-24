(function () {
  if (window.__mcCardAtcInit) return;
  window.__mcCardAtcInit = true;

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-card-atc]');
    if (!btn || btn.disabled) return;
    e.preventDefault();

    var variantId = btn.dataset.cardAtc;
    btn.disabled = true;

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: JSON.stringify({ id: variantId, quantity: 1 })
    })
    .then(function (res) { return res.json(); })
    .then(function () {
      btn.classList.add('is-added');
      document.dispatchEvent(new CustomEvent('cart:refresh', { detail: { openDrawer: true } }));
      setTimeout(function () {
        btn.classList.remove('is-added');
        btn.disabled = false;
      }, 1800);
    })
    .catch(function () { btn.disabled = false; });
  });
})();
