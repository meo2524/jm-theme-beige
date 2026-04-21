/* ════════════════════════════════════════════════════════════
   CART DRAWER — Mend & Co
   MendCart: AJAX add-to-cart, qty changes, remove, drawer UI.
   ════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── MONEY FORMATTER ──────────────────────────────────── */

  const moneyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: (window.Shopify && Shopify.currency && Shopify.currency.active) || 'USD',
    minimumFractionDigits: 2,
  });

  function formatMoney(cents) {
    return moneyFormatter.format(cents / 100);
  }

  /* ── FETCH HELPERS ────────────────────────────────────── */

  function cartPost(url, body) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (d) { throw new Error(d.description || r.statusText); });
      return r.json();
    });
  }

  function cartGet() {
    return fetch('/cart.js', { headers: { Accept: 'application/json' } }).then(function (r) {
      return r.json();
    });
  }

  /* ── ITEM RENDERER ────────────────────────────────────── */
  /* JS mirror of snippets/cart-item.liquid (context: drawer) */

  function renderItem(item) {
    var imgWidth = 80;
    var imgUrl   = item.featured_image && item.featured_image.url
      ? item.featured_image.url.replace(/(\.\w+)$/, '_' + imgWidth + 'x' + imgWidth + '$1')
      : null;
    var imgAlt   = escHtml((item.featured_image && item.featured_image.alt) || item.title);

    var imgTag = imgUrl
      ? '<img src="' + imgUrl + '" alt="' + imgAlt + '" width="' + imgWidth + '" height="' + imgWidth + '" loading="lazy" class="cart-item__img">'
      : '<div class="cart-item__img-placeholder"></div>';

    var variantHtml = item.variant_title && item.variant_title !== 'Default Title'
      ? '<p class="cart-item__variant">' + escHtml(item.variant_title) + '</p>'
      : '';

    var sellingPlanHtml = item.selling_plan_allocation
      ? '<p class="cart-item__sub">' + escHtml(item.selling_plan_allocation.selling_plan.name) + '</p>'
      : '';

    var compareHtml = item.original_line_price !== item.final_line_price
      ? '<span class="cart-item__price-compare">' + formatMoney(item.original_line_price) + '</span>'
      : '';

    return (
      '<div class="cart-item cart-item--drawer" data-cart-item="' + escAttr(item.key) + '" data-variant-id="' + item.variant_id + '">' +
        '<a href="' + escAttr(item.url) + '" class="cart-item__img-link" tabindex="-1" aria-hidden="true">' +
          '<div class="cart-item__img-wrap">' + imgTag + '</div>' +
        '</a>' +
        '<div class="cart-item__body">' +
          '<div class="cart-item__meta">' +
            '<a href="' + escAttr(item.url) + '" class="cart-item__title-link">' +
              '<span class="cart-item__title">' + escHtml(item.product_title) + '</span>' +
            '</a>' +
            variantHtml +
            sellingPlanHtml +
          '</div>' +
          '<div class="cart-item__controls">' +
            '<div class="cart-item__qty qty-stepper" role="group" aria-label="Quantity for ' + escAttr(item.title) + '">' +
              '<button class="qty-btn" type="button" aria-label="Decrease quantity" data-qty-change="-1">\u2212</button>' +
              '<input class="qty-input" type="number" value="' + item.quantity + '" min="0" aria-label="Quantity" data-item-qty>' +
              '<button class="qty-btn" type="button" aria-label="Increase quantity" data-qty-change="1">+</button>' +
            '</div>' +
            '<div class="cart-item__price-col">' +
              '<span class="cart-item__price" data-item-price>' + formatMoney(item.final_line_price) + '</span>' +
              compareHtml +
            '</div>' +
          '</div>' +
          '<button class="cart-item__remove" type="button" aria-label="Remove ' + escAttr(item.title) + ' from cart" data-item-remove="' + escAttr(item.key) + '">Remove</button>' +
        '</div>' +
      '</div>'
    );
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escAttr(str) {
    return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ── EMPTY STATE ──────────────────────────────────────── */

  function emptyStateHtml() {
    return (
      '<div class="cart-drawer__empty">' +
        '<div class="cart-drawer__empty-rule"></div>' +
        '<p class="cart-drawer__empty-text">Your cart is empty</p>' +
        '<a href="/collections/all" class="cart-drawer__shop-link" data-cart-close>Start shopping</a>' +
      '</div>'
    );
  }

  /* ── FOCUS TRAP ───────────────────────────────────────── */

  function getFocusable(container) {
    return Array.from(container.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
  }

  /* ── MEND CART ────────────────────────────────────────── */

  var MendCart = {

    drawer:       null,
    itemsWrap:    null,
    footer:       null,
    counts:       null,
    totals:       null,
    _lastFocus:   null,
    _trapHandler: null,

    init: function () {
      this.drawer    = document.querySelector('[data-cart-drawer]');
      if (!this.drawer) return;

      this.itemsWrap = this.drawer.querySelector('[data-cart-items]');
      this.footer    = this.drawer.querySelector('[data-cart-footer]');
      this.counts    = document.querySelectorAll('[data-cart-count]');
      this.totals    = document.querySelectorAll('[data-cart-total]');

      this._bindDrawerUI();
      this._bindCartEvents();
      this._bindATCForms();
    },

    /* ── DRAWER OPEN / CLOSE ──────────────────────────── */

    open: function () {
      this._lastFocus = document.activeElement;
      this.drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      this._activateTrap();

      /* Focus first focusable after paint */
      var self = this;
      requestAnimationFrame(function () {
        var focusable = getFocusable(self.drawer);
        if (focusable.length) focusable[0].focus();
      });
    },

    close: function () {
      this.drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      this._deactivateTrap();
      if (this._lastFocus) {
        this._lastFocus.focus();
        this._lastFocus = null;
      }
    },

    _activateTrap: function () {
      var self = this;
      this._trapHandler = function (e) {
        if (e.key !== 'Tab') return;
        var focusable = getFocusable(self.drawer);
        if (!focusable.length) return;
        var first = focusable[0];
        var last  = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
        }
      };
      document.addEventListener('keydown', this._trapHandler);
    },

    _deactivateTrap: function () {
      if (this._trapHandler) {
        document.removeEventListener('keydown', this._trapHandler);
        this._trapHandler = null;
      }
    },

    /* ── BIND DRAWER UI TRIGGERS ──────────────────────── */

    _bindDrawerUI: function () {
      var self = this;

      document.querySelectorAll('[data-cart-toggle]').forEach(function (btn) {
        btn.addEventListener('click', function () { self.open(); });
      });

      document.addEventListener('click', function (e) {
        if (e.target.closest('[data-cart-close]')) self.close();
        if (e.target.closest('[data-cart-overlay]')) self.close();
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && self.drawer.getAttribute('aria-hidden') === 'false') {
          self.close();
        }
      });
    },

    /* ── BIND QTY + REMOVE INSIDE DRAWER / CART PAGE ─── */

    _bindCartEvents: function () {
      var self = this;

      document.addEventListener('click', function (e) {
        /* Qty stepper buttons */
        var qtyBtn = e.target.closest('[data-qty-change]');
        if (qtyBtn) {
          var item = qtyBtn.closest('[data-cart-item]');
          if (!item) return;
          var input = item.querySelector('[data-item-qty]');
          if (!input) return;
          var delta   = parseInt(qtyBtn.dataset.qtyChange, 10);
          var current = parseInt(input.value, 10) || 0;
          var next    = Math.max(0, current + delta);
          input.value = next;
          self._changeQty(item.dataset.cartItem, next);
          return;
        }

        /* Remove button */
        var removeBtn = e.target.closest('[data-item-remove]');
        if (removeBtn) {
          self._changeQty(removeBtn.dataset.itemRemove, 0);
          return;
        }
      });

      /* Qty input direct edit — debounced */
      document.addEventListener('change', function (e) {
        if (!e.target.matches('[data-item-qty]')) return;
        var item = e.target.closest('[data-cart-item]');
        if (!item) return;
        var val = Math.max(0, parseInt(e.target.value, 10) || 0);
        e.target.value = val;
        self._changeQty(item.dataset.cartItem, val);
      });
    },

    /* ── INTERCEPT ADD-TO-CART FORMS ──────────────────── */

    _bindATCForms: function () {
      var self = this;
      document.addEventListener('submit', function (e) {
        var form = e.target.closest('[data-type="add-to-cart-form"]');
        if (!form) return;
        e.preventDefault();
        self._addToCart(form);
      });
    },

    /* ── CART MUTATIONS ───────────────────────────────── */

    _addToCart: function (form) {
      var self     = this;
      var formData = new FormData(form);
      var id       = formData.get('id');
      var qty      = parseInt(formData.get('quantity'), 10) || 1;

      var properties = {};
      formData.forEach(function (val, key) {
        if (key.startsWith('properties[')) {
          var propKey = key.replace(/^properties\[/, '').replace(/\]$/, '');
          properties[propKey] = val;
        }
      });

      var payload = { id: id, quantity: qty };
      if (Object.keys(properties).length) payload.properties = properties;

      var sellingPlan = formData.get('selling_plan');
      if (sellingPlan) payload.selling_plan = sellingPlan;

      var atcBtn = form.querySelector('[data-atc-btn], [name="add"]');
      if (atcBtn) {
        atcBtn.disabled = true;
        atcBtn.setAttribute('aria-busy', 'true');
      }

      self._setLoading(true);

      cartPost('/cart/add.js', payload)
        .then(function () { return self._refreshCart(); })
        .then(function () { self.open(); })
        .catch(function (err) {
          console.error('[MendCart] add-to-cart error:', err.message);
          self._setLoading(false);
        })
        .finally(function () {
          if (atcBtn) {
            atcBtn.disabled = false;
            atcBtn.removeAttribute('aria-busy');
          }
        });
    },

    _changeQty: function (key, qty) {
      var self = this;
      self._setLoading(true);

      cartPost('/cart/change.js', { id: key, quantity: qty })
        .then(function () { return self._refreshCart(); })
        .catch(function (err) {
          console.error('[MendCart] change qty error:', err.message);
          self._setLoading(false);
        });
    },

    /* ── REFRESH CART DOM ─────────────────────────────── */

    _refreshCart: function () {
      var self = this;
      return cartGet().then(function (cart) {
        self._updateCounts(cart.item_count, cart.total_price);
        self._updateTotals(cart.total_price);
        self._updateItems(cart);
        self._updateFooter(cart);
        self._setLoading(false);
        return cart;
      });
    },

    _updateCounts: function (count, total) {
      this.counts.forEach(function (el) {
        el.textContent = count > 0 ? count : '';
      });
      /* theme.js handles .is-hidden toggle + bump animation */
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: { count: count, total: total || 0 } }));
    },

    _updateTotals: function (cents) {
      var formatted = formatMoney(cents);
      this.totals.forEach(function (el) {
        el.textContent = formatted;
      });
    },

    _updateItems: function (cart) {
      if (!this.itemsWrap) return;

      /* Only re-render if the element is inside the drawer */
      if (!this.drawer.contains(this.itemsWrap)) return;

      if (cart.item_count === 0) {
        this.itemsWrap.innerHTML = emptyStateHtml();
        return;
      }

      this.itemsWrap.innerHTML = cart.items.map(renderItem).join('');
    },

    _updateFooter: function (cart) {
      if (!this.footer) return;

      if (cart.item_count === 0) {
        this.footer.innerHTML = '';
        return;
      }

      /* Only rebuild footer if it's missing the subtotal (e.g., was emptied) */
      if (!this.footer.querySelector('[data-cart-total]')) {
        this.footer.innerHTML =
          '<div class="cart-drawer__subtotal">' +
            '<span class="cart-drawer__subtotal-label">Subtotal</span>' +
            '<span class="cart-drawer__subtotal-price" data-cart-total>' + formatMoney(cart.total_price) + '</span>' +
          '</div>' +
          '<p class="cart-drawer__shipping-note">Shipping &amp; taxes calculated at checkout</p>' +
          '<a href="/checkout" class="cart-drawer__checkout" id="CartDrawerCheckout">Checkout</a>' +
          '<a href="/cart" class="cart-drawer__view-cart">View full cart</a>';

        /* Re-cache totals after DOM rebuild */
        this.totals = document.querySelectorAll('[data-cart-total]');
      } else {
        this._updateTotals(cart.total_price);
      }
    },

    /* ── LOADING STATE ────────────────────────────────── */

    _setLoading: function (on) {
      if (on) {
        this.drawer.classList.add('cart-drawer--loading');
      } else {
        this.drawer.classList.remove('cart-drawer--loading');
      }
    },

  };

  /* ── BOOT ─────────────────────────────────────────────── */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { MendCart.init(); });
  } else {
    MendCart.init();
  }

  /* Expose for external access (theme.js, custom scripts) */
  window.MendCart = MendCart;

})();
