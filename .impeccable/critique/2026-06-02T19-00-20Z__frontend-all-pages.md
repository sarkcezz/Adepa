---
target: all pages
total_score: 24
p0_count: 1
p1_count: 2
timestamp: 2026-06-02T19-00-20Z
slug: frontend-all-pages
---
# Design Critique — Adepa Pork Hub (all pages)

## Design Health Score: 24/40 — Competent, needs polish pass

| # | Heuristic | Score |
|---|-----------|-------|
| 1 | Visibility of System Status | 3/4 |
| 2 | Match System / Real World | 3/4 |
| 3 | User Control and Freedom | 2/4 |
| 4 | Consistency and Standards | 2/4 |
| 5 | Error Prevention | 2/4 |
| 6 | Recognition Rather Than Recall | 3/4 |
| 7 | Flexibility and Efficiency | 3/4 |
| 8 | Aesthetic and Minimalist Design | 2/4 |
| 9 | Error Recovery | 2/4 |
| 10 | Help and Documentation | 2/4 |

## Anti-Patterns
- gradient-text at index.css:163 (.text-gradient-warm on Home hero "Ready") — absolute ban
- overused-font Inter (index.css:10) — warning
- Card monotony: Checkout, Dashboard (3 identical stat cards = hero-metric template), Locations (identical card grid)
- Decorative gradients on promo strips (Dashboard, EmployeeDashboard)

## Priority Issues
- [P0] Checkout paid-but-order-failed dead-end (Checkout.tsx:108). Customer charged, no order #, no reference, no recovery. Command: harden
- [P1] Gradient text on hero (Home.tsx + index.css:163). Command: typeset
- [P1] Checkout summary is a text spreadsheet at moment of payment — no thumbnails/desire. Command: layout
- [P2] Card monotony across Checkout/Dashboard/Locations. Command: layout
- [P2] Order Tracking flat at emotional peak — no ETA/celebration. Command: delight

## Minor
- Checkout Method type includes EVENT, only HOME/PICKUP render (dead code)
- Products size select styled inconsistently with pill filters
- text-night-400 (#737373) on cream ~4.0:1, under 4.5:1 floor
- Promo success uses literal checkmark in copy (Checkout.tsx:197)
- Page-title scale inconsistent (2xl/3xl/4xl across pages)
