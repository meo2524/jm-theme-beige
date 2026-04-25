# Design Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a motion layer and targeted visual hierarchy fixes across the Mend & Co Shopify theme — premium entrances on product/browse pages, energetic urgency in the cart.

**Architecture:** Pure CSS keyframes + vanilla JS `IntersectionObserver`. No build tools. All animations respect `prefers-reduced-motion`. Mobile degrades to opacity-only transitions. Changes are additive — existing layout and colour palette unchanged except two accents: sale red `#C0392B` and walnut glow reuse.

**Tech Stack:** Liquid, vanilla JS, CSS custom properties. Files edited directly and pushed to GitHub.

---

### Task 1: Global keyframes + `[data-reveal]` system

**Files:**
- Modify: `assets/base.css` (append after line 761)
- Modify: `layout/theme.liquid` (append script before `</body>`)

- [ ] **Step 1: Add keyframes and reveal CSS to `assets/base.css`**

Append this entire block at the very end of `assets/base.css`:

```css
/* ============================================================
   15. ANIMATION KEYFRAMES
   ============================================================ */

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes breathe {
  0%, 100% { box-shadow: 0 2px 8px rgba(138, 98, 64, 0); }
  50%       { box-shadow: 0 4px 20px rgba(138, 98, 64, 0.22); }
}

@keyframes breathe-opacity {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.82; }
}

@keyframes badge-pulse {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.06); }
}

@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

@keyframes ring-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(138, 98, 64, 0.55); }
  100% { box-shadow: 0 0 0 14px rgba(138, 98, 64, 0); }
}

@keyframes savings-reveal {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes amount-pop {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.14); }
  100% { transform: scale(1); }
}

/* ============================================================
   16. REVEAL SYSTEM  [data-reveal]
   ============================================================ */

[data-reveal] {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

[data-reveal].is-visible {
  opacity: 1;
  transform: none;
}

/* Mobile: opacity only — no transform jank on low-end devices */
@media (max-width: 480px) {
  [data-reveal] {
    transform: none;
  }
}

/* Extend reduced-motion to cover all new keyframes */
@media (prefers-reduced-motion: reduce) {
  [data-reveal],
  [data-reveal].is-visible {
    opacity: 1;
    transform: none;
    transition: none;
  }

  .cart-drawer__savings,
  .cart-drawer__checkout,
  .btn-atc,
  .card__badge,
  .cart-goals__fill::after,
  .cart-goals__node {
    animation: none !important;
  }
}
```

- [ ] **Step 2: Add reveal observer script to `layout/theme.liquid`**

Add this block immediately before `</body>` in `layout/theme.liquid`:

```html
  <!-- Reveal observer -->
  <script>
  (function () {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var els = document.querySelectorAll('[data-reveal]');
    if (!els.length) return;
    if (reduced) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    els.forEach(function (el) {
      var d = el.dataset.revealDelay;
      if (d) el.style.transitionDelay = d + 'ms';
    });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { observer.observe(el); });
  })();
  </script>
```

- [ ] **Step 3: Commit**

```bash
cd /Users/mkeo/Desktop/Claude/JM/Mend
git add assets/base.css layout/theme.liquid
git commit -m "feat: add animation keyframes and data-reveal scroll system"
```

---

### Task 2: Nav underline micro-interaction

**Files:**
- Modify: `sections/header.liquid` (lines 299–317 — nav link styles)
- Modify: `sections/footer.liquid` (around line 211 — footer nav link styles)

- [ ] **Step 1: Replace header nav link hover in `sections/header.liquid`**

Find and replace the existing `.header__nav-link` block (lines 299–317):

```css
  .header__nav-link {
    font-family: var(--font-label);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    letter-spacing: var(--letter-spacing-label);
    text-transform: uppercase;
    color: rgba(242, 237, 228, 0.75);
    padding-block: var(--space-2);
    position: relative;
    transition: color var(--transition-fast);
  }

  .header__nav-link::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100%;
    height: 1.5px;
    background: var(--color-taupe, #D9C5B2);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.2s ease;
  }

  .header__nav-link:hover,
  .header__nav-link.is-active {
    color: var(--color-bone, #F2EDE4);
  }

  .header__nav-link:hover::after,
  .header__nav-link.is-active::after {
    transform: scaleX(1);
  }
```

- [ ] **Step 2: Replace footer nav link hover in `sections/footer.liquid`**

Find `.footer__nav-link` and `.footer__nav-link:hover` (around lines 211–219) and replace with:

```css
.footer__nav-link {
  font-family: var(--font-label);
  font-size: 0.8125rem;
  color: rgba(242, 237, 228, 0.6);
  position: relative;
  transition: color var(--transition-fast);
}

.footer__nav-link::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 1px;
  background: var(--color-walnut, #8A6240);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.2s ease;
}

.footer__nav-link:hover {
  color: var(--color-bone, #F2EDE4);
}

.footer__nav-link:hover::after {
  transform: scaleX(1);
}

.footer__nav-link:focus-visible {
  outline: 2px solid var(--color-walnut, #8A6240);
  outline-offset: 2px;
  border-radius: 1px;
}
```

- [ ] **Step 3: Commit**

```bash
git add sections/header.liquid sections/footer.liquid
git commit -m "feat: add scaleX underline micro-interaction to nav and footer links"
```

---

### Task 3: Cart drawer — savings banner

**Files:**
- Modify: `assets/component-cart-drawer.css` (lines 125–148)
- Modify: `assets/component-cart-drawer.js` (`_updateSavings` method, around line 428)

- [ ] **Step 1: Update savings banner CSS in `assets/component-cart-drawer.css`**

Replace the existing `.cart-drawer__savings` block (lines 125–148):

```css
.cart-drawer__savings {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, rgba(138, 98, 64, 0.1) 0%, rgba(138, 98, 64, 0.04) 100%);
  border-left: 3px solid var(--color-walnut, #8A6240);
  color: var(--color-walnut, #8A6240);
  font-family: var(--font-label);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(138, 98, 64, 0.16);
  animation: savings-reveal 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
  overflow: hidden;
}

.cart-drawer__savings[hidden] {
  display: none;
}

.cart-drawer__savings strong,
[data-cart-savings-amount] {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-walnut, #8A6240);
  display: inline-block;
  transition: transform 0.2s ease;
}

[data-cart-savings-amount].is-popping {
  animation: amount-pop 0.22s ease both;
}
```

- [ ] **Step 2: Add pop animation trigger to `_updateSavings` in `assets/component-cart-drawer.js`**

Find the `_updateSavings` method. Inside the `if (savings > 0 && cart.item_count > 0)` branch, after `amountEl.textContent = formatMoney(savings)`, add the pop class:

```js
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
    if (amountEl) {
      amountEl.textContent = formatMoney(savings);
      amountEl.classList.remove('is-popping');
      /* Force reflow so re-adding the class re-triggers the animation */
      void amountEl.offsetWidth;
      amountEl.classList.add('is-popping');
    }
    banner.hidden = false;
  } else {
    banner.hidden = true;
  }
},
```

- [ ] **Step 3: Commit**

```bash
git add assets/component-cart-drawer.css assets/component-cart-drawer.js
git commit -m "feat: animated savings banner with amount pop on update"
```

---

### Task 4: Cart drawer — goals bar milestone celebration

**Files:**
- Modify: `assets/component-cart-drawer.css` (goals section, lines 151–250 approx)
- Modify: `assets/component-cart-drawer.js` (`_updateGoals` method)

- [ ] **Step 1: Add shimmer and ring-pulse to goals CSS in `assets/component-cart-drawer.css`**

Replace the existing `.cart-goals__fill` block (lines 179–188) with:

```css
.cart-goals__fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0%;
  background: var(--color-walnut, #8A6240);
  border-radius: 2px;
  transition: width 0.65s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.cart-goals__fill::after {
  content: '';
  position: absolute;
  inset: 0;
  width: 40%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 1.2s ease 0.4s both;
}
```

Replace the existing `.cart-goals__node.is-reached` block (lines 203–206) with:

```css
.cart-goals__node.is-reached {
  background: var(--color-walnut, #8A6240);
  color: var(--color-bone, #F2EDE4);
}

.cart-goals__node.just-reached {
  animation: ring-pulse 0.6s ease forwards;
}
```

Add after the `.cart-goals__label` block (find `.cart-goals__label-name`):

```css
.cart-goals__label.is-reached .cart-goals__label-name {
  color: var(--color-walnut, #8A6240);
  transition: color 0.3s ease;
}

.cart-goals__label.is-reached .cart-goals__label-sub {
  color: var(--color-walnut, #8A6240);
  font-weight: 600;
}
```

- [ ] **Step 2: Update `_updateGoals` in `assets/component-cart-drawer.js` to fire milestone celebration**

Find the `_updateGoals` method and replace it entirely:

```js
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

  var nodes  = bar.querySelectorAll('.cart-goals__node');
  var labels = bar.querySelectorAll('.cart-goals__label');
  var subs   = bar.querySelectorAll('.cart-goals__label-sub');

  function celebrateNode(node, sub, reached, prevReached) {
    if (reached && !prevReached) {
      node.classList.add('just-reached');
      node.addEventListener('animationend', function () {
        node.classList.remove('just-reached');
      }, { once: true });
      if (sub) sub.textContent = 'Unlocked! \uD83C\uDF89';
    } else if (!reached && sub) {
      /* restore original text from data attribute if present */
      var original = sub.dataset.original;
      if (original) sub.textContent = original;
    }
  }

  var was1 = nodes[0] && nodes[0].classList.contains('is-reached');
  var was2 = nodes[1] && nodes[1].classList.contains('is-reached');

  if (nodes[0]) nodes[0].classList.toggle('is-reached', totalCents >= goal1);
  if (nodes[1]) nodes[1].classList.toggle('is-reached', totalCents >= goal2);
  if (labels[0]) labels[0].classList.toggle('is-reached', totalCents >= goal1);
  if (labels[1]) labels[1].classList.toggle('is-reached', totalCents >= goal2);

  celebrateNode(nodes[0], subs[0], totalCents >= goal1, was1);
  if (count === 2) celebrateNode(nodes[1], subs[1], totalCents >= goal2, was2);
},
```

- [ ] **Step 3: Store original sub-text in data attribute on page load**

In `_initGoals`, after the fill width animation, add:

```js
/* Store original label sub text so celebration can restore it */
bar && bar.querySelectorAll('.cart-goals__label-sub').forEach(function (el) {
  el.dataset.original = el.textContent;
});
```

The full `_initGoals` becomes:

```js
_initGoals: function () {
  var bar = document.getElementById('CartGoals');

  /* Store original label sub text so milestone celebration can restore it */
  if (bar) {
    bar.querySelectorAll('.cart-goals__label-sub').forEach(function (el) {
      el.dataset.original = el.textContent;
    });
  }

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
```

- [ ] **Step 4: Commit**

```bash
git add assets/component-cart-drawer.css assets/component-cart-drawer.js
git commit -m "feat: goals bar shimmer and milestone ring-pulse celebration"
```

---

### Task 5: Cart drawer — checkout area polish

**Files:**
- Modify: `assets/component-cart-drawer.css` (discount and checkout sections, lines 715–825)

- [ ] **Step 1: Update discount input focus glow**

Find `.cart-drawer__discount-input:focus` (around line 740) and replace:

```css
.cart-drawer__discount-input:focus {
  border-color: var(--color-walnut, #8A6240);
  box-shadow: 0 0 0 3px rgba(138, 98, 64, 0.18);
  outline: none;
}
```

- [ ] **Step 2: Update Apply button hover to fill walnut**

Find `.cart-drawer__discount-btn:hover` (around line 766) and replace:

```css
.cart-drawer__discount-btn:hover {
  background: var(--color-walnut, #8A6240);
  color: #fff;
  border-color: var(--color-walnut, #8A6240);
}
```

- [ ] **Step 3: Add breathe pulse to checkout button**

Find `.cart-drawer__checkout` (around line 795) and add `animation` and `position: relative; overflow: hidden;` to the existing rule, and add the ripple and mobile overrides:

```css
.cart-drawer__checkout {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 52px;
  background: var(--color-black, #2D2D2D);
  color: var(--color-bone, #F2EDE4);
  border-radius: 4px;
  font-family: var(--font-label);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  text-decoration: none;
  gap: 0.4rem;
  position: relative;
  overflow: hidden;
  transition: background 0.18s ease;
  animation: breathe 2.4s ease-in-out infinite;
}

/* Ripple on click */
.cart-drawer__checkout::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.12);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.cart-drawer__checkout:active::after {
  opacity: 1;
  transition: none;
}

/* Mobile: opacity-only breathe (no box-shadow GPU cost) */
@media (max-width: 767px) {
  .cart-drawer__checkout {
    animation: breathe-opacity 2.4s ease-in-out infinite;
  }
}
```

- [ ] **Step 4: Add walnut breathe to payment badges on hover**

After the existing `.payment-badge` rules, add:

```css
.payment-badge {
  opacity: 0.55;
  transition: opacity 0.15s ease;
}

.payment-badge:hover {
  opacity: 1;
}
```

- [ ] **Step 5: Commit**

```bash
git add assets/component-cart-drawer.css
git commit -m "feat: cart checkout breathe pulse, discount focus glow, badge hover"
```

---

### Task 6: Product cards — sale badge, price block, hover lift

**Files:**
- Modify: `snippets/product-card.liquid`

- [ ] **Step 1: Add sale percentage pill to card Liquid**

In `snippets/product-card.liquid`, find the `<div class="card__pricing">` block and replace it:

```liquid
    <div class="card__pricing">
      {%- if on_sale -%}
        <span class="price price--sale">{{ card_price | money }}</span>
        <span class="price price--compare">{{ compare | money }}</span>
      {%- else -%}
        <span class="price">{{ card_price | money }}</span>
      {%- endif -%}
      {%- if on_sale -%}
        {%- assign save_pct = compare | minus: card_price | times: 100 | divided_by: compare -%}
        <span class="card__save-pill">-{{ save_pct }}%</span>
      {%- endif -%}
    </div>
```

- [ ] **Step 2: Update card CSS styles**

In the `<style>` block of `snippets/product-card.liquid`, replace the `.badge--amber` sale badge rule (the `{%- if on_sale -%}` renders `badge badge--amber`) — add this after `.card__badge`:

```css
  /* Sale badge — red for immediate recognition */
  .card__badge.badge--amber {
    background: #C0392B;
    color: #fff;
    animation: badge-pulse 2s ease-in-out infinite;
  }

  @media (max-width: 767px) {
    .card__badge.badge--amber {
      animation: none;
    }
  }
```

Replace the existing `.card__pricing` block with:

```css
  .card__pricing {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: 2px;
    flex-wrap: wrap;
  }

  .price--sale {
    color: var(--color-walnut, #8A6240);
    font-weight: 600;
  }

  .price--compare {
    text-decoration: line-through;
    opacity: 0.45;
    font-size: 0.85em;
  }

  .card__save-pill {
    font-size: 0.6875rem;
    font-weight: 600;
    background: rgba(192, 57, 43, 0.1);
    color: #C0392B;
    border-radius: 2px;
    padding: 2px 6px;
    letter-spacing: 0.02em;
  }
```

- [ ] **Step 3: Add card lift on hover and increase image zoom**

Find `.card__media img` transition (currently `scale(1.04)`) — change to `scale(1.06)`:

```css
  .card:hover .card__media img,
  .card:focus-within .card__media img {
    transform: scale(1.06);
  }
```

Add card lift after `.card__media-wrap` styles:

```css
  .card {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    cursor: pointer;
    transition: box-shadow 0.3s ease;
    border-radius: var(--radius-base);
  }

  .card:hover {
    box-shadow: 0 8px 32px rgba(43, 43, 43, 0.14);
  }

  /* Touch devices — lift on active instead of hover */
  @media (hover: none) {
    .card:active {
      box-shadow: 0 4px 16px rgba(43, 43, 43, 0.1);
    }
  }
```

- [ ] **Step 4: ATC overlay walnut on sale items**

Find the `{%- if single_variant and product.available -%}` block that renders `card__atc-overlay`. Add a conditional class:

```liquid
    {%- if single_variant and product.available -%}
      <button
        class="card__atc-overlay{% if on_sale %} card__atc-overlay--sale{% endif %}"
        type="button"
        data-card-atc="{{ product.variants.first.id }}"
        aria-label="Add {{ product.title | escape }} to cart"
      >
```

Add CSS:

```css
  .card__atc-overlay--sale {
    background: var(--color-walnut, #8A6240);
    color: var(--color-bone, #F2EDE4);
  }

  .card__atc-overlay--sale:hover {
    background: var(--color-walnut-hover, #6B4F32);
  }
```

- [ ] **Step 5: Add card grid entrance via IntersectionObserver**

In the `<script>` block of `snippets/product-card.liquid`, add after the existing ATC script:

```js
  (function () {
    if (window.__mcCardRevealInit) return;
    window.__mcCardRevealInit = true;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var isMobile = window.innerWidth <= 767;
    var cards = document.querySelectorAll('.card');
    if (!cards.length || reduced) return;
    cards.forEach(function (card, i) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(16px)';
      card.style.transition = 'opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)';
      var maxStagger = isMobile ? 1 : 4;
      var delay = Math.min(i, maxStagger) * 60;
      card.style.transitionDelay = delay + 'ms';
    });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'none';
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    cards.forEach(function (card) { observer.observe(card); });
  })();
```

- [ ] **Step 6: Commit**

```bash
git add snippets/product-card.liquid
git commit -m "feat: red sale badge, save pill, card hover lift, grid entrance animation"
```

---

### Task 7: Product page — price block + trust strip

**Files:**
- Modify: `sections/main-product.liquid`

- [ ] **Step 1: Add `price-now--on-sale` class conditionally in Liquid**

Find the price block in `sections/main-product.liquid` (around line 116). Replace:

```liquid
      <div class="price-block" id="PriceBlock-{{ section.id }}">
        <div class="price-row">
          <span class="price-now" id="PriceNow-{{ section.id }}">
            {{ current_variant.price | money }}
          </span>
          {%- if current_variant.compare_at_price > current_variant.price -%}
            <span class="price-was" id="PriceWas-{{ section.id }}">
              {{ current_variant.compare_at_price | money }}
            </span>
            <span class="price-save" id="PriceSave-{{ section.id }}">
              Save {{ current_variant.compare_at_price | minus: current_variant.price | money }}
            </span>
          {%- endif -%}
        </div>
```

with:

```liquid
      <div class="price-block" id="PriceBlock-{{ section.id }}" data-reveal data-reveal-delay="0">
        <div class="price-row">
          <span
            class="price-now{% if current_variant.compare_at_price > current_variant.price %} price-now--on-sale{% endif %}"
            id="PriceNow-{{ section.id }}"
          >
            {{ current_variant.price | money }}
          </span>
          {%- if current_variant.compare_at_price > current_variant.price -%}
            <span class="price-was" id="PriceWas-{{ section.id }}">
              {{ current_variant.compare_at_price | money }}
            </span>
            <span class="price-save" id="PriceSave-{{ section.id }}">
              Save {{ current_variant.compare_at_price | minus: current_variant.price | money }}
            </span>
          {%- endif -%}
        </div>
```

- [ ] **Step 2: Update price CSS in `sections/main-product.liquid`**

Find `.price-now` CSS (around line 592) and add the on-sale modifier:

```css
.price-now--on-sale {
  color: var(--color-walnut, #8A6240);
}
```

Find `.price-save` CSS (around line 609) and replace the background/color:

```css
.price-save {
  font-family: var(--font-label);
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #C0392B;
  background: rgba(192, 57, 43, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 2px;
  align-self: center;
}
```

- [ ] **Step 3: Add `data-reveal` to trust strip items and update icon colour**

Find the trust strip `<ul>` in `sections/main-product.liquid` (around line 288). Replace each `<li class="trust-item">` with staggered reveal:

```liquid
      <ul class="trust-strip" role="list">
        <li class="trust-item" data-reveal data-reveal-delay="0">
          <svg class="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false">
            <path d="M1 3h4l2.5 11.5h11L21 7H6"/>
            <circle cx="9" cy="20" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="18" cy="20" r="1.5" fill="currentColor" stroke="none"/>
          </svg>
          <span>{{ section.settings.trust_1_text | default: 'Free shipping over $60' | escape }}</span>
        </li>
        <li class="trust-item" data-reveal data-reveal-delay="80">
          <svg class="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-4.17"/>
          </svg>
          <span>{{ section.settings.trust_2_text | default: '30-day returns' | escape }}</span>
        </li>
        <li class="trust-item" data-reveal data-reveal-delay="160">
          <svg class="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false">
            <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.5C17.25 22.15 21 17.25 21 12V7L12 2z"/>
          </svg>
          <span>{{ section.settings.trust_3_text | default: '2-year warranty' | escape }}</span>
        </li>
      </ul>
```

Find `.trust-icon` CSS and change colour to walnut:

```css
.trust-icon {
  width: 17px;
  height: 17px;
  color: var(--color-walnut, #8A6240);
  flex-shrink: 0;
}
```

- [ ] **Step 4: Add product info column entrance animation**

Add to the product page CSS (after `.product-info` rule around line 502):

```css
.product-info {
  padding-top: 0.25rem;
  animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@media (max-width: 768px) {
  .product-info {
    /* fadeInUp already uses translateY so mobile works identically */
    animation-delay: 0.1s;
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add sections/main-product.liquid
git commit -m "feat: product page price hierarchy, trust strip reveal, info entrance"
```

---

### Task 8: Product page — ATC button breathe + loading state

**Files:**
- Modify: `sections/main-product.liquid`

- [ ] **Step 1: Add breathe animation and loading styles to ATC button CSS**

Find `.btn-atc` CSS (around line 859). Add to the existing rule and append loading state styles:

```css
.btn-atc {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 56px;
  background: var(--color-cta, #2D2D2D);
  color: var(--color-bone, #F2EDE4);
  border: none;
  border-radius: 4px;
  font-family: var(--font-label);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 3px;
  text-transform: uppercase;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: background 0.2s ease, transform 0.12s ease, box-shadow 0.2s ease;
  margin-bottom: 1.375rem;
  box-shadow: 0 2px 12px rgba(43, 43, 43, 0.18);
  animation: breathe 2.4s ease-in-out infinite;
}

/* Loading state */
.btn-atc.is-loading {
  background: var(--color-walnut, #8A6240);
  animation: none;
  cursor: wait;
}

.btn-atc.is-loading::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 0%;
  background: rgba(255, 255, 255, 0.5);
  animation: atc-progress 0.6s ease forwards;
}

@keyframes atc-progress {
  from { width: 0%; }
  to   { width: 100%; }
}

/* Mobile: opacity breathe only */
@media (max-width: 767px) {
  .btn-atc {
    animation: breathe-opacity 2.4s ease-in-out infinite;
  }
  .btn-atc.is-loading {
    animation: none;
  }
}
```

- [ ] **Step 2: Add loading state JS to ATC form handler in `sections/main-product.liquid`**

Find the `document.addEventListener('DOMContentLoaded'...` or the submit handler in the product page `<script>`. The ATC form is handled globally by `component-cart-drawer.js` via `[data-type="add-to-cart-form"]`. We need to hook into the button's own state.

Find the product page script block and add after the accordion listener (just before the closing `}());`):

```js
  /* -- ATC LOADING STATE ----------------------------------------- */
  var atcBtn  = root.querySelector('#AddToCart-' + sid);
  var atcText = root.querySelector('#AddToCartText-' + sid);

  if (atcBtn) {
    atcBtn.closest('form').addEventListener('submit', function () {
      if (atcBtn.disabled) return;
      atcBtn.classList.add('is-loading');
      if (atcText) atcText.textContent = 'Adding\u2026';
    });

    /* Remove loading state when cart drawer opens (cart:updated fires after refresh) */
    document.addEventListener('cart:updated', function () {
      atcBtn.classList.remove('is-loading');
      if (atcText) {
        atcText.textContent = atcBtn.disabled
          ? (atcBtn.dataset.soldOutLabel || 'Sold Out')
          : (atcBtn.dataset.atcLabel || 'Add to Cart');
      }
    }, { once: false });
  }
```

Also update `applyVariant` so it resets loading state when variant changes:

```js
  function applyVariant(variant) {
    if (!variant) return;
    if (variantIdInput) variantIdInput.value = variant.id;

    if (priceNow) {
      priceNow.textContent = formatMoney(variant.price);
      priceNow.classList.toggle('price-now--on-sale', variant.compare_at_price > variant.price);
    }
    if (togglePriceOnce) togglePriceOnce.textContent = formatMoney(variant.price);

    if (variant.compare_at_price > variant.price) {
      if (priceWas) { priceWas.textContent = formatMoney(variant.compare_at_price); priceWas.hidden = false; }
      if (priceSave) { priceSave.textContent = 'Save ' + formatMoney(variant.compare_at_price - variant.price); priceSave.hidden = false; }
    } else {
      if (priceWas)  priceWas.hidden  = true;
      if (priceSave) priceSave.hidden = true;
    }

    if (addToCartBtn) {
      addToCartBtn.disabled = !variant.available;
      addToCartBtn.classList.remove('is-loading');
      if (addToCartText) addToCartText.textContent = variant.available
        ? (addToCartBtn.dataset.atcLabel || 'Add to Cart')
        : (addToCartBtn.dataset.soldOutLabel || 'Sold Out');
    }

    try {
      var url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      history.replaceState({}, '', url.toString());
    } catch (e) { /* noop */ }
  }
```

- [ ] **Step 3: Commit**

```bash
git add sections/main-product.liquid
git commit -m "feat: ATC button breathe pulse and loading state with progress bar"
```

---

### Task 9: Apply `data-reveal` to section headings in theme

**Files:**
- Modify: `sections/hero.liquid` (hero text)
- Modify: `sections/stats-strip.liquid` (stat items)
- Modify: `sections/testimonials.liquid` (testimonial cards)
- Modify: `sections/newsletter.liquid` (heading)
- Modify: `sections/product-grid.liquid` (heading)

- [ ] **Step 1: Add `data-reveal` to hero heading**

In `sections/hero.liquid`, find the main heading element (e.g. `<h1` or `<h2`) and add `data-reveal`:

```liquid
<h1 class="hero__heading t-display-xl" data-reveal>
```

If there is a subheading or CTA button, add staggered delays:

```liquid
<p class="hero__sub" data-reveal data-reveal-delay="100">...</p>
<a class="btn btn--primary" data-reveal data-reveal-delay="200">...</a>
```

- [ ] **Step 2: Add `data-reveal` to product-grid section heading**

In `sections/product-grid.liquid`, find the heading block:

```liquid
        {%- if eyebrow != blank -%}
          <p class="product-grid__eyebrow t-label" data-reveal>{{ eyebrow }}</p>
        {%- endif -%}
        <h2 class="product-grid__heading t-display-md" data-reveal data-reveal-delay="80">{{ heading }}</h2>
```

- [ ] **Step 3: Add `data-reveal` to stats strip items**

In `sections/stats-strip.liquid`, find each stat item and add `data-reveal` with staggered delay:

```liquid
<div class="stat-item" data-reveal data-reveal-delay="{{ forloop.index0 | times: 80 }}">
```

- [ ] **Step 4: Add `data-reveal` to testimonial cards**

In `sections/testimonials.liquid`, find each testimonial card:

```liquid
<div class="testimonial" data-reveal data-reveal-delay="{{ forloop.index0 | times: 100 }}">
```

- [ ] **Step 5: Add `data-reveal` to newsletter heading**

In `sections/newsletter.liquid`, find the heading:

```liquid
<h2 class="newsletter__heading" data-reveal>
```

- [ ] **Step 6: Push everything**

```bash
git add sections/hero.liquid sections/stats-strip.liquid sections/testimonials.liquid sections/newsletter.liquid sections/product-grid.liquid
git commit -m "feat: data-reveal scroll entrance on section headings and key elements"
git push origin main
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Savings banner gradient + border + animation | Task 3 |
| Amount pop on update | Task 3 |
| Goals shimmer sweep | Task 4 |
| Goals ring-pulse on milestone | Task 4 |
| Goals label "Unlocked" text | Task 4 |
| Discount focus glow | Task 5 |
| Apply button fills walnut | Task 5 |
| Checkout breathe pulse | Task 5 |
| Checkout ripple on click | Task 5 |
| Payment badges opacity hover | Task 5 |
| Sale badge red + badge-pulse | Task 6 |
| Card lift on hover | Task 6 |
| Image zoom 1.06 | Task 6 |
| Save X% pill on cards | Task 6 |
| Card grid entrance stagger | Task 6 |
| ATC overlay walnut on sale | Task 6 |
| price-now--on-sale colour | Task 7 |
| price-save red badge | Task 7 |
| Trust strip reveal stagger | Task 7 |
| Trust icons walnut colour | Task 7 |
| Product info entrance | Task 7 |
| ATC breathe pulse | Task 8 |
| ATC loading state + progress | Task 8 |
| applyVariant resets loading + on-sale class | Task 8 |
| Nav scaleX underline | Task 2 |
| Footer link scaleX underline | Task 2 |
| Global keyframes | Task 1 |
| data-reveal system | Task 1 |
| reduced-motion coverage | Task 1 |
| Section headings reveal | Task 9 |
| Mobile opacity-only fallback | Task 1 (CSS), Task 6 (JS) |

All spec requirements covered. No placeholders or TBDs.
