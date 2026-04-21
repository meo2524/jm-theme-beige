customElements.get('mc-quantity-breaks') || customElements.define('mc-quantity-breaks', class extends HTMLElement {
  #rows = [];
  #quantityInput = null;
  #variantTrigger = null;
  #variantPrices = {};
  #fmt = null;
  #onRowClickBound = null;
  #onVariantChangeBound = null;

  connectedCallback() {
    this.#rows = [...this.querySelectorAll('.mc-qty-break')];
    if (!this.#rows.length) return;

    const priceData = this.querySelector('script[type="application/json"]');
    this.#variantPrices = priceData ? JSON.parse(priceData.textContent) : {};

    this.#fmt = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: window.Shopify?.currency?.active || 'USD',
      minimumFractionDigits: 2,
    });

    const mainForm = document.querySelector('[data-type="add-to-cart-form"]');
    this.#quantityInput = mainForm?.querySelector('input[name="quantity"]');
    this.#variantTrigger = mainForm?.querySelector('select[name="id"]')
      || mainForm?.querySelector('input[name="id"]');

    this.#onRowClickBound = (e) => this.#selectRow(e.currentTarget);
    this.#onVariantChangeBound = this.#onVariantChange.bind(this);

    this.#rows.forEach(row => row.addEventListener('click', this.#onRowClickBound));
    this.#variantTrigger?.addEventListener('change', this.#onVariantChangeBound);

    this.#selectRow(this.#rows[0]);
  }

  disconnectedCallback() {
    this.#rows.forEach(row => row.removeEventListener('click', this.#onRowClickBound));
    this.#variantTrigger?.removeEventListener('change', this.#onVariantChangeBound);
  }

  #selectRow(row) {
    if (!row) return;
    this.#rows.forEach(r => r.classList.remove('is-selected'));
    row.classList.add('is-selected');
    const radio = row.querySelector('.mc-qty-break__radio');
    if (radio) radio.checked = true;
    if (this.#quantityInput) this.#quantityInput.value = parseInt(row.dataset.range, 10) || 1;
  }

  #onVariantChange(e) {
    const price = this.#variantPrices[e.target.value];
    if (price !== undefined) this.#updatePrices(price);
  }

  #updatePrices(basePrice) {
    const money = cents => this.#fmt.format(Math.max(0, cents) / 100);

    this.#rows.forEach(row => {
      const discountAmount = parseFloat(row.dataset.discountAmount || 0);
      let discounted = basePrice;

      if (discountAmount > 0) {
        discounted = row.dataset.discountType === '%'
          ? Math.round(basePrice * (100 - discountAmount) / 100)
          : basePrice - Math.round(discountAmount * 100);
        discounted = Math.max(0, discounted);
      }

      const priceEl = row.querySelector('.mc-qty-break__price');
      const origEl  = row.querySelector('.mc-qty-break__original-price');

      if (priceEl) {
        priceEl.textContent = money(discounted);
        priceEl.dataset.basePrice = basePrice;
      }
      if (origEl) {
        if (discounted < basePrice) {
          origEl.textContent = money(basePrice);
          origEl.hidden = false;
        } else {
          origEl.hidden = true;
        }
      }
    });
  }
});
