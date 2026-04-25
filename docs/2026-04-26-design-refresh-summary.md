# Mend & Co — Design Refresh Summary

_Completed 2026-04-26._

**Status:** All 8 phases + 3 follow-ups + post-launch polish shipped to `main`.

## What changed

The whole site now wears the **Direction 01 — Refined** design language from the Claude Design handoff:

- **Palette:** cream `#efe8dc` + charcoal `#1f1d1a` + muted bronze accents (`#735b3f` deep, `#c4b89e` light) — no more rust-orange brown
- **Typography:** Cormorant Garamond (display + italic accents) + Inter (body) + JetBrains Mono (utility/eyebrows)
- **Voice:** italic-gold accents on every pivot word and ampersand; literary, quiet, editorial

## Sections touched

| Section | What it now looks like |
|---|---|
| Header | Light cream surface, italic-gold "Mend *&* Co" wordmark at 30px, mono uppercase nav links at 13px |
| Promo bar | Ledger-style marquee with N° / ✶ / ◐ marks scrolling continuously (replaces flash-sale countdown) |
| Hero | 108px Cormorant headline w/ italic-gold accent word, serif lede at 24px, "✶ Begin again ✶" annotation, **interactive draggable orb** with drop-in physics + cycling "*inhale* / *exhale*" word synced to the 7s breath loop, "Shop Now" CTA at 64px |
| Stat band | Charcoal bg, 56px serif numbers in cream, mono cream labels |
| Product cards | N° marker, italic serif name, mono tag line, right-aligned serif price |
| Story (new) | 2-col editorial: image + italic-accent headline + 2 serif paragraphs + tlink |
| Newsletter | Cormorant heading w/ italic accent, paper-tinted input, charcoal mono pill button |
| Footer | Charcoal w/ italic-gold "Mend *&* Co" wordmark, italic serif quote, gold pulse-dot tagline, serif 19px link items, mono "© Mend & Co — MMXXVI · All gentle rights reserved" (live Roman numeral year) |
| Mobile drawer | Light cream surface, italic-on-hover serif links — unified with the light nav |

## Foundation

- New `assets/base.css` design tokens (cream/char/gold scales, font vars)
- Shared utility classes: `.eyebrow`, `.wordmark`, `.btn-mend`, `.tlink`, `.num`, `.ph`, `.grain`, `.marquee`, `.pulse-dot`
- Legacy `--color-*` aliases preserved so older sections kept working through the rollout
- Google Fonts swap: Playfair → Cormorant Garamond + JetBrains Mono added; Inter expanded to 400/500/600

## Bug fixes along the way

- **Wordmark double-encoding** — `shop.name` was returning `Mend&amp;Co` HTML-encoded; decoded before splitting on `&`
- **Mobile orb position** — centered horizontally instead of pushed right
- **Orb draggability** — lifted stage out of `.hero__scene` stacking context so pointer events reach it
- **Type sizes** — sympathetic bump pass after initial implementation (header most prominently)

## Merchant-configurable in the theme editor

- Promo bar items (3–6 entries with mark/text/link)
- Story section (eyebrow / heading parts / 2 paragraphs / link / image)
- Hero copy + scroll cue
- Footer brand statement, tagline, social links, columns
- Product card N° + tag via metafields (`product.metafields.custom.card_number`, `card_tag`)

## Commits (in order)

| SHA | What |
|---|---|
| `93a496c` | Phase 1 — Foundation (tokens, fonts, utilities) |
| `603228e` | Phase 2 — Header refresh |
| `6517e6f` | Phase 3 — Hero typography & accents |
| `e05c6fc` | Phase 4 — Ledger marquee promo bar |
| `6c5e7f5` | Phase 5 — Stat band restyle |
| `b31c9d0` | Phase 6 — Product card refresh |
| `22ee8f3` | Phase 7 — Story section (new) |
| `f7a086a` | Phase 8 — Footer refresh |
| `c74e9e2` | Follow-ups — mobile drawer, roman year, newsletter |
| `5787b5f` | Type size bump pass |
| `a57e9a2` | Wordmark double-encoding fix |
| `732ba6f` | Mute the warm-gold palette |
| `5082309` | Inhale/exhale breath word |
| `17c76dc` | Hero CTA size bump |

## What's left for content / future passes

- Real photography to replace the Story section placeholder
- Real merchandising in the promo bar
- Optional: align the account popup styles with the new light language
- Optional: revisit any remaining legacy `--color-*` references and migrate to direct `--char` / `--gold-*` tokens
