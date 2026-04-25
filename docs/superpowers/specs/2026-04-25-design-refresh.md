# Design Refresh — Mend & Co Theme

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the Mend & Co storefront feel dynamic, premium, and conversion-optimised — premium calm on product/browse pages, energetic urgency in the cart.

**Approach:** Targeted visual hierarchy fixes + a motion layer. No layout changes, no font/colour palette changes (beyond two specific accent additions). All animations respect `prefers-reduced-motion` and degrade gracefully on mobile.

**Accent additions:**
- Sale red: `#C0392B` (sale badges, save pills) — universally reads as "sale"
- Walnut pulse: existing `--color-walnut` (#8A6240) used for glow/breathe effects on CTAs

---

## Section 1 — Cart Drawer

### 1.1 Savings Banner (`[data-cart-savings]`)
- Background: warm walnut-tinted gradient strip (`linear-gradient(135deg, rgba(138,98,64,0.08) 0%, transparent 100%)`)
- Left border: `3px solid var(--color-walnut)`
- The `[data-cart-savings-amount]` strong element: font-size bump to `1rem`, colour `var(--color-walnut)`
- **Entrance animation:** `savings-reveal` keyframe — `translateY(-100%) + opacity:0` → `translateY(0) + opacity:1`, 0.35s `cubic-bezier(0.16,1,0.3,1)`, fires when `hidden` attribute is removed
- **Amount update pop:** when the savings amount changes (JS), add class `is-popping` → scale 1→1.12→1 over 0.2s, then remove class

### 1.2 Goals Bar — Milestone Celebration
- Fill bar: `::after` pseudo-element with shimmer sweep (`background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)`), `shimmer` keyframe runs once on page load and re-triggers whenever bar advances
- Node icon on milestone reached: `ring-pulse` keyframe — expanding `box-shadow` ring that fades out (0→16px, opacity 1→0), 0.6s ease, fires once when `.is-reached` class is applied
- Label sub-text changes when milestone reached: "Spend X" → "Unlocked! 🎉" (JS updates `textContent`)
- Label name colour transitions from muted → `var(--color-walnut)` with 0.3s ease when `.is-reached` applied

### 1.3 Checkout Area
- **Discount input focus:** `box-shadow: 0 0 0 3px rgba(138,98,64,0.18)` on `:focus`, 0.15s ease (replaces border-only treatment)
- **Apply button:** hover fills solid `var(--color-walnut)` with `color: white` (currently just border flip)
- **Checkout button idle:** `breathe` keyframe — `box-shadow` swells from `0 2px 8px rgba(138,98,64,0)` → `0 4px 20px rgba(138,98,64,0.22)` → back, 2.4s ease-in-out infinite
- **Checkout button click:** ripple `::after` pseudo expands from click point, `opacity 0.3→0` over 0.5s
- **Mobile:** breathe uses opacity-only variant (no box-shadow animation); ripple retained

---

## Section 2 — Product Cards

### 2.1 Sale Badge
- Background: `#C0392B`, text: white — replaces current amber/neutral
- `badge-pulse` keyframe: scale `1→1.06→1`, 2s ease-in-out infinite
- Mobile: pulse disabled (`@media (max-width: 767px) { animation: none }`)

### 2.2 Hover State
- Image zoom: `scale(1.06)` (up from 1.04), 0.55s cubic-bezier kept
- Card lift: `box-shadow: 0 8px 32px rgba(43,43,43,0.14)` on hover, transition 0.3s ease (from flat `box-shadow: none`)
- ATC overlay on sale items: background `var(--color-walnut)` instead of white — visual differentiation
- Mobile: hover states replaced with `:active` equivalents (no hover events on touch)

### 2.3 Price Block
- `price--sale`: same font-size as regular price + `color: var(--color-walnut)`
- `price--compare`: `font-size: 0.85em`, `text-decoration: line-through`, `opacity: 0.45` (already partly done — ensure consistent)
- New "Save X%" pill below price on sale items: `font-size: 0.6875rem`, `background: rgba(192,57,43,0.1)`, `color: #C0392B`, `border-radius: 2px`, `padding: 2px 6px`

### 2.4 Grid Entrance Animation
- `fadeInUp` keyframe: `opacity:0, translateY:16px` → `opacity:1, translateY:0`, 0.5s `cubic-bezier(0.16,1,0.3,1)`
- Applied via `IntersectionObserver` on each `.card` element — fires once, then observer disconnects for that element
- Stagger: `transition-delay` set inline as `index * 60ms` (capped at 300ms so late cards don't lag)
- Reduced motion: observer still fires but sets `opacity:1` instantly with no transform

---

## Section 3 — Product Page

### 3.1 Price / Discount Block
- `price-now` colour changes to `var(--color-walnut)` when `compare_at_price` is active (Liquid: add class `price-now--on-sale` conditionally)
- `price-save` badge: background `rgba(192,57,43,0.1)`, colour `#C0392B` (matches card Save pill — replaces current green-tinted background)
- Price block entrance: `fadeInUp` 0.4s 0s delay on page load

### 3.2 ATC Button
- Idle breathe pulse: same `breathe` keyframe as checkout button, 2.4s loop
- On click (JS): add class `is-loading` → button background transitions to `var(--color-walnut)`, text updates to "Adding…", thin progress line sweeps across bottom edge via CSS `::after` (`width: 0→100%`, 0.6s ease)
- On cart open: remove `is-loading`, restore original state
- Mobile: breathe is opacity-only; loading state retained

### 3.3 Trust Strip
- Each `trust-item` gets `data-reveal` + `data-reveal-delay` (0ms, 80ms, 160ms)
- Trust icons colour: `var(--color-walnut)` (up from muted olive — warmer, more trustworthy)
- Mobile: already stacks vertically, no change needed

### 3.4 Product Info Column Entrance
- Right column (`.product-info`) slides in: `translateX(24px) + opacity:0` → `translateX(0) + opacity:1`, 0.5s `cubic-bezier(0.16,1,0.3,1)` on page load
- Mobile: translate direction switches to `translateY(16px)` (vertical entrance fits single-column layout better)

---

## Section 4 — Global

### 4.1 Reveal System
- New utility class: `[data-reveal]` — starts `opacity:0, transform:translateY(16px)`
- `reveal-observer.js` (small inline script in `theme.liquid`): `IntersectionObserver` with `threshold:0.15`, sets `data-reveal-visible` attribute when element enters view
- CSS: `[data-reveal-visible] { opacity:1; transform:none; transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1); }`
- `data-reveal-delay="N"` attribute: JS reads value and sets `transition-delay: Nms` inline
- Applied to: section headings, hero text, stats strip items, testimonial cards, newsletter block

### 4.2 Nav & Footer Micro-interactions
- Nav links: `::after` underline grows `scaleX(0→1)` from left on hover, 0.2s ease — replaces static hover
- Footer links: same underline treatment
- Payment badges (cart): `opacity: 0.55 → 1` on hover, 0.15s ease

### 4.3 Mobile Strategy
- All `transform`-based entrances: `@media (max-width: 480px)` — `transform: none`, `opacity` only
- `breathe` pulse: opacity variant only on mobile (avoid box-shadow GPU cost)
- `:hover` states all have `:active` equivalents for touch
- Card grid stagger: capped at 2 cards staggered on mobile (rest animate immediately) to avoid perceived lag

### 4.4 Reduced Motion
- Extend existing `@media (prefers-reduced-motion: reduce)` block in `base.css` to cover all new keyframes: `badge-pulse`, `breathe`, `shimmer`, `ring-pulse`, `savings-reveal`, `fadeInUp`
- Reveal system: when reduced motion is detected, observer fires but applies `opacity:1` with `transition: none`

---

## Files to Modify

| File | Changes |
|------|---------|
| `assets/base.css` | Add `[data-reveal]` styles, nav underline, `fadeInUp`, `breathe`, reduced-motion extensions |
| `assets/component-cart-drawer.css` | Savings banner styling, goals shimmer/ring-pulse, checkout breathe, discount focus glow |
| `assets/component-cart-drawer.js` | Amount pop class, milestone label update, ATC loading state, ripple |
| `snippets/cart-drawer.liquid` | No structural changes needed |
| `snippets/product-card.liquid` | Sale badge colour, save pill, hover box-shadow, `data-reveal` attributes |
| `sections/main-product.liquid` | `price-now--on-sale` class, trust icon colour, `data-reveal` on trust items, product-info entrance, ATC loading JS |
| `layout/theme.liquid` | Add `reveal-observer` inline script, `data-reveal` on section headings |

## Out of Scope
- Font changes
- Spacing/layout changes
- Colour palette changes (beyond `#C0392B` sale red + walnut accent reuse)
- Any new sections or components
