---
target: all pages
total_score: 28
p0_count: 0
p1_count: 1
timestamp: 2026-06-02T19-34-17Z
slug: frontend-all-pages
---
# Design Critique — Adepa Pork Hub (all pages) · Run 2

## Design Health Score: 28/40 (up from 24) — Solid, two clear gaps

| # | Heuristic | Score |
|---|-----------|-------|
| 1 | Visibility of System Status | 3/4 |
| 2 | Match System / Real World | 3/4 |
| 3 | User Control and Freedom | 2/4 |
| 4 | Consistency and Standards | 3/4 |
| 5 | Error Prevention | 3/4 |
| 6 | Recognition Rather Than Recall | 3/4 |
| 7 | Flexibility and Efficiency | 3/4 |
| 8 | Aesthetic and Minimalist Design | 3/4 |
| 9 | Error Recovery | 3/4 |
| 10 | Help and Documentation | 2/4 |

## Anti-Patterns
- gradient-text ban CLEARED (was on Home hero)
- Detector: 1 finding remaining — overused-font Inter (accepted, Playfair carries identity)
- NOT detector-visible: ProductDetail.tsx:40 still renders emoji fallbacks (pork/chili/meat) — the one page the sweep missed

## Priority Issues
- [P1] ProductDetail emoji fallbacks (ProductDetail.tsx:39-41). Swap to PorkMark. Command: polish
- [P2] Two public-header styles coexist: Products/Locations got eyebrow+display-2; Home/Events/ProductDetail/Checkout kept text-3xl sm:text-4xl. Command: typeset
- [P2] Events image placeholder uses decorative flame->gold gradient (Events.tsx:64). Use PorkMark variant=event. Command: polish
- [P2] User control: no reorder on past orders, no PENDING-order cancellation. Command: craft

## Minor
- ProductDetail quantity stepper drifts from POS stepper style
- Events identical 2-col card grid acceptable (cards are right affordance)
- Help/documentation absent app-wide; a footer "WhatsApp us" would lift heuristic 10 cheaply

## What's working
- Checkout recovery panel (money-safe + reference + WhatsApp)
- Order Tracking status hero (stage-shifting gradient, personality copy, ETA, Live badge)
- Locations editorial numbered list
