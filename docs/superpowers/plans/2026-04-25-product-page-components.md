# Product Page Components — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add five new product-page components to the Mend theme, taken from a reference screenshot: dynamic checkout (Shop Pay), trust pill badges, payment & security block, featured review card, and product features strip.

**Architecture:** Each component is a Shopify OS 2.0 block file in `Mend/blocks/`. Blocks appear in `main-product.liquid` via `{% content_for 'blocks' %}` at the bottom of the section — no changes to the section schema required for new blocks. The dynamic checkout button is the only change directly inside `main-product.liquid` (injected into the existing `{% form 'product' %}`). All CSS lives inline in the block file inside a `<style>` tag, scoped to the section id or a unique class, to avoid polluting global scope.

**Tech Stack:** Shopify Liquid 2.0, vanilla CSS (no Tailwind), no external JS dependencies. Shopify `{{ form | payment_button }}` for Shop Pay. Shopify `shop.enabled_payment_types` + `payment_type_svg_tag` for payment icons.

---

## Files

| Action | Path | Responsibility |
|---|---|---|
| Modify | `Mend/sections/main-product.liquid` | Add `{{ form | payment_button }}` + wrapper CSS after ATC button |
| Create | `Mend/blocks/_product-trust-pills.liquid` | Two configurable pill badges above title area |
| Create | `Mend/blocks/_payment-security.liquid` | Payment icons + security copy block |
| Create | `Mend/blocks/_featured-review.liquid` | Dark-card featured review with show-more toggle |
| Create | `Mend/blocks/_product-features-strip.liquid` | 3-column icon + label strip |

---

## Task 1: Dynamic Checkout Button (Buy with Shop Pay)

**Files:**
- Modify: `Mend/sections/main-product.liquid` — inside `{% form 'product' %}`, after the `.btn-atc` button (~line 283)

The `{{ form | payment_button }}` tag renders all enabled dynamic checkout buttons (Shop Pay, PayPal, Google Pay, etc.) plus a "More payment options" link automatically. It must be inside `{% form 'product' %}`.

- [ ] **Step 1: Add the payment button tag inside the product form**

In `main-product.liquid`, find this block (around line 283):
```liquid
        </button>

      {%- endform -%}
```

Replace with:
```liquid
        </button>

        <div class="dynamic-checkout">
          {{ form | payment_button }}
        </div>

      {%- endform -%}
```

- [ ] **Step 2: Add CSS for the dynamic checkout wrapper**

In the `<style>` block of `main-product.liquid`, after `.btn-atc:disabled { ... }` (~line 892), add:

```css
/* Dynamic checkout (Shop Pay / PayPal etc.) */
.dynamic-checkout {
  margin-bottom: 1.375rem;
}

.dynamic-checkout .shopify-payment-button {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dynamic-checkout .shopify-payment-button__button {
  border-radius: 4px !important;
  min-height: 48px !important;
  font-family: var(--font-label) !important;
  font-size: 0.875rem !important;
}

.dynamic-checkout .shopify-payment-button__more-options {
  display: block;
  text-align: center;
  font-family: var(--font-label);
  font-size: 0.8125rem;
  color: var(--color-olive);
  text-decoration: underline;
  text-underline-offset: 2px;
  margin-top: 0.375rem;
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
  padding: 0.25rem 0;
}
```

- [ ] **Step 3: Verify in Shopify theme editor**

Open the product page in the theme editor. Confirm the Shop Pay button (purple) appears below "Add to Cart". If no Shop Pay is enabled on the test store, the block renders empty — that is correct behaviour.

- [ ] **Step 4: Commit**

```bash
git -C /Users/mkeo/Desktop/Claude/JM/Mend add sections/main-product.liquid
git -C /Users/mkeo/Desktop/Claude/JM/Mend commit -m "feat: add dynamic checkout button (Shop Pay) to product form"
```

---

## Task 2: Trust Pill Badges Block

**Files:**
- Create: `Mend/blocks/_product-trust-pills.liquid`

Two pill-shaped badges rendered above or below the product title (merchant positions them by dragging in the editor). Left pill is filled (brand colour), right pill is outline. Both text labels are editable.

- [ ] **Step 1: Create the block file**

Create `Mend/blocks/_product-trust-pills.liquid` with this content:

```liquid
{%- assign pill_1_text  = block.settings.pill_1_text -%}
{%- assign pill_2_text  = block.settings.pill_2_text -%}
{%- assign pill_1_style = block.settings.pill_1_style -%}
{%- assign pill_2_style = block.settings.pill_2_style -%}

{%- if pill_1_text != blank or pill_2_text != blank -%}
  <div class="trust-pills" {{ block.shopify_attributes }}>
    {%- if pill_1_text != blank -%}
      <span class="trust-pill trust-pill--{{ pill_1_style }}">{{ pill_1_text | escape }}</span>
    {%- endif -%}
    {%- if pill_2_text != blank -%}
      <span class="trust-pill trust-pill--{{ pill_2_style }}">{{ pill_2_text | escape }}</span>
    {%- endif -%}
  </div>
{%- endif -%}

<style>
.trust-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.trust-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.875rem;
  border-radius: 999px;
  font-family: var(--font-label);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.3;
  text-align: center;
}

.trust-pill--filled {
  background: var(--color-olive, #4A7B72);
  color: var(--color-bone, #F2EDE4);
  border: 1.5px solid transparent;
}

.trust-pill--outline {
  background: transparent;
  color: var(--color-olive, #4A7B72);
  border: 1.5px solid var(--color-olive, #4A7B72);
}
</style>

{% schema %}
{
  "name": "Trust Pill Badges",
  "tag": null,
  "settings": [
    {
      "type": "text",
      "id": "pill_1_text",
      "label": "Badge 1 text",
      "default": "50,000+ Happy Customers"
    },
    {
      "type": "select",
      "id": "pill_1_style",
      "label": "Badge 1 style",
      "default": "filled",
      "options": [
        { "value": "filled",  "label": "Filled" },
        { "value": "outline", "label": "Outline" }
      ]
    },
    {
      "type": "text",
      "id": "pill_2_text",
      "label": "Badge 2 text",
      "default": "Trusted Since 2020"
    },
    {
      "type": "select",
      "id": "pill_2_style",
      "label": "Badge 2 style",
      "default": "outline",
      "options": [
        { "value": "filled",  "label": "Filled" },
        { "value": "outline", "label": "Outline" }
      ]
    }
  ],
  "presets": [
    { "name": "Trust Pill Badges" }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Verify in theme editor**

Add the block to the product page. Confirm both pills render, filled pill has solid brand background, outline pill has transparent background with border.

- [ ] **Step 3: Commit**

```bash
git -C /Users/mkeo/Desktop/Claude/JM/Mend add blocks/_product-trust-pills.liquid
git -C /Users/mkeo/Desktop/Claude/JM/Mend commit -m "feat: add trust pill badges product block"
```

---

## Task 3: Payment & Security Block

**Files:**
- Create: `Mend/blocks/_payment-security.liquid`

Displays a heading, subheading, a row of payment method icons (pulled from `shop.enabled_payment_types`), and a configurable security copy line.

- [ ] **Step 1: Create the block file**

Create `Mend/blocks/_payment-security.liquid`:

```liquid
<div class="pay-sec" {{ block.shopify_attributes }}>
  {%- if block.settings.heading != blank -%}
    <p class="pay-sec__heading">{{ block.settings.heading | escape }}</p>
  {%- endif -%}

  {%- if block.settings.subheading != blank -%}
    <p class="pay-sec__subheading">{{ block.settings.subheading | escape }}</p>
  {%- endif -%}

  {%- unless shop.enabled_payment_types == empty -%}
    <ul class="pay-sec__icons" role="list" aria-label="Accepted payment methods">
      {%- for type in shop.enabled_payment_types -%}
        <li>{{ type | payment_type_svg_tag: class: 'pay-sec__icon' }}</li>
      {%- endfor -%}
    </ul>
  {%- endunless -%}

  {%- if block.settings.body != blank -%}
    <p class="pay-sec__body">{{ block.settings.body | escape }}</p>
  {%- endif -%}
</div>

<style>
.pay-sec {
  padding: 1.25rem 1.5rem;
  border: 1px solid rgba(43,43,43,0.1);
  border-radius: 6px;
  background: rgba(43,43,43,0.02);
  margin-bottom: 1.375rem;
  text-align: center;
}

.pay-sec__heading {
  font-family: var(--font-label);
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--color-black);
  margin: 0 0 0.25rem;
}

.pay-sec__subheading {
  font-family: var(--font-label);
  font-size: 0.8125rem;
  color: var(--color-olive);
  margin: 0 0 0.875rem;
}

.pay-sec__icons {
  list-style: none;
  padding: 0;
  margin: 0 0 0.875rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.375rem;
}

.pay-sec__icon {
  height: 24px;
  width: auto;
  border-radius: 3px;
  display: block;
}

.pay-sec__body {
  font-family: var(--font-label);
  font-size: 0.75rem;
  color: var(--color-olive);
  line-height: 1.65;
  margin: 0;
  opacity: 0.8;
}
</style>

{% schema %}
{
  "name": "Payment & Security",
  "tag": null,
  "settings": [
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Payment & Security"
    },
    {
      "type": "text",
      "id": "subheading",
      "label": "Subheading",
      "default": "Secure and trusted checkout"
    },
    {
      "type": "textarea",
      "id": "body",
      "label": "Security copy",
      "default": "Your payment information is processed securely. We do not store payment details nor have access to your payment information."
    }
  ],
  "presets": [
    { "name": "Payment & Security" }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Verify in theme editor**

Add the block. Confirm payment icons render from `shop.enabled_payment_types`. If the dev store has no payment methods configured, the icons list is simply absent — heading and body copy still display.

- [ ] **Step 3: Commit**

```bash
git -C /Users/mkeo/Desktop/Claude/JM/Mend add blocks/_payment-security.liquid
git -C /Users/mkeo/Desktop/Claude/JM/Mend commit -m "feat: add payment & security product block"
```

---

## Task 4: Featured Review Card Block

**Files:**
- Create: `Mend/blocks/_featured-review.liquid`

Dark-card featured review: circle avatar (first initial of author name), author name, star rating (1–5 via setting), review text with a "Show more" toggle if over 140 chars, decorative dot indicators (1–4, one highlighted). All content editable in theme editor.

- [ ] **Step 1: Create the block file**

Create `Mend/blocks/_featured-review.liquid`:

```liquid
{%- assign author   = block.settings.author | default: 'A Customer' -%}
{%- assign initial  = author | slice: 0 | upcase -%}
{%- assign stars    = block.settings.stars | default: 5 -%}
{%- assign text     = block.settings.review_text -%}
{%- assign dot_count   = block.settings.dot_count | default: 4 -%}
{%- assign dot_active  = block.settings.dot_active | default: 2 -%}

{%- if text != blank -%}
<div class="feat-review" {{ block.shopify_attributes }}>
  <div class="feat-review__inner">
    <div class="feat-review__top">
      <span class="feat-review__avatar" aria-hidden="true">{{ initial }}</span>
      <div class="feat-review__meta">
        <span class="feat-review__author">{{ author | escape }}</span>
        <span class="feat-review__stars" aria-label="Rated {{ stars }} out of 5">
          {%- for i in (1..5) -%}
            <svg class="feat-review__star{% if i > stars %} feat-review__star--empty{% endif %}" viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <polygon points="8,1.2 10.2,5.8 15.4,6.4 11.5,10.2 12.7,15.4 8,12.7 3.3,15.4 4.5,10.2 0.6,6.4 5.8,5.8"/>
            </svg>
          {%- endfor -%}
        </span>
      </div>
    </div>

    <div class="feat-review__text-wrap">
      <p class="feat-review__text" data-review-text>{{ text | escape }}</p>
    </div>

    {%- if text.size > 140 -%}
      <button class="feat-review__toggle" type="button" data-review-toggle aria-expanded="false">
        Show more
      </button>
    {%- endif -%}

    {%- if dot_count > 1 -%}
      <div class="feat-review__dots" role="list" aria-label="Review navigation indicators">
        {%- for i in (1..dot_count) -%}
          <span
            class="feat-review__dot{% if i == dot_active %} feat-review__dot--active{% endif %}"
            role="listitem"
            aria-hidden="true"
          ></span>
        {%- endfor -%}
      </div>
    {%- endif -%}
  </div>
</div>

<script>
(function () {
  var block = document.querySelector('[data-review-toggle]');
  if (!block) return;
  var textEl   = block.closest('.feat-review__inner').querySelector('[data-review-text]');
  var full     = textEl.textContent;
  var short    = full.slice(0, 140).trimEnd() + '\u2026';
  textEl.textContent = short;

  block.addEventListener('click', function () {
    var expanded = block.getAttribute('aria-expanded') === 'true';
    textEl.textContent = expanded ? short : full;
    block.textContent  = expanded ? 'Show more' : 'Show less';
    block.setAttribute('aria-expanded', String(!expanded));
  });
}());
</script>
{%- endif -%}

<style>
.feat-review {
  margin-bottom: 1.375rem;
}

.feat-review__inner {
  background: var(--color-olive, #4A7B72);
  border-radius: 8px;
  padding: 1.375rem 1.5rem 1.25rem;
  color: var(--color-bone, #F2EDE4);
}

.feat-review__top {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.875rem;
}

.feat-review__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-label);
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--color-bone, #F2EDE4);
  flex-shrink: 0;
}

.feat-review__meta {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.feat-review__author {
  font-family: var(--font-label);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-bone, #F2EDE4);
  line-height: 1.2;
}

.feat-review__stars {
  display: flex;
  gap: 1px;
}

.feat-review__star {
  fill: #F5C842;
}

.feat-review__star--empty {
  fill: rgba(255,255,255,0.25);
}

.feat-review__text {
  font-family: var(--font-label);
  font-size: 0.875rem;
  line-height: 1.7;
  color: rgba(242,237,228,0.9);
  margin: 0 0 0.625rem;
}

.feat-review__toggle {
  background: none;
  border: none;
  padding: 0;
  font-family: var(--font-label);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-bone, #F2EDE4);
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-color: rgba(242,237,228,0.45);
  cursor: pointer;
  display: block;
  margin-bottom: 1rem;
}

.feat-review__dots {
  display: flex;
  justify-content: center;
  gap: 0.375rem;
  margin-top: 0.75rem;
}

.feat-review__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(242,237,228,0.3);
  display: inline-block;
}

.feat-review__dot--active {
  background: var(--color-bone, #F2EDE4);
}
</style>

{% schema %}
{
  "name": "Featured Review Card",
  "tag": null,
  "settings": [
    {
      "type": "text",
      "id": "author",
      "label": "Author name",
      "default": "Sarah M."
    },
    {
      "type": "range",
      "id": "stars",
      "label": "Star rating",
      "min": 1,
      "max": 5,
      "step": 1,
      "default": 5
    },
    {
      "type": "textarea",
      "id": "review_text",
      "label": "Review text",
      "default": "My hair has completely transformed since using this filter. The difference in texture and softness after just two weeks was incredible — I stopped using my leave-in conditioner entirely."
    },
    {
      "type": "header",
      "content": "Dot indicators"
    },
    {
      "type": "range",
      "id": "dot_count",
      "label": "Number of dots",
      "min": 1,
      "max": 6,
      "step": 1,
      "default": 4,
      "info": "Decorative only — shows how many reviews exist in your set."
    },
    {
      "type": "range",
      "id": "dot_active",
      "label": "Active dot position",
      "min": 1,
      "max": 6,
      "step": 1,
      "default": 1
    }
  ],
  "presets": [
    { "name": "Featured Review Card" }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Verify in theme editor**

Add the block. Confirm: avatar shows first initial, stars render correctly, long text is truncated to 140 chars with "Show more" button, clicking "Show more" expands the full text and changes to "Show less".

- [ ] **Step 3: Commit**

```bash
git -C /Users/mkeo/Desktop/Claude/JM/Mend add blocks/_featured-review.liquid
git -C /Users/mkeo/Desktop/Claude/JM/Mend commit -m "feat: add featured review card product block with show-more toggle"
```

---

## Task 5: Product Features Strip Block

**Files:**
- Create: `Mend/blocks/_product-features-strip.liquid`

Three-column icon + label strip. Each column has a `select` setting to pick an SVG icon and a `text` setting for the label. Icons embedded inline via a `case/when` lookup.

- [ ] **Step 1: Create the block file**

Create `Mend/blocks/_product-features-strip.liquid`:

```liquid
{%- liquid
  assign cols = '1,2,3' | split: ','
-%}

<div class="feat-strip" {{ block.shopify_attributes }}>
  {%- for col in cols -%}
    {%- assign icon_key  = 'icon_'  | append: col -%}
    {%- assign label_key = 'label_' | append: col -%}
    {%- assign icon  = block.settings[icon_key] -%}
    {%- assign label = block.settings[label_key] -%}
    {%- if label != blank -%}
      <div class="feat-strip__col">
        <span class="feat-strip__icon" aria-hidden="true">
          {%- case icon -%}
            {%- when 'leaf' -%}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22c6-6 10-14 16-18-4 8-8 14-14 18z"/><path d="M10 14c1-5 5-8 10-9"/></svg>
            {%- when 'droplet' -%}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
            {%- when 'shield' -%}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l7 3v6c0 5-3.5 9.5-7 11-3.5-1.5-7-6-7-11V5z"/></svg>
            {%- when 'star' -%}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            {%- when 'clock' -%}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {%- when 'recycle' -%}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1.5 8.5 1.5 3.5 6.5 3.5"/><path d="M1.5 3.5 7 9a10 10 0 0 1 13 1"/><polyline points="22.5 15.5 22.5 20.5 17.5 20.5"/><path d="M22.5 20.5 17 15a10 10 0 0 1-13-1"/></svg>
            {%- when 'heart' -%}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            {%- when 'award' -%}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
            {%- else -%}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {%- endcase -%}
        </span>
        <span class="feat-strip__label">{{ label | escape }}</span>
      </div>
    {%- endif -%}
  {%- endfor -%}
</div>

<style>
.feat-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  padding: 1.25rem 0;
  border-top: 1px solid rgba(43,43,43,0.09);
  margin-bottom: 1.375rem;
}

.feat-strip__col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
}

.feat-strip__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--color-walnut, #8A6240);
}

.feat-strip__icon svg {
  width: 24px;
  height: 24px;
}

.feat-strip__label {
  font-family: var(--font-label);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-black);
  line-height: 1.3;
}

@media (max-width: 480px) {
  .feat-strip {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }

  .feat-strip__label {
    font-size: 0.625rem;
    letter-spacing: 0.02em;
  }
}
</style>

{% schema %}
{
  "name": "Product Features Strip",
  "tag": null,
  "settings": [
    {
      "type": "header",
      "content": "Column 1"
    },
    {
      "type": "select",
      "id": "icon_1",
      "label": "Icon",
      "default": "leaf",
      "options": [
        { "value": "leaf",    "label": "Leaf" },
        { "value": "droplet", "label": "Droplet" },
        { "value": "shield",  "label": "Shield" },
        { "value": "star",    "label": "Star" },
        { "value": "clock",   "label": "Clock" },
        { "value": "recycle", "label": "Recycle" },
        { "value": "heart",   "label": "Heart" },
        { "value": "award",   "label": "Award" }
      ]
    },
    {
      "type": "text",
      "id": "label_1",
      "label": "Label",
      "default": "Artisanal Quality"
    },
    {
      "type": "header",
      "content": "Column 2"
    },
    {
      "type": "select",
      "id": "icon_2",
      "label": "Icon",
      "default": "droplet",
      "options": [
        { "value": "leaf",    "label": "Leaf" },
        { "value": "droplet", "label": "Droplet" },
        { "value": "shield",  "label": "Shield" },
        { "value": "star",    "label": "Star" },
        { "value": "clock",   "label": "Clock" },
        { "value": "recycle", "label": "Recycle" },
        { "value": "heart",   "label": "Heart" },
        { "value": "award",   "label": "Award" }
      ]
    },
    {
      "type": "text",
      "id": "label_2",
      "label": "Label",
      "default": "Spa-Inspired Comfort"
    },
    {
      "type": "header",
      "content": "Column 3"
    },
    {
      "type": "select",
      "id": "icon_3",
      "label": "Icon",
      "default": "shield",
      "options": [
        { "value": "leaf",    "label": "Leaf" },
        { "value": "droplet", "label": "Droplet" },
        { "value": "shield",  "label": "Shield" },
        { "value": "star",    "label": "Star" },
        { "value": "clock",   "label": "Clock" },
        { "value": "recycle", "label": "Recycle" },
        { "value": "heart",   "label": "Heart" },
        { "value": "award",   "label": "Award" }
      ]
    },
    {
      "type": "text",
      "id": "label_3",
      "label": "Label",
      "default": "Lifetime Quality"
    }
  ],
  "presets": [
    { "name": "Product Features Strip" }
  ]
}
{% endschema %}
```

- [ ] **Step 2: Verify in theme editor**

Add the block. Confirm three columns render with correct icons and labels. Change icon selects and confirm SVGs swap correctly.

- [ ] **Step 3: Commit**

```bash
git -C /Users/mkeo/Desktop/Claude/JM/Mend add blocks/_product-features-strip.liquid
git -C /Users/mkeo/Desktop/Claude/JM/Mend commit -m "feat: add product features strip block"
```

---

## Task 6: Final push

- [ ] **Push all commits**

```bash
git -C /Users/mkeo/Desktop/Claude/JM/Mend push
```

---

## Self-Review

**Spec coverage:**
- ✅ Dynamic checkout / Shop Pay button → Task 1
- ✅ Trust pill badges → Task 2
- ✅ Payment & Security block → Task 3
- ✅ Featured review card with show-more → Task 4
- ✅ Product features strip → Task 5
- ✅ "More payment options" link → rendered automatically by `{{ form | payment_button }}` in Task 1

**Placeholder scan:** No TBDs, no "implement later", all code blocks contain complete working code.

**Type consistency:** No shared types across tasks — each task is self-contained Liquid + CSS.
