# Transformation Timeline — Section Design Spec

**Date:** 2026-05-31
**Theme:** Mend & Co Beige (`JM/Mend-Beige`, repo `meo2524/JM-Theme-Beige`)
**Page:** Hair Botox PDP (`templates/product.mend-hair-botox.json`)
**Status:** Approved design — ready for implementation plan

---

## 1. Goal

Add a vertical, scroll-revealed **usage-journey timeline** to the Hair Botox PDP. As the
visitor scrolls, a gold hairline fills downward and each milestone (Day 01 → 07 → 13 → 30)
fades and lifts into view: one lifestyle photo + a "Day NN" marker + a single honest
"what to expect" line.

**Narrative purpose:** answer "what will this actually do for me over time?" — placed right
after the benefits hook, before the deeper ingredient science.

## 2. Honesty / compliance framing (non-negotiable)

Framed as **"what to expect over 30 days"**, NOT as one person's literal before/after.

- Copy is hedged: "designed to", "many notice", "starts to" — no guarantees, no clinical claims.
- Imagery is a **cohesive illustrative lifestyle progression**, kept **faceless**
  (back-of-hair / over-shoulder / detail) so it reads as a journey, not a claimed identity
  or a fabricated before/after of a specific customer.
- Aligns with the store's no-fake-reviews / FTC rule. No invented testimonials or efficacy proof.

## 3. Architecture & reuse

- New file: `sections/transformation-timeline.liquid`.
- Registered in `templates/product.mend-hair-botox.json`, **after `repair-benefits`**,
  before `ingredient-core`.
- Reuses the existing reveal system: `data-reveal`, `data-reveal-delay`, `data-word-reveal`
  (driven by `base.css` §16 + `motion.js`). **No new JavaScript.**
- Progress-line fill = pure CSS `animation-timeline: view()` (same technique already used in
  the theme's scroll sections), with a graceful static-fill fallback for browsers without
  scroll-driven-animation support.
- Brand tokens only — no new colors/fonts:
  - cream bg `#f5efe6`, gold deep `#8a6240`, gold light `#c9a36b`
  - JetBrains Mono throughout
  - hairlines `rgba(138,98,64,.18–.35)`

## 4. Components (all theme-editor configurable — nothing hardcoded)

### Section settings
| Setting | Default |
|---|---|
| `eyebrow` | "The 30-day journey" |
| `heading` | "What to expect, week by week" |
| `lede` | optional intro sentence |
| `bg_color` | `#f5efe6` |
| `layout` | `single` (stacked) / `alternating` (zig-zag) — default `single` |

### `milestone` blocks (default 4; add/remove/reorder in editor)
| Field | Example |
|---|---|
| `day_label` | "Day 01" |
| `tag` | "First treatment" |
| `title` | optional short title |
| `body` | the single honest "what to expect" line |
| `image` | milestone photo (4:5) |

Each block renders one node: marker dot on the line + photo + day label + one sentence.

## 5. Default honest copy

- **Day 01 · First treatment** — "One rinse-out and hair already feels softer, smoother and
  easier to manage. Frizz visibly calmer."
- **Day 07 · 2–3 treatments in** — "Strands feel stronger and the comb glides — less
  snagging, a healthier natural shine starting to show."
- **Day 13 · Halfway** — "Smoothing builds. Hair falls straighter and styles faster, with
  less heat needed."
- **Day 30 · Full box** — "Repaired, sleek, healthy-looking hair — the look you keep up with
  ongoing use."

## 6. Imagery — dedicated 4-shot lifestyle progression

Generated with Higgsfield `soul_2` using the validated realism recipe (anti-AI / anti-gloss:
"candid amateur iPhone snapshot, dull mixed lighting, grain, real skin, soft natural sheen
NOT glossy, a few flyaways, no curls, faceless"). Consistent visual world: same long straight
dark-brown hair, cream-toned setting, faceless framing.

- **Day 01** — just-washed, damp, slicked back, towel over shoulder (fresh start)
- **Day 07** — air-drying, combing through over the shoulder
- **Day 13** — smoother straighter fall, sweeping hair over one shoulder at a mirror
- **Day 30** — sleek finished lengths down the back, cream loungewear

Assets stored in `assets/` (originals in `_hf-assets/`), `sips`-optimised before commit.

## 7. Aesthetic — "simple beautiful timeline"

- Thin gold hairline (`1px`, `#8a6240` ~30% opacity) running vertically, filling solid gold
  as the visitor scrolls past each node.
- Per-milestone **marker**: hollow gold ring that fills gold once reached.
- **"DAY 01 / 07 / 13 / 30"** in JetBrains Mono caps, letter-spaced — the visual hero of each node.
- Generous whitespace, cream background, one photo + one sentence per node. No heavy cards
  competing with the line — restraint over decoration.
- Each node fades + lifts gently into view on scroll.

## 8. Responsive

- **Desktop:** line down the left; markers + photo + copy to the right (single or alternating).
- **Mobile (390):** line hugs left edge; full-width stacked nodes; photos 4:5; reveal on scroll.
- iOS Safari containment via `overflow-x: hidden` (per store rule, not `contain:layout`).
- **Dual-viewport QA mandatory** (desktop 1280 + mobile 390) before commit.

## 9. Out of scope (YAGNI)

- No sticky-pinned photo swap / scroll-jacking.
- No new JS, no new fonts/colors, no carousel.
- No real customer before/after photos (would require genuine time-series consent + assets).

## 10. Acceptance

- Section renders on the Hair Botox PDP after `repair-benefits`.
- Gold line fills on scroll; nodes reveal in sequence; graceful fallback when
  scroll-driven animation unsupported.
- All copy/images editable in the theme editor; default 4 milestones present.
- Passes dual-viewport QA (no overflow, no overlap, legible at 390px).
- Honest framing preserved — no fabricated before/after or efficacy guarantees.
