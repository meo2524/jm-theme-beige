/* ================================================================
   CART DRAWER -- Mend & Co
   MendCart: AJAX add-to-cart, qty changes, remove, drawer UI.
   ================================================================ */

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
  /* Mirror of snippets/cart-item.liquid (context: drawer) */

  function renderItem(item) {
    var imgUrl = item.featured_image && item.featured_image.url
      ? item.featured_image.url.replace(/(\.\w+)$/, '_80x80$1')
      : null;
    var imgAlt = escHtml((item.featured_image && item.featured_image.alt) || item.title);

    var imgTag = imgUrl
      ? '<img src="' + imgUrl + '" alt="' + imgAlt + '" width="80" height="80" loading="lazy" class="cart-item__img">'
      : '<div class="cart-item__img-placeholder"></div>';

    var variantHtml = item.variant_title && item.variant_title !== 'Default Title'
      ? '<p class="cart-item__variant">' + escHtml(item.variant_title) + '</p>'
      : '';

    var subText = item.selling_plan_allocation
      ? escHtml(item.selling_plan_allocation.selling_plan.name)
      : 'One-time purchase';

    var savings = item.original_line_price - item.final_line_price;

    var compareHtml = savings > 0
      ? '<span class="cart-item__price-compare">' + formatMoney(item.original_line_price) + '</span>'
      : '';

    var saveBadge = savings > 0
      ? '<span class="cart-item__save-badge">Save ' + formatMoney(savings) + '</span>'
      : '';

    var trashSvg =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<polyline points="3 6 5 6 21 6"/>' +
        '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>' +
      '</svg>';

    return (
      '<div class="cart-item cart-item--drawer" data-cart-item="' + escAttr(item.key) + '" data-variant-id="' + item.variant_id + '">' +
        '<a href="' + escAttr(item.url) + '" class="cart-item__img-link" tabindex="-1" aria-hidden="true">' +
          '<div class="cart-item__img-wrap">' + imgTag + '</div>' +
        '</a>' +
        '<div class="cart-item__body">' +
          '<div class="cart-item__top">' +
            '<div class="cart-item__meta">' +
              '<a href="' + escAttr(item.url) + '" class="cart-item__title-link">' +
                '<span class="cart-item__title">' + escHtml(item.product_title) + '</span>' +
              '</a>' +
              variantHtml +
              '<p class="cart-item__sub">' + subText + '</p>' +
            '</div>' +
            '<button class="cart-item__remove" type="button" aria-label="Remove ' + escAttr(item.title) + ' from cart" data-item-remove="' + escAttr(item.key) + '">' +
              trashSvg +
            '</button>' +
          '</div>' +
          '<div class="cart-item__bottom">' +
            '<div class="cart-item__qty qty-stepper" role="group" aria-label="Quantity for ' + escAttr(item.title) + '">' +
              '<button class="qty-btn" type="button" aria-label="Decrease quantity" data-qty-change="-1">-</button>' +
              '<input class="qty-input" type="number" value="' + item.quantity + '" min="0" aria-label="Quantity" data-item-qty>' +
              '<button class="qty-btn" type="button" aria-label="Increase quantity" data-qty-change="1">+</button>' +
            '</div>' +
            '<div class="cart-item__price-group">' +
              compareHtml +
              '<span class="cart-item__price" data-item-price>' + formatMoney(item.final_line_price) + '</span>' +
              saveBadge +
            '</div>' +
          '</div>' +
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
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
  }

  /* ── MEND CART ────────────────────────────────────────── */

  var MendCart = {

    drawer:                  null,
    itemsWrap:               null,
    footer:                  null,
    counts:                  null,
    countLabels:             null,
    totals:                  null,
    _lastFocus:              null,
    _trapHandler:            null,
    _protectionVariantId:    null,
    _protectionToggle:       null,
    _lastCart:               null,

    init: function () {
      this.drawer = document.querySelector('[data-cart-drawer]');
      if (!this.drawer) return;

      this.itemsWrap  = this.drawer.querySelector('[data-cart-items]');
      this.footer     = this.drawer.querySelector('[data-cart-footer]');
      this.counts     = document.querySelectorAll('[data-cart-count]');
      this.countLabels = document.querySelectorAll('[data-cart-count-label]');
      this.totals     = document.querySelectorAll('[data-cart-total]');

      var toggle = document.getElementById('CartProtectionToggle');
      if (toggle && toggle.dataset.protectionVariant) {
        this._protectionToggle    = toggle;
        this._protectionVariantId = toggle.dataset.protectionVariant;
      }

      this._bindDrawerUI();
      this._bindCartEvents();
      this._bindATCForms();
      this._bindProtectionToggle();
      this._initGoals();
    },

    /* ── DRAWER OPEN / CLOSE ──────────────────────────── */

    open: function () {
      this._lastFocus = document.activeElement;
      this.drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      this._activateTrap();
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
        if (e.target.closest('[data-cart-close]'))   self.close();
        if (e.target.closest('[data-cart-overlay]')) self.close();
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && self.drawer.getAttribute('aria-hidden') === 'false') {
          self.close();
        }
      });
    },

    /* ── BIND QTY + REMOVE ────────────────────────────── */

    _bindCartEvents: function () {
      var self = this;

      document.addEventListener('click', function (e) {
        var qtyBtn = e.target.closest('[data-qty-change]');
        if (qtyBtn) {
          var item  = qtyBtn.closest('[data-cart-item]');
          if (!item) return;
          var input   = item.querySelector('[data-item-qty]');
          if (!input) return;
          var delta   = parseInt(qtyBtn.dataset.qtyChange, 10);
          var current = parseInt(input.value, 10) || 0;
          var next    = Math.max(0, current + delta);
          input.value = next;
          self._changeQty(item.dataset.cartItem, next);
          return;
        }

        var removeBtn = e.target.closest('[data-item-remove]');
        if (removeBtn) {
          self._changeQty(removeBtn.dataset.itemRemove, 0);
          return;
        }
      });

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

    /* ── PROTECTION TOGGLE ────────────────────────────── */

    _bindProtectionToggle: function () {
      if (!this._protectionToggle) return;
      var self = this;

      this._protectionToggle.addEventListener('change', function () {
        self._setLoading(true);

        if (self._protectionToggle.checked) {
          cartPost('/cart/add.js', { id: self._protectionVariantId, quantity: 1 })
            .then(function () { return self._refreshCart(); })
            .catch(function () {
              self._protectionToggle.checked = false;
              self._setLoading(false);
            });
        } else {
          var key = self._findProtectionKey();
          if (!key) { self._setLoading(false); return; }
          cartPost('/cart/change.js', { id: key, quantity: 0 })
            .then(function () { return self._refreshCart(); })
            .catch(function () {
              self._protectionToggle.checked = true;
              self._setLoading(false);
            });
        }
      });
    },

    _findProtectionKey: function () {
      if (!this._lastCart || !this._protectionVariantId) return null;
      var vid  = String(this._protectionVariantId);
      var item = (this._lastCart.items || []).filter(function (i) {
        return String(i.variant_id) === vid;
      })[0];
      return item ? item.key : null;
    },

    _syncProtectionToggle: function (cart) {
      if (!this._protectionToggle || !this._protectionVariantId) return;
      var vid    = String(this._protectionVariantId);
      var inCart = (cart.items || []).some(function (i) {
        return String(i.variant_id) === vid;
      });
      this._protectionToggle.checked = inCart;
    },

    /* ── REFRESH CART DOM ─────────────────────────────── */

    _refreshCart: function () {
      var self = this;
      return cartGet().then(function (cart) {
        self._lastCart = cart;
        self._updateCounts(cart.item_count, cart.total_price);
        self._updateTotals(cart.total_price);
        self._updateItems(cart);
        self._updateFooter(cart);
        self._updateSavings(cart);
        self._syncProtectionToggle(cart);
        self._setLoading(false);
        return cart;
      });
    },

    _updateSavings: function (cart) {
      var banner = document.querySelector('[data-cart-savings]');
      if (!banner) return;
      var amountEl = banner.querySelector('[data-cart-savings-amount]');

      var savings = (cart.original_total_price || 0) - (cart.total_price || 0);
      (cart.items || []).forEach(function (item) {
        var cmp = item.compare_at_price;
        if (cmp && cmp > item.price) {
          savings += (cmp - item.price) * item.quantity;
        }
      });

      if (savings > 0 && cart.item_count > 0) {
        if (amountEl) amountEl.textContent = formatMoney(savings);
        banner.hidden = false;
      } else {
        banner.hidden = true;
      }
    },

    _updateCounts: function (count, total) {
      /* Icon badge (number only) */
      this.counts.forEach(function (el) {
        el.textContent = count > 0 ? count : '';
      });

      /* Drawer heading "(N items)" */
      this.countLabels.forEach(function (el) {
        if (count > 0) {
          el.textContent = '(' + count + ' item' + (count === 1 ? '' : 's') + ')';
        } else {
          el.textContent = '';
        }
      });

      /* Goals bar */
      this._updateGoals(total || 0);

      document.dispatchEvent(new CustomEvent('cart:updated', {
        detail: { count: count, total: total || 0 }
      }));
    },

    _updateTotals: function (cents) {
      var formatted = formatMoney(cents);
      this.totals.forEach(function (el) {
        el.textContent = formatted;
      });
    },

    _updateItems: function (cart) {
      if (!this.itemsWrap) return;

      var items = cart.items || [];

      if (items.length === 0) {
        this.itemsWrap.innerHTML = emptyStateHtml();
      } else {
        this.itemsWrap.innerHTML = items.map(renderItem).join('');
      }

      /* Lock protection item to qty 1 — hide stepper */
      var vid = this._protectionVariantId ? String(this._protectionVariantId) : null;
      if (vid) {
        var protEl = this.itemsWrap.querySelector('[data-variant-id="' + vid + '"]');
        if (protEl) {
          var stepper = protEl.querySelector('.cart-item__qty');
          if (stepper) stepper.style.display = 'none';
        }
      }

      /* Show/hide goals bar and upsells */
      var goalsBar = document.getElementById('CartGoals');
      if (goalsBar) goalsBar.hidden = cart.item_count === 0;

      var upsells = this.drawer && this.drawer.querySelector('[data-cart-upsells]');
      if (upsells) {
        upsells.hidden = cart.item_count === 0;
        var cartProductIds = (cart.items || []).map(function (i) { return String(i.product_id); });
        upsells.querySelectorAll('[data-upsell-product]').forEach(function (el) {
          el.hidden = cartProductIds.indexOf(el.dataset.upsellProduct) > -1;
        });
      }
    },

    _updateFooter: function (cart) {
      if (!this.footer) return;
      if (cart.item_count === 0) {
        this.footer.classList.add('is-hidden');
      } else {
        this.footer.classList.remove('is-hidden');
        /* Re-cache totals in case a dynamic element was added since init */
        this.totals = document.querySelectorAll('[data-cart-total]');
      }
    },

    /* ── GOALS BAR ────────────────────────────────────── */

    _initGoals: function () {
      var fill1 = document.getElementById('CartGoalsFill1');
      var fill2 = document.getElementById('CartGoalsFill2');
      if (fill1) {
        var pct1 = parseFloat(fill1.dataset.pct) || 0;
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            fill1.style.width = pct1 + '%';
          });
        });
      }
      if (fill2) {
        var pct2 = parseFloat(fill2.dataset.pct) || 0;
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            fill2.style.width = pct2 + '%';
          });
        });
      }
    },

    _updateGoals: function (totalCents) {
      var bar = document.getElementById('CartGoals');
      if (!bar) return;
      var count = parseInt(bar.dataset.milestones, 10) || 0;
      var goal1 = parseInt(bar.dataset.goal1, 10) || 0;
      var goal2 = parseInt(bar.dataset.goal2, 10) || 0;
      if (!count || !goal1) return;

      var fill1 = document.getElementById('CartGoalsFill1');
      var fill2 = document.getElementById('CartGoalsFill2');

      if (count === 1) {
        if (fill1) fill1.style.width = Math.min(100, (totalCents / goal1) * 100) + '%';
      } else {
        if (fill1) fill1.style.width = Math.min(100, (totalCents / goal1) * 100) + '%';
        var gap = goal2 - goal1;
        var rightPct = gap > 0 ? Math.min(100, Math.max(0, ((totalCents - goal1) / gap) * 100)) : 0;
        if (fill2) fill2.style.width = rightPct + '%';
      }

      var nodes = bar.querySelectorAll('.cart-goals__node');
      if (nodes[0]) nodes[0].classList.toggle('is-reached', totalCents >= goal1);
      if (nodes[1]) nodes[1].classList.toggle('is-reached', totalCents >= goal2);

      var labels = bar.querySelectorAll('.cart-goals__label');
      if (labels[0]) labels[0].classList.toggle('is-reached', totalCents >= goal1);
      if (labels[1]) labels[1].classList.toggle('is-reached', totalCents >= goal2);
    },

    /* ── LOADING STATE ────────────────────────────────── */

    _setLoading: function (on) {
      this.drawer.classList.toggle('cart-drawer--loading', on);
    },

  };

  /* ── BOOT ─────────────────────────────────────────────── */

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { MendCart.init(); });
  } else {
    MendCart.init();
  }

  /* External cart:refresh — lets quick view / card ATC trigger a full refresh */
  document.addEventListener('cart:refresh', function (e) {
    if (!window.MendCart) return;
    window.MendCart._refreshCart().then(function () {
      if (e.detail && e.detail.openDrawer) window.MendCart.open();
    });
  });

  window.MendCart = MendCart;

})();
