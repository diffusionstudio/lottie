# Centerline solver (bundled)

Reference geometry sandbox for `references/single-line-vectorization.md`. Derives a
single-line centerline for a filled ribbon/tube/folded-flag mark by **contour rail
pairing** — not a raster skeleton, not a guessed route.

## Use it

1. Copy this folder into a per-project sandbox: `scripts/<slug>-centerline/`.
2. Run it on the mark's filled subpath:
   ```
   python3 derive_rails.py mark.svg                 # picks the richest subpath
   python3 derive_rails.py --d "M.. L.. Z"          # or pass the path inline
   python3 derive_rails.py mark.svg --index 2 --start-cap A
   ```
3. Read the printed **balance report**. Good route: `max_balance_imbalance` is small and
   only convex corners are `ambiguous`. If imbalance is large everywhere, the 2-rail
   assumption is wrong — reconsider topology (see below), do not raise stroke width.
4. Copy from `centerline.json` into the production matte (see `build_matte_snippet.md`):
   - `route_decision.matte_vertex_order` → the matte polyline (`c:false`),
   - `recommended_matte_width` → the fixed stroke width,
   - and set `lc:3, lj:1, ml:8` for sharp marks.
5. Build a **separate** debug scene from the same `centerline.json` to prove centeredness.

## What it does

- Flattens the subpath; detects end **caps** by the U-turn test (cap count = topology
  signal). Exactly 2 caps ⇒ single folded ribbon (the target).
- Splits into two rails, pairs them **by route order** (never by inter-rail arclength).
- Chooses the math by **sharp-corner fraction** (objective, `--corner-deg`):
  - high ⇒ **polygonal** → midline-intersection (exact sharp corners; primary, proven),
  - low ⇒ **curved** → **normal-foot** pairing (fold-tolerant; **secondary/unproven** —
    validate against a real folding-curved fixture before trusting it).
- Emits `centerline.json`: `method`, `centerline_vertices`, `centerline_d`,
  `section_widths`, `recommended_matte_width`, `max_balance_imbalance`, `caps`,
  `railA_outer`, `railB_inner`, `balance_report[]` (with `left_foot`/`right_foot`/
  `ambiguous`), and `route_decision`.

## When NOT to use it

- The mark already has a real stroke path → reuse that, don't re-derive.
- The U-turn test finds **≥3 short caps** / a Y or T junction → genuine branching; no
  clean 2-rail split exists. Split into multiple driver paths (the tool warns and you
  should heed it) rather than forcing one route or falling to a raster skeleton.

Standard library only; no dependencies.
