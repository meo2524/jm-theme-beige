(function () {
  'use strict';

  var dialog = null;
  var bodyEl = null;
  var cache = {};

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

    /* Backdrop click closes */
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) close();
    });

    return dialog;
  }

  function close() {
    if (dialog) dialog.close();
  }

  /* -- Open: fetch and inject content ------------------------ */

  function open(handle) {
    var d = getDialog();
    setLoading(true);
    d.showModal();
    document.body.style.overflow = 'hidden';

    d.addEventListener('close', function onClose() {
      document.body.style.overflow = '';
      d.removeEventListener('close', onClose);
    }, { once: true });

    if (cache[handle]) {
      inject(cache[handle]);
      return;
    }

    fetch('/products/' + handle + '?view=quick-view')
      .then(function (r) {
        if (!r.ok) throw new Error('fetch failed');
        return r.text();
      })
      .then(function (html) {
        cache[handle] = html;
        inject(html);
      })
      .catch(function () {
        setLoading(false);
        bodyEl.innerHTML = '<p style="padding:3.2rem;color:var(--color-olive)">Could not load product.</p>';
      });
  }

  function setLoading(on) {
    bodyEl.classList.toggle('is-loading', on);
    if (on) bodyEl.innerHTML = '<div class="mc-qv-spinner"></div>';
  }

  function inject(html) {
    var parsed = new DOMParser().parseFromString(html, 'text/html');
    var content = parsed.querySelector('.mc-qv-content');
    if (!content) {
      setLoading(false);
      bodyEl.innerHTML = '<p style="padding:3.2rem;color:var(--color-olive)">Product not available.</p>';
      return;
    }
    setLoading(false);
    bodyEl.appendChild(content);
    initForm(bodyEl);
  }

  /* -- Variant select + ATC wiring --------------------------- */

  function initForm(root) {
    var select   = root.querySelector('.mc-qv-select');
    var idInput  = root.querySelector('.mc-qv-variant-id');
    var priceEl  = root.querySelector('.mc-qv-price');
    var cmpEl    = root.querySelector('.mc-qv-compare-price');
    var btn      = root.querySelector('.mc-qv-atc');
    var btnText  = root.querySelector('.mc-qv-atc-text');

    if (select && idInput) {
      select.addEventListener('change', function () {
        var opt = select.options[select.selectedIndex];
        idInput.value = opt.value;
        if (priceEl && opt.dataset.price) priceEl.textContent = opt.dataset.price;
        if (cmpEl) {
          cmpEl.textContent = opt.dataset.compare || '';
          cmpEl.hidden = !opt.dataset.compare;
        }
        if (btn) {
          var avail = opt.dataset.available === 'true';
          btn.disabled = !avail;
          if (btnText) btnText.textContent = avail ? 'Add to cart' : 'Sold out';
        }
      });
    }

    var form = root.querySelector('.mc-qv-form');
    if (form && btn && btnText) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        btn.dataset.state = 'adding';
        btnText.textContent = 'Adding...';

        fetch('/cart/add.js', { method: 'POST', body: new FormData(form) })
          .then(function (r) {
            if (!r.ok) throw new Error('add failed');
            return r.json();
          })
          .then(function () {
            btn.dataset.state = 'added';
            btnText.textContent = 'Added!';
            document.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true }));
            setTimeout(function () {
              close();
              delete btn.dataset.state;
              btnText.textContent = 'Add to cart';
            }, 1200);
          })
          .catch(function () {
            delete btn.dataset.state;
            btnText.textContent = 'Add to cart';
          });
      });
    }
  }

  /* -- Delegated trigger click ------------------------------- */

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-quick-view]');
    if (!btn) return;
    e.preventDefault();
    open(btn.dataset.quickView);
  });

})();
