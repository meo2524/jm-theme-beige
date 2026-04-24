(function () {
  'use strict';

  if (window.__mcQvInit) return;
  window.__mcQvInit = true;

  var dialog = null;
  var bodyEl = null;
  var cache  = {};
  var cacheKeys = [];
  var CACHE_MAX = 40;
  var fetchController = null;

  function cacheSet(handle, html) {
    var idx = cacheKeys.indexOf(handle);
    if (idx > -1) cacheKeys.splice(idx, 1);
    if (cacheKeys.length >= CACHE_MAX) delete cache[cacheKeys.shift()];
    cache[handle] = html;
    cacheKeys.push(handle);
  }

  /* -- Dialog factory (lazy, singleton) ---------------------- */
  function getDialog() {
    if (dialog) return dialog;

    dialog = document.createElement('dialog');
    dialog.className = 'mc-qv-dialog';
    dialog.setAttribute('aria-modal', 'true');
    dialog.innerHTML =
      '<button class="mc-qv-close" aria-label="Close quick view">' +
        '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">' +
          '<path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
        '</svg>' +
      '</button>' +
      '<div class="mc-qv-body is-loading"><div class="mc-qv-spinner"></div></div>';

    bodyEl = dialog.querySelector('.mc-qv-body');
    document.body.appendChild(dialog);

    dialog.querySelector('.mc-qv-close').addEventListener('click', close);
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) close();
    });

    return dialog;
  }

  function close() {
    if (dialog) dialog.close();
  }

  /* -- Open: fetch and inject --------------------------------- */
  function open(handle) {
    var d = getDialog();
    setLoading(true);
    d.showModal();
    document.body.style.overflow = 'hidden';
    d.addEventListener('close', function onClose() {
      document.body.style.overflow = '';
      d.removeEventListener('close', onClose);
    }, { once: true });

    if (cache[handle]) { inject(cache[handle]); return; }

    if (fetchController) fetchController.abort();
    fetchController = new AbortController();

    fetch('/products/' + handle + '?view=quick-view', { signal: fetchController.signal })
      .then(function (r) {
        if (!r.ok) throw new Error('fetch failed');
        return r.text();
      })
      .then(function (html) {
        fetchController = null;
        cacheSet(handle, html);
        inject(html);
      })
      .catch(function (err) {
        if (err.name === 'AbortError') return;
        fetchController = null;
        setLoading(false);
        bodyEl.innerHTML = '<p style="padding:3.2rem;color:#8A6240">Could not load product.</p>';
      });
  }

  function setLoading(on) {
    bodyEl.classList.toggle('is-loading', on);
    if (on) bodyEl.innerHTML = '<div class="mc-qv-spinner"></div>';
  }

  function inject(html) {
    var parsed  = new DOMParser().parseFromString(html, 'text/html');
    var content = parsed.querySelector('.mc-qv-content');
    if (!content) {
      setLoading(false);
      bodyEl.innerHTML = '<p style="padding:3.2rem;color:#8A6240">Product not available.</p>';
      return;
    }
    bodyEl.innerHTML = '';
    bodyEl.appendChild(content);
    initForm(bodyEl);
  }

  /* -- Wire up form, qty stepper, buy-now -------------------- */
  function initForm(root) {
    var select  = root.querySelector('.mc-qv-select');
    var idInput = root.querySelector('.mc-qv-variant-id');
    var priceEl = root.querySelector('.mc-qv-price');
    var cmpEl   = root.querySelector('.mc-qv-compare-price');
    var btn     = root.querySelector('.mc-qv-atc');
    var btnText = root.querySelector('.mc-qv-atc-text');
    var stockEl = root.querySelector('.mc-qv-stock');
    var qtyInput= root.querySelector('.mc-qv-qty__input');
    var buyNow  = root.querySelector('[data-qv-buynow]');

    /* Quantity stepper */
    root.querySelectorAll('[data-qty-dec],[data-qty-inc]').forEach(function (b) {
      b.addEventListener('click', function () {
        var val = parseInt(qtyInput.value, 10) || 1;
        qtyInput.value = b.hasAttribute('data-qty-inc')
          ? val + 1
          : Math.max(1, val - 1);
      });
    });

    /* Variant select */
    if (select && idInput) {
      select.addEventListener('change', function () {
        var opt   = select.options[select.selectedIndex];
        var avail = opt.dataset.available === 'true';
        idInput.value = opt.value;
        if (priceEl && opt.dataset.price) priceEl.textContent = opt.dataset.price;
        if (cmpEl) {
          cmpEl.textContent = opt.dataset.compare || '';
          cmpEl.hidden      = !opt.dataset.compare;
        }
        if (btn) {
          btn.disabled = !avail;
          if (btnText) btnText.textContent = avail ? 'Add to Bag' : 'Sold Out';
        }
        if (stockEl) {
          stockEl.classList.toggle('mc-qv-stock--out', !avail);
          var dot = stockEl.querySelector('.mc-qv-stock__dot');
          stockEl.childNodes[stockEl.childNodes.length - 1].textContent =
            avail ? ' Stock Adequate! Ready to Ship' : ' Out of Stock';
        }
        if (buyNow) {
          buyNow.dataset.qvBuynow = opt.value;
          buyNow.disabled = !avail;
        }
      });
    }

    /* Add to Bag submit */
    var form = root.querySelector('.mc-qv-form');
    if (form && btn && btnText) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        btn.dataset.state = 'adding';
        btnText.textContent = 'Adding...';

        fetch('/cart/add.js', { method: 'POST', body: new FormData(form) })
          .then(function (r) {
            if (!r.ok) throw new Error();
            return r.json();
          })
          .then(function () {
            btn.dataset.state = 'added';
            btnText.textContent = 'Added!';
            document.dispatchEvent(new CustomEvent('cart:refresh', { detail: { openDrawer: true } }));
            setTimeout(function () {
              close();
              delete btn.dataset.state;
              btnText.textContent = 'Add to Bag';
            }, 1200);
          })
          .catch(function () {
            delete btn.dataset.state;
            btnText.textContent = 'Add to Bag';
          });
      });
    }

    /* Buy with Shop — add to cart then go to checkout */
    if (buyNow) {
      buyNow.addEventListener('click', function () {
        var variantId = buyNow.dataset.qvBuynow;
        var qty       = qtyInput ? (parseInt(qtyInput.value, 10) || 1) : 1;
        buyNow.disabled = true;

        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: variantId, quantity: qty })
        })
        .then(function () {
          window.location.href = '/checkout';
        })
        .catch(function () {
          buyNow.disabled = false;
        });
      });
    }
  }

  /* -- Delegated trigger click ------------------------------- */
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-quick-view]');
    if (!trigger) return;
    e.preventDefault();
    open(trigger.dataset.quickView);
  });

})();
