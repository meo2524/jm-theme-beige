/* component-shipping-bar.js -- Mend & Co
   Custom element <mc-shipping-bar>.
   - Animates fill to server-rendered pct on first paint (double rAF).
   - Listens to cart:updated events for live updates.
   - Reads e.detail.total (cents) sent by component-cart-drawer.js.
*/

(function () {
  'use strict';

  if (customElements.get('mc-shipping-bar')) return;

  customElements.define('mc-shipping-bar', class extends HTMLElement {

    #goal      = 0;
    #msgBefore = '';
    #msgAfter  = '';
    #msgEl     = null;
    #fillEl    = null;
    #fmt       = null;

    connectedCallback() {
      this.#goal      = parseInt(this.dataset.goal,  10) || 0;
      this.#msgBefore = this.dataset.msgBefore || '';
      this.#msgAfter  = this.dataset.msgAfter  || '';
      this.#msgEl     = this.querySelector('.mc-ship-bar__msg');
      this.#fillEl    = this.querySelector('.mc-ship-bar__fill');

      /* Cache formatter once -- shop locale, no decimals */
      try {
        this.#fmt = new Intl.NumberFormat(
          document.documentElement.lang || 'en',
          { style: 'currency', currency: (window.Shopify && Shopify.currency && Shopify.currency.active) || 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }
        );
      } catch (_) {
        this.#fmt = null;
      }

      /* Animate in: CSS starts at width:0, double rAF to trigger transition */
      if (this.#fillEl && this.#goal > 0) {
        const initialPct = parseFloat(this.#fillEl.dataset.pct) || 0;
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            this.#fillEl.style.width = initialPct + '%';
          }.bind(this));
        }.bind(this));
      }

      this._onCartUpdated = this._onCartUpdated.bind(this);
      document.addEventListener('cart:updated', this._onCartUpdated);
    }

    disconnectedCallback() {
      document.removeEventListener('cart:updated', this._onCartUpdated);
    }

    _onCartUpdated(e) {
      const total = (e.detail && typeof e.detail.total === 'number') ? e.detail.total : -1;
      if (total < 0 || this.#goal <= 0) return;
      this._update(total);
    }

    _update(totalCents) {
      const pct       = Math.min(100, Math.round(totalCents / this.#goal * 100));
      const complete  = totalCents >= this.#goal;

      /* Fill bar */
      if (this.#fillEl) {
        this.#fillEl.style.width = pct + '%';
        this.#fillEl.dataset.pct = pct;
      }

      /* Progress bar aria */
      const track = this.querySelector('.mc-ship-bar__track');
      if (track) track.setAttribute('aria-valuenow', pct);

      /* Message */
      if (this.#msgEl) {
        if (complete) {
          this.#msgEl.textContent = this.#msgAfter;
        } else {
          const remaining    = this.#goal - totalCents;
          const remainingFmt = this._formatMoney(remaining);
          this.#msgEl.textContent = this.#msgBefore.replace('{amount}', remainingFmt);
        }
      }

      /* Complete class drives Playfair italic + pulse */
      this.classList.toggle('mc-ship-bar--complete', complete);

      /* Keep data attrs in sync for potential SSR re-renders */
      this.dataset.total = totalCents;
    }

    _formatMoney(cents) {
      if (this.#fmt) {
        try { return this.#fmt.format(cents / 100); } catch (_) {}
      }
      /* Fallback: plain dollar */
      return '$' + (cents / 100).toFixed(0);
    }

  });

})();
