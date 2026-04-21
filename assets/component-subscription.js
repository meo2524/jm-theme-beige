customElements.get('mc-subscription-widget') || customElements.define('mc-subscription-widget', class extends HTMLElement {
  #sectionId   = '';
  #preselected = 'one_time';
  #variantId   = null;

  #onBoxClickBound    = null;
  #onChangeBound      = null;
  #onVariantChangeBound = null;

  connectedCallback() {
    this.#sectionId   = this.dataset.sectionId || '';
    this.#preselected = this.dataset.preselected || 'one_time';

    this.#onBoxClickBound     = this.#onBoxClick.bind(this);
    this.#onChangeBound       = this.#onFrequencyChange.bind(this);
    this.#onVariantChangeBound = this.#onVariantChange.bind(this);

    this.addEventListener('click', this.#onBoxClickBound);
    this.addEventListener('change', this.#onChangeBound);

    const mainForm = document.querySelector('[data-type="add-to-cart-form"]');
    if (mainForm) {
      const trigger = mainForm.querySelector('select[name="id"]') || mainForm.querySelector('input[name="id"]');
      trigger?.addEventListener('change', this.#onVariantChangeBound);
    }

    this.#initVariant();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#onBoxClickBound);
    this.removeEventListener('change', this.#onChangeBound);

    const mainForm = document.querySelector('[data-type="add-to-cart-form"]');
    if (mainForm) {
      const trigger = mainForm.querySelector('select[name="id"]') || mainForm.querySelector('input[name="id"]');
      trigger?.removeEventListener('change', this.#onVariantChangeBound);
    }
  }

  #initVariant() {
    const currentSection = this.querySelector('.mc-subscription-variant:not(.mc-subscription-variant--hidden)');
    if (!currentSection) return;

    this.#variantId = currentSection.dataset.variantId;

    const preselectedBox = this.#preselected === 'subscription'
      ? currentSection.querySelector('.mc-subscription__box--subscription')
      : currentSection.querySelector('.mc-subscription__box--one-time');

    this.#selectBox(preselectedBox || currentSection.querySelector('.mc-subscription__box'), currentSection);
  }

  #onVariantChange(e) {
    const newVariantId = String(e.target.value);
    if (newVariantId === this.#variantId) return;
    this.#variantId = newVariantId;

    this.querySelectorAll('.mc-subscription-variant').forEach(section => {
      section.classList.toggle('mc-subscription-variant--hidden', section.dataset.variantId !== newVariantId);
    });

    this.#initVariant();
  }

  #onBoxClick(e) {
    const box = e.target.closest('.mc-subscription__box');
    if (!box) return;
    const section = box.closest('.mc-subscription-variant');
    if (!section) return;
    this.#selectBox(box, section);
  }

  #onFrequencyChange(e) {
    const select = e.target.closest('.mc-subscription__frequency-select');
    const radio  = e.target.closest('input[data-radio-type="selling_plan"]');
    if (!select && !radio) return;

    const box = (select || radio).closest('.mc-subscription__box--subscription');
    if (!box) return;

    const option = select ? select.options[select.selectedIndex] : radio;
    if (option) this.#applySellingPlan(option.dataset.sellingPlanId, box, option);
  }

  #selectBox(box, section) {
    if (!box) return;

    section.querySelectorAll('.mc-subscription__box').forEach(b => {
      b.classList.remove('mc-subscription__box--selected');
      b.querySelector('.mc-subscription__indicator')?.classList.remove('is-checked');
    });

    box.classList.add('mc-subscription__box--selected');
    box.querySelector('.mc-subscription__indicator')?.classList.add('is-checked');

    if (box.dataset.boxType === 'one_time_purchase') {
      this.#clearSellingPlan();
      this.#updateMainPrice(box, null);
    } else if (box.dataset.boxType === 'selling_plan') {
      const activeOption = this.#getActiveOption(box);
      if (activeOption) this.#applySellingPlan(activeOption.dataset.sellingPlanId, box, activeOption);
    }
  }

  #getActiveOption(box) {
    const select = box.querySelector('.mc-subscription__frequency-select');
    if (select) return select.options[select.selectedIndex] || null;
    return box.querySelector('input[data-radio-type="selling_plan"]:checked')
      || box.querySelector('input[data-radio-type="selling_plan"]');
  }

  #applySellingPlan(planId, box, option) {
    this.#setSellingPlanInput(planId);
    this.#syncGroupPriceDisplay(box, option);
    this.#updateMainPrice(box, option);
  }

  #clearSellingPlan() {
    this.#setSellingPlanInput('');
    this.#restoreMainPrice();
  }

  #setSellingPlanInput(planId) {
    const input = document.querySelector('input.mc-selected-selling-plan-id');
    if (input) input.value = planId || '';

    const mainForm = document.querySelector('[data-type="add-to-cart-form"]');
    if (!mainForm) return;

    let hidden = mainForm.querySelector('input[name="selling_plan"]');
    if (!hidden) {
      hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'selling_plan';
      mainForm.appendChild(hidden);
    }
    hidden.value = planId || '';
  }

  #syncGroupPriceDisplay(box, option) {
    const groupId = box.dataset.groupId;
    if (!groupId) return;

    const rawPrice   = option?.dataset.variantPrice;
    const rawCompare = option?.dataset.variantCompareAtPrice;

    const priceEl   = this.querySelector(`[data-group-price="${groupId}"]`);
    const compareEl = this.querySelector(`[data-group-compare-price="${groupId}"]`);

    if (priceEl && rawPrice)     priceEl.textContent   = rawPrice;
    if (compareEl && rawCompare) compareEl.textContent = rawCompare;
  }

  #updateMainPrice(box, option) {
    const price   = option?.dataset.variantRawPrice
      ?? box.querySelector('input[data-variant-price]')?.dataset.variantPrice;
    const compare = option?.dataset.variantRawCompare
      ?? box.querySelector('input[data-variant-compare-at-price]')?.dataset.variantCompareAtPrice;

    const priceNow = document.querySelector('.price-now, #PriceNow-' + this.#sectionId);
    const priceWas = document.querySelector('.price-was, #PriceWas-' + this.#sectionId);

    if (priceNow && price)   priceNow.textContent = price;
    if (priceWas && compare) priceWas.textContent = compare;
  }

  #restoreMainPrice() {
    const variantSection = this.querySelector(`.mc-subscription-variant[data-variant-id="${this.#variantId}"]`);
    const oneTimeInput   = variantSection?.querySelector('input[data-radio-type="one_time_purchase"]');
    if (!oneTimeInput) return;

    const priceNow = document.querySelector('.price-now, #PriceNow-' + this.#sectionId);
    const priceWas = document.querySelector('.price-was, #PriceWas-' + this.#sectionId);

    if (priceNow) priceNow.textContent = oneTimeInput.dataset.variantPrice       || '';
    if (priceWas) priceWas.textContent = oneTimeInput.dataset.variantCompareAtPrice || '';
  }
});
