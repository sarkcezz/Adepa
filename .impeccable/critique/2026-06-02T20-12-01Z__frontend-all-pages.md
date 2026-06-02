---
target: all pages
total_score: 32
p0_count: 0
p1_count: 0
timestamp: 2026-06-02T20-12-01Z
slug: frontend-all-pages
---
# Design Critique — Adepa Pork Hub (all pages) · Run 3

## Design Health Score: 32/40 (up from 28) — Strong, top of realistic band

| # | Heuristic | Score |
|---|-----------|-------|
| 1 | Visibility of System Status | 3/4 |
| 2 | Match System / Real World | 4/4 |
| 3 | User Control and Freedom | 3/4 |
| 4 | Consistency and Standards | 3/4 |
| 5 | Error Prevention | 3/4 |
| 6 | Recognition Rather Than Recall | 3/4 |
| 7 | Flexibility and Efficiency | 3/4 |
| 8 | Aesthetic and Minimalist Design | 4/4 |
| 9 | Error Recovery | 3/4 |
| 10 | Help and Documentation | 3/4 |

## Anti-Patterns
- Category-reflex check: PASSED both orders. Oxblood+sage+brass on bone escapes the red+gold first reflex AND the terracotta+green second reflex.
- Detector: 1 finding — overused-font Inter (accepted, Playfair carries display identity).

## Priority Issues
- [P2] Admin panel hasn't had the brand pass — customer pages use rounded-3xl/shadow-soft editorial surfaces; admin still stacks flat .card. Command: layout
- [P3] Inter body font — last detector warning, last typographic lever. Command: typeset
- [P3] Flexibility ceiling — no favourites, no reorder from order list, no customer keyboard affordances. Command: craft

## What's working
- The palette escape (oxblood/sage/brass) — defeats the AI-slop category-reflex test
- WhatsApp-native support/recovery — genuinely market-fit for Ghana (heuristic 2 = 4)
- Funnel holds confidence end to end: hero -> product -> premium checkout -> status-hero tracking

## Minor
- Admin/customer surface drift is the one gap holding consistency off a 4
- Sage used in 2 spots; a third considered use (fresh/in-stock state) would cement it as a system color
- Status-hero pulse animations could explicitly honor prefers-reduced-motion
