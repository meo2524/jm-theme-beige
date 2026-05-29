# Hair Botox scroll-story sections — design spec

**Date:** 2026-05-29
**Theme:** Mend & Co Beige (`JM/Mend-Beige/` → `meo2524/JM-Theme-Beige`)
**Product:** Mend Hair Botox (`templates/product.mend-hair-botox.json`)
**Source:** KORMESIC supplier marketing graphics (purple) — translated to Mend Beige brand.

## Goal
Three discrete, theme-editor-configurable PDP sections that tell the product story
with tasteful scroll interactivity ("Apple-ad" restraint), mobile-first. Reuse the
theme's existing `motion.js`/`base.css` reveal system — **no new JS**.

## Decisions (locked with operator)
- **Look:** Translate to Mend Beige (cream/gold/charcoal, JetBrains Mono). Section 2 = charcoal.
- **Structure:** 3 discrete OOTB sections (settings + blocks + presets), reusable.
- **Motion:** `data-reveal` / `data-reveal-delay` / `data-word-reveal` + CSS-only sticky/parallax. Sticky+parallax disabled < 768px.
- **Imagery:** CSS-art orbs (no images) for Section 2; `image_picker` upload fields with empty-state fallbacks for Sections 1 & 3.

## Motion contract (existing, do not modify)
- `base.css` §16: `[data-reveal]{opacity:0;translateY(16px)}` → `.is-visible{opacity:1;transform:none}`. ≤480px = opacity only. Reduced-motion = forced visible.
- `motion.js`: IntersectionObserver adds `.is-visible` (threshold 0.12), honours `data-reveal-delay` (ms). `data-word-reveal` splits words into `.word-reveal__word` spans, 60ms stagger.

## Sections

### 1. `repair-benefits.liquid` — "Repair Benefits" (cream)
Two-column: sticky/parallax media left, content right. Stacks on mobile (media top).
- Settings: `eyebrow`, `heading` (word-reveal), `lede`, `image` (image_picker), `image_caption`, `bg_color`.
- Blocks `benefit` (max 6, default 3): `label`, `description`. Numbered 01–0n, stagger-reveal.
- Default copy: Nourishing / Smoothness / Strengthening (cleaned from supplier).
- Empty image → cream gradient placeholder (intentional look).

### 2. `ingredient-core.liquid` — "Ingredient Core" (charcoal #1f1d1a)
Centered heading + 3 CSS-art glass orbs (gradient + gold ambient glow), gentle float,
reveal on scroll. Alternating text alignment desktop / stacked centre mobile.
- Settings: `eyebrow`, `heading` (word-reveal), `lede`, `bg_color` (default charcoal), `accent_color` (default gold).
- Blocks `ingredient` (max 6, default 3): `number` (auto 01–0n via forloop), `name`, `description`.
- Default copy: 01 Acetyl Hexapeptide-8 / 02 Hydrolysed Collagen + Keratin / 03 Biotin.
- Heading frames the "hair botox" nickname honestly — no toxin/medical claim.

### 3. `botanical-extracts.liquid` — "Botanical Extracts" (bone/cream)
Heading + 3-up card grid (image top, name, desc). Single column mobile. Stagger-reveal,
image zoom-in on reveal (scale 1.06→1), hover lift.
- Settings: `eyebrow`, `heading` (word-reveal), `lede`, `bg_color`.
- Blocks `extract` (max 6, default 3): `image` (image_picker), `name`, `description`.
- Default copy: Ginseng Root Extract / Camellia Seed Oil / Lactic Acid.
- Empty image → cream gradient + monogram fallback.

## PDP order (in `product.mend-hair-botox.json`)
`main → repair-benefits → ingredient-core → botanical-extracts → before/after → reviews → faq`

## Editorial calls
1. "Lactic Acid" isn't botanical → section titled "Botanical actives", not "plant extracts".
2. Dropped supplier "from Korea" sourcing claim (unverified); origin left as optional editable field.
3. No count-up — no real stats to animate.

## Conventions
- Scoped CSS per section, unique class prefix (`rb-`, `ic-`, `be-`), Mend tokens with beige fallbacks.
- Each section reusable on any product/template via theme editor presets.
- New section files are NOT subject to Shopify template-JSON sync race; template edit done last against a fresh pull.

## Out of scope
No new JS, no scroll-scrubbed pinning, no fabricated stats, no image generation (uploads later).
