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
4. **Open the auto-emitted `centerline.svg` first** (any editor's SVG preview, no dev
   server): confirm the semi-transparent matte footprint hugs the fill, that any spill is
   over background only, and **that there is no red** (red = cross-limb bleed). Then read
   `width_spread` / `width_decision` and `containment_report`, then copy into the
   production matte (see `build_matte_snippet.md`):
   - `route_decision.matte_vertex_order` → the matte polyline (`c:false`),
   - if `width_decision` is `single-width` → `recommended_matte_width` (one fixed stroke);
     if `per-section` → `matte_width_profile[i]` per section (one open sub-path each),
   - use `route_decision.matte_linecap` + `cap_decision` (butt `lc:1` is the **default** for sharp/polygonal, round `lc:2` for curved/handwriting or `--linecap round`), `lj:1` (miter join), `ml:8` — the butt cap keeps the settled mark sharp; `cap_decision.notch_risk_corners` (always reported) lists the corners that show a *transient* frontier notch under the butt cap, so **offer `--linecap round` (or the opt-in `--fillet` stage) as a revision only if that transient matters** for this mark; when the opt-in fillet stage fires, `route_decision.matte_shape` is present — copy its `v`/`i`/`o` verbatim and keep them; the route is cap-extended so the terminal blooms over background (clipped) and still covers each cap, avoiding the frame-1 square-cap bloom,
   - assert the Trim `e` value runs **0 → 100** with the first vertex at the start cap, and inspect the corner-crossing frames (frontier passing each sharp fold) — a clean settled frame is not proof they are notch-free.
   If `centerline.svg` shows red bleed or heavy spill, switch to the per-section matte or
   reconsider the route — do not widen and hope. **Any magenta** (apex-clip) means a fillet was
   rejected for clipping the settled apex — never ship it, and never loosen the check to pass it.
5. A separate Lottie debug *scene* is optional richer proof; `centerline.svg` is the
   required human-verification artifact and is never substituted by the Lottie scene.

## What it does

- Flattens the subpath; detects end **caps** by the U-turn test (cap count = topology
  signal). Exactly 2 caps ⇒ single folded ribbon (the target).
- Splits into two rails, pairs them **by route order** (never by inter-rail arclength).
- Chooses the math by **sharp-corner fraction** (objective, `--corner-deg`):
  - high ⇒ **polygonal** → midline-intersection (exact sharp corners; primary, proven),
  - low ⇒ **curved** → **normal-foot** pairing (fold-tolerant; **secondary/unproven** —
    validate against a real folding-curved fixture before trusting it).
- Emits `centerline.json`: `method`, `centerline_vertices`, `centerline_d`,
  `section_widths` (raw per-method), `matte_width_profile` (per centerline section,
  local width + 2·margin), `width_spread`, `width_decision`, `margin`,
  `recommended_matte_width` (single-width fallback = max of the profile),
  `containment_report` (`worst_case`, `bleed_samples[]`, `overhang_samples_count`),
  `max_balance_imbalance`, `caps`, `railA_outer`, `railB_inner`, `balance_report[]`
  (with `seg`/`left_foot`/`right_foot`/`ambiguous`), and `route_decision` (with
  `matte_linecap`, `cap_decision`, `reveal_span: [0,100]`, the 0→100 trim note, and —
  when corners are filleted — `matte_shape` `{v,i,o,c:false}`).
- Decides the cap by **content class** (butt `lc:1` for sharp/polygonal, round `lc:2` for
  curved/handwriting; override with `--linecap`) and **always** reports
  `cap_decision.notch_risk_corners` — the sharp corners that show a transient butt-cap notch
  (the trigger to offer `--linecap round` as a revision).
- Has an **opt-in margin-bounded corner-fillet stage** (`--fillet`, **off by default**): on
  polygonal marks it de-notches gentle corners the matte margin can absorb so the cap can stay
  **butt** (`lc:1`), gated by a tip-coverage check that leaves a corner sharp rather than round
  the settled apex. It no-ops on tight-margin marks (e.g. thin folded-flag ribbons), so it is
  off unless asked. When it fires it reports `fillet_report` (`filleted` / `left_sharp` /
  `tip_clip_samples`) and emits `route_decision.matte_shape`.
- Emits `centerline.svg` on **every run** next to the JSON: a flat coverage overlay
  (filled contour, rails+caps, the matte footprint stroked with the **decided cap** and
  filleted arcs, the centerline, **red bleed stretches**, yellow ambiguous rings, **green
  filleted / grey notch-risk / magenta apex-clip** corner markers). Opens with no dev server.

## When NOT to use it

- The mark already has a real stroke path → reuse that, don't re-derive.
- The U-turn test finds **≥3 short caps** / a Y or T junction → genuine branching; no
  clean 2-rail split exists. Split into multiple driver paths (the tool warns and you
  should heed it) rather than forcing one route or falling to a raster skeleton.

Standard library only; no dependencies.
