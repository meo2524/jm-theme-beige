(function () {
  'use strict';

  if (window.__mcQvInit) return;
  window.__mcQvInit = true;

  var dialog = null;
  var bodyEl = null;
  var cache  = {};

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
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && dialog.open) close();
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
        bodyEl.innerHTML = '<p style="padding:3.2rem;color:#9a7e57">Could not load product.</p>';
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
      bodyEl.innerHTML = '<p style="padding:3.2rem;color:#9a7e57">Product not available.</p>';
      return;
    }
    bodyEl.classList.remove('is-loading');
    bodyEl.innerHTML = '';
    bodyEl.appendChild(content);
    initCarousel(bodyEl);
    initForm(bodyEl);
  }

  /* -- Carousel ---------------------------------------------- */
  function initCarousel(root) {
    var slides  = root.querySelectorAll('.mc-qv-carousel__slide');
    var dots    = root.querySelectorAll('.mc-qv-carousel__dot');
    var prevBtn = root.querySelector('[data-carousel-prev]');
    var nextBtn = root.querySelector('[data-carousel-next]');
    if (!slides.length) return;

    var current = 0;

    function goTo(idx) {
      slides[current].classList.remove('is-active');
      if (dots[current]) dots[current].classList.remove('is-active');
      current = (idx + slides.length) % slides.length;
      slides[current].classList.add('is-active');
      if (dots[current]) dots[current].classList.add('is-active');
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { goTo(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { goTo(current + 1); });
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () { goTo(parseInt(dot.dataset.dot, 10)); });
    });
  }

  /* -- Variant form ------------------------------------------ */
  function initForm(root) {
    var variantsJson = root.querySelector('.mc-qv-variants-json');
    if (!variantsJson) return;

    var variants = JSON.parse(variantsJson.textContent);
    var idInput  = root.querySelector('.mc-qv-variant-id');
    var priceEl  = root.querySelector('.mc-qv-price');
    var cmpEl    = root.querySelector('.mc-qv-compare-price');
    var btn      = root.querySelector('.mc-qv-atc');
    var btnText  = root.querySelector('.mc-qv-atc-text');
    var qtyInput = root.querySelector('.mc-qv-qty__input');
    var optBtns  = root.querySelectorAll('.mc-qv-opt-btn');

    /* Track selected option values {pos: val} */
    var selected = {};
    root.querySelectorAll('.mc-qv-opt-btn.is-active').forEach(function (b) {
      selected[b.dataset.optPos] = b.dataset.optVal;
    });

    function findVariant() {
      return variants.find(function (v) {
        return Object.keys(selected).every(function (pos) {
          return v['option' + pos] === selected[pos];
        });
      });
    }

    function applyVariant(v) {
      if (!v) return;
      if (idInput) idInput.value = v.id;
      if (priceEl) priceEl.textContent = v.price;
      if (cmpEl) {
        if (v.compare) {
          cmpEl.textContent = v.compare;
          cmpEl.hidden = false;
        } else {
          cmpEl.textContent = '';
          cmpEl.hidden = true;
        }
      }
      if (btn) {
        btn.disabled = !v.available;
        if (btnText) btnText.textContent = v.available ? 'Add to Cart' : 'Sold Out';
      }
    }

    /* Option button clicks */
    optBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var pos = b.dataset.optPos;
        root.querySelectorAll('[data-opt-pos="' + pos + '"]').forEach(function (x) {
          x.classList.remove('is-active');
        });
        b.classList.add('is-active');
        selected[pos] = b.dataset.optVal;
        applyVariant(findVariant());
      });
    });

    /* Quantity stepper */
    root.querySelectorAll('[data-qty-dec],[data-qty-inc]').forEach(function (b) {
      b.addEventListener('click', function () {
        var val = parseInt(qtyInput.value, 10) || 1;
        qtyInput.value = b.hasAttribute('data-qty-inc')
          ? val + 1
          : Math.max(1, val - 1);
      });
    });

    /* Add to cart submit */
    var form = root.querySelector('.mc-qv-form');
    if (form && btn && btnText) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        btn.dataset.state = 'adding';
        btnText.textContent = 'Adding…';

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
              btnText.textContent = 'Add to Cart';
            }, 1200);
          })
          .catch(function () {
            delete btn.dataset.state;
            btnText.textContent = 'Add to Cart';
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
