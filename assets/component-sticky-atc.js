customElements.get('mc-sticky-atc') || customElements.define('mc-sticky-atc', class extends HTMLElement {
  #observer = null;
  #mainSelect = null;
  #mainInput  = null;
  #stickySelect = null;
  #stickyInput  = null;

  #onMainChangeBound = null;
  #onStickyChangeBound = null;

  connectedCallback() {
    this.bar     = this.querySelector('.sticky-atc__bar');
    this.form    = this.querySelector('form');
    this.btnText = this.querySelector('.sticky-atc__btn-text');

    this.#stickySelect = this.querySelector('select[name="id"]');
    this.#stickyInput  = this.querySelector('input[name="id"]');

    const mainForm = document.querySelector('[data-type="add-to-cart-form"]');
    if (!mainForm) return;

    this.#mainSelect = mainForm.querySelector('select[name="id"]');
    this.#mainInput  = mainForm.querySelector('input[name="id"]');

    const trigger = mainForm.querySelector('[type="submit"]') || mainForm;

    this.#observer = new IntersectionObserver((entries) => {
      this.classList.toggle('is-visible', !entries[0].isIntersecting);
    }, { threshold: 0 });

    this.#observer.observe(trigger);

    this.#onMainChangeBound   = this.#onMainChange.bind(this);
    this.#onStickyChangeBound = this.#onStickyChange.bind(this);

    this.#mainSelect?.addEventListener('change', this.#onMainChangeBound);
    this.#stickySelect?.addEventListener('change', this.#onStickyChangeBound);

    this.form?.addEventListener('submit', this.#onSubmit.bind(this));
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
    this.#observer = null;
    this.#mainSelect?.removeEventListener('change', this.#onMainChangeBound);
    this.#stickySelect?.removeEventListener('change', this.#onStickyChangeBound);
  }

  #onMainChange() {
    const val = this.#mainSelect.value;
    if (this.#stickySelect) this.#stickySelect.value = val;
    if (this.#stickyInput)  this.#stickyInput.value  = val;
  }

  #onStickyChange() {
    const val = this.#stickySelect.value;
    if (this.#mainSelect) {
      this.#mainSelect.value = val;
      this.#mainSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (this.#mainInput) this.#mainInput.value = val;
  }

  #onSubmit(e) {
    e.preventDefault();
    const btn = this.form.querySelector('[type="submit"]');
    const originalText = this.btnText?.textContent || 'Add to Cart';

    btn.dataset.state = 'adding';
    if (this.btnText) this.btnText.textContent = 'Adding...';

    fetch('/cart/add.js', { method: 'POST', body: new FormData(this.form) })
      .then(r => {
        if (!r.ok) throw new Error('cart add failed');
        return r.json();
      })
      .then(() => {
        if (this.btnText) this.btnText.textContent = 'Added!';
        document.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true }));
        setTimeout(() => {
          if (this.btnText) this.btnText.textContent = originalText;
          delete btn.dataset.state;
        }, 1800);
      })
      .catch(() => {
        if (this.btnText) this.btnText.textContent = originalText;
        delete btn.dataset.state;
      });
  }
});
