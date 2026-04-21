customElements.get('mc-back-in-stock') || customElements.define('mc-back-in-stock', class extends HTMLElement {
  #variantData = {};
  #bodyInput = null;
  #headingEl = null;
  #messageTemplate = '';
  #variantTrigger = null;
  #onVariantChangeBound = null;

  connectedCallback() {
    const dataEl = this.querySelector('script[type="application/json"]');
    this.#variantData = dataEl ? JSON.parse(dataEl.textContent) : {};
    this.#bodyInput = this.querySelector('.mc-bis__body');
    this.#headingEl = this.querySelector('.mc-bis__heading');
    this.#messageTemplate = this.dataset.messageTemplate || '';

    const mainForm = document.querySelector('[data-type="add-to-cart-form"]');
    this.#variantTrigger = mainForm?.querySelector('select[name="id"]')
      || mainForm?.querySelector('input[name="id"]');

    this.#onVariantChangeBound = this.#onVariantChange.bind(this);
    this.#variantTrigger?.addEventListener('change', this.#onVariantChangeBound);
  }

  disconnectedCallback() {
    this.#variantTrigger?.removeEventListener('change', this.#onVariantChangeBound);
  }

  #onVariantChange(e) {
    const info = this.#variantData[e.target.value];
    if (!info) return;

    if (info.available) {
      this.classList.add('mc-back-in-stock--hidden');
    } else {
      this.classList.remove('mc-back-in-stock--hidden');
      const msg = this.#messageTemplate.replace('{product_title}', info.name);
      if (this.#bodyInput) this.#bodyInput.value = msg;
      if (this.#headingEl) this.#headingEl.textContent = msg;
    }
  }
});
