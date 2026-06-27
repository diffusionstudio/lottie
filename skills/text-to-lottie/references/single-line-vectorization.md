# Single-Line Vectorization

Use this when a prompt needs a single-path, centerline, stroke-matte, or
Trim-Paths-style reveal derived from filled SVG/logo/icon geometry. The job is to
convert source artwork into intentional motion-driver path(s) while keeping the
original filled artwork as the visible layer. This is not a visual redraw.

"Single-line" describes the motion-driver *intent*, not a promise that every
source collapses into one continuous path. Use multiple driver paths when that is
the cleanest representation.

## Contents

1. Purpose
2. When To Use
3. Core Invariants
4. Reveal Semantics: Directional Wipe vs Shape-Following
5. Operation Taxonomy
6. Method Selection Ladder
7. Contour Pairing And Rail Midpointing
8. Geometry Sandbox Contract
9. Medial Axis, Straight Skeleton, And Raster Skeletonization
10. Path Cleanup And Refitting
11. Matte Stroke Rules
12. Debug Overlay Requirements
13. Validation
14. Verification Checklist
15. Main Deliverable Priority
16. Invalid Solutions
17. Lottie Implementation Notes

A runnable reference solver lives at `scripts/centerline/derive_rails.py` (with
`build_matte_snippet.md` and `README.md`). Copy it into the sandbox and adapt it
for rail-clear ribbon/tube/folded-flag marks instead of re-deriving geometry by
hand or reaching for a raster skeleton.

## Purpose

Single-line vectorization derives a motion-driver path from existing artwork. The
derived path is usually a *hidden technical driver* — for Trim Paths, a stroke
matte, or mask animation — not the visible artwork. The visible layer normally
stays the original filled SVG.

Decision system, in order: preserve the source artwork; classify the source
geometry; choose the correct driver-path method; for rail-clear ribbon marks
require paired-rail midpointing first, derived through a minimal geometry sandbox;
use skeletonization only when appropriate, then
prune and refit; do not force one path when multiple are cleaner; keep matte
strokes stable and technical; validate centeredness and reveal order, not just
coverage; keep debug proof separate; finish the actual animation.

## When To Use

- Filled logo mark → reveal matte.
- Filled icon → stroke-driven reveal.
- Handwriting-style reveal.
- Outline text/logo → **authored or multi-path reveal route** (not an assumed
  one-stroke draw-on).
- Existing stroked SVG cleanup.
- Complex compound mark needing multiple routes.

## Core Invariants

- Preserve the source viewBox, proportions, colors, fill rules, and final visible
  geometry.
- Do not redraw by eye.
- Do not stroke the original outline and call it a centerline.
- The helper path must serve the final animation, not replace it.
- Debug proof must not pollute the production scene.
- **Derive from the SVG, not a render.** When the original SVG is available,
  derive driver paths from the SVG contours, not from a screenshot or raster
  render. Rasterization is only a fallback for cases where contour access is
  unavailable or rail pairing is unreliable.
- **One path is not always correct.** Do not force a single continuous path when
  the source geometry naturally requires multiple driver paths. Use one path only
  when it produces a clean, intentional reveal route; forcing one route can
  create fake connections, strange reveal ordering, or worse geometry.

## Reveal Semantics: Directional Wipe vs Shape-Following

Two different operations get called "path-driven mask." Pick the right one from
the prompt:

- **Directional wipe / sweep mask** — a rectangle, vertical/horizontal/diagonal
  line, radial wipe, or large crossing stroke used as a matte. It reveals by
  *screen direction*. Valid **only** when the user explicitly asks for a
  directional wipe, linear reveal, top-to-bottom/scan/sweep reveal, or similar.
- **Shape-following path-driven mask** — a mask driver that follows the source
  artwork's *internal* route (source-derived centerline, paired-rail midpoint
  route, or authored draw route running through the mark). It reveals the artwork
  *along its own form*, not merely along its outer silhouette or a bounding
  direction. A path tracing the outline edge, or a line that only shares the
  shape's overall direction, is not shape-following.

For filled logo/icon reveal prompts — "path-driven mask", "path-driven reveal",
"path-revealed matte", "shape-following reveal", "single path reveal",
"centerline reveal", "stroke matte reveal from a filled mark", "mask driver path
for a filled logo/icon" — default to **shape-following**. A straight line or
rectangle that merely crosses the shape is a directional wipe, not a
shape-following reveal; do not substitute one for the other unless the user asked
for a wipe.

## Operation Taxonomy

| Source type | Best method | Avoid | Validation signal |
|---|---|---|---|
| Existing real stroke path in the SVG | Reuse the stroke path directly | Re-deriving a centerline you already have | Path matches the authored stroke; Trim Paths runs clean |
| Filled ribbon/tube-like logo | Contour pairing + rail midpointing | Raster skeletonization as the first move | Driver runs down the visual center of the ribbon |
| Sharp polygonal filled mark | Contour pairing, or straight-skeleton/medial-axis then prune | Smoothing corners into curves | Corners preserved; centerline holds at folds/joints |
| Organic brush-like fill | Raster skeletonization fallback, then vectorize + simplify | Treating a noisy skeleton as final | Pruned route follows the stroke spine, no spurs |
| Outline font/wordmark | Authored route or multiple reveal paths; prefer real single-line fonts | Pretending filled outline is one handwriting path | Original filled lettering preserved as final artwork |
| True handwriting/signature | Reuse/author the stroke spine in draw order | Inventing connections the source lacks | Stroke order reads as natural handwriting |
| Complex compound logo/icon | Split into multiple driver paths | Forcing one continuous route | Each part reveals cleanly; ordering reads intentionally |
| Multi-part mark needing multiple drivers | One driver path per logical part | Merging unrelated parts into one path | Parts stay independent; no fake bridges |
| Compound filled shape with holes/counters | Preserve fill as visible artwork; use authored or multiple driver paths; contour pairing only where rails are clear | Treating all contours as one route; accidentally filling counters; ignoring fill-rule behavior | Final fill/counter relationship stays correct; driver paths don't destroy negative space |
| Directional wipe explicitly requested | Rectangle, linear, radial, or simple sweep matte | Calling it a centerline / vectorization | Mid-reveal reads as the requested directional wipe |
| Shape-following path-driven reveal from a filled mark | Paired-rail midpoint route (required first for rail-clear ribbons, built via the geometry sandbox); source-derived centerline; authored route only after a documented rail-pairing failure | A straight sweep path that merely crosses the shape; a visually authored spine that skips rail midpointing | Mid-reveal progresses along the mark's structure |

The compound-shape row catches letters like `e`, `o`, `a`, cutout icons, and marks with
interior negative space, where careless path merging breaks fill rules and masks.

## Method Selection Ladder

Choose methods in this order:

1. **Reuse an existing real stroke path** if the SVG already contains one.
2. **Ribbon-like polygon marks with visible inner and outer rails → paired-rail
   midpointing is the REQUIRED first attempt, run through the geometry sandbox**
   using the bundled `scripts/centerline/derive_rails.py` (cap-count topology
   gate + route-order pairing). Do not jump to raster skeletonization, and do not
   substitute a visually authored spine, unless the cap-count test proves genuine
   branching (see the Skeleton/authored fallback rule).
3. **Angular polygonal shapes** → contour pairing, or straight-skeleton /
   medial-axis reasoning, then prune.
4. **Organic brush shapes** → raster skeletonization as a fallback, then
   vectorize and simplify.
5. **Filled typography** → do not pretend outline typography automatically
   becomes beautiful handwriting. Prefer real single-line fonts, existing stroke
   artwork, authored routes, or multiple intentional reveal paths. For wordmarks,
   preserving the original filled geometry usually matters more than forcing a
   one-stroke draw-on. If the user asks for a handwriting-style reveal from filled
   text, implement or explain an authored route rather than calling the filled
   outline itself a single-line path.
6. **Complex marks** → split into multiple driver paths rather than forcing one
   bad path.

Do not force a single continuous path when the geometry needs several.

## Contour Pairing And Rail Midpointing

**Classify ribbon/tube marks first.** If a filled mark shows band/ribbon
structure, visible inner and outer rails, folded-strip geometry, or a consistent
visual stroke body, classify it as ribbon/tube-like *before* treating it as a
generic polygon or an authored-route problem. This applies to folded ribbons,
flags, bolts, monograms, and tube-like logos.

For rail-clear ribbon marks, paired-rail midpointing is the **required first
attempt**, not optional taste guidance. For these marks an authored route is
**not a peer option** — it is invalid unless you first attempt paired-rail
midpointing and document, in writing, why it failed (see fallback rule below).
Authored routes are for handwriting, ambiguous compound marks, or deliberate
creative draw order — not a shortcut for rail-clear ribbon/tube marks. Do not
jump to raster skeletonization unless rail pairing fails.

Procedure (work from the source SVG contours, not a render). The bundled solver
`scripts/centerline/derive_rails.py` already implements this — copy it into the
sandbox and adapt it rather than re-deriving by hand:

1. **Detect caps by the U-turn test.** A cap is a short edge where the boundary
   reverses: its neighbouring rail edges run anti-parallel (`dot(prev_dir,
   next_dir)` strongly negative). The **count of true caps is the topology
   signal**, read from geometry, not eyeballed.
2. **Exactly 2 caps ⇒ one single folded ribbon.** Split the closed contour at the
   two caps into an outer rail and an inner rail, and pair them **by route order /
   vertex index** — never by inter-rail arclength. (The Wise flag is exactly this:
   one folded 2-cap ribbon. Calling it a "branched ribbon" was the error that
   licensed a skeleton walk; the cap-count test prevents that.)
3. **Choose the pairing math by the sharp-corner-fraction test** (objective, not by
   example): the fraction of interior rail vertices whose turn exceeds a corner
   threshold (~25°).
   - **High fraction ⇒ polygonal rails** → for each ribbon section take its
     **midline** (the line midway between the two parallel rail segments) and set
     centerline vertices = **intersections of consecutive midlines**; endpoints =
     cap midpoints. This yields exact sharp corners and is **exact even when the
     two paired rails have different lengths (folds)**. This is the primary, proven
     path.
   - **Low fraction ⇒ curved/organic rails** → pair by **normal-foot projection**:
     walk one rail, drop a perpendicular at each sample, take the **nearest foot on
     the opposite rail**, and midpoint the two; then refit. This is fold-tolerant
     because it never assumes equal progress along the two rails. It is
     **secondary and unproven** — validate against a real folding-curved fixture
     before trusting it.
4. Refit as a clean path (see Path Cleanup And Refitting), preserving sharp corners
   where the source is angular.
5. Choose matte stroke width from the measured rail distance
   (`recommended_matte_width`), not by guessing.
6. **Record a route decision** (`route_decision`): which cap the reveal starts from
   and the resulting vertex order, since Trim-Paths direction depends on it.

**Unequal rail length or a fold-back is NOT a reason to abandon rail pairing.**
Normalized-arclength correspondence is the brittle method that breaks on folds —
and note that *uniform-resample-both-rails-then-pair-by-index is normalized
arclength in disguise*, so it is forbidden here too. The midline-intersection and
normal-foot methods are built precisely for folded rails.

**Minimum proof (rail-clear ribbon marks)** — before using the route as the matte
driver: identify the paired rail segments; show midpoint samples/dots; show short
normal guides or paired-boundary distance notes for representative samples
(`balance_report` provides `left`/`right`/`left_foot`/`right_foot` per sample); and
confirm the driver path sits between the rails with a low `max_balance_imbalance`
(only convex corners should be `ambiguous`).

**Skeleton/authored fallback (rail-clear ribbon/tube marks only).** The only valid
trigger for abandoning rail pairing is **genuine topological branching** — ≥3 true
caps, or a Y/T junction where no two-rail decomposition exists — proven by the cap
count from the U-turn test, not by pairing difficulty. When that holds, split into
multiple driver paths (preferred) or fall to a pruned skeleton. A fallback note
must state: the cap count found, why no clean 2-rail split exists, and a debug
overlay proving the fallback still follows the visual center. Unequal rail length,
a fold-back, or "no arclength correspondence" are **invalid** fallback reasons.

## Geometry Sandbox Contract

For rail-clear ribbon/tube marks and other nontrivial filled marks that need a
shape-following path-driven mask, build a minimal geometry sandbox **before**
authoring the production scene. This is a required derivation pass with concrete
file artifacts, not a belief or a prose intent. Produce:

- `scripts/<slug>-centerline/` — the sandbox directory; **start from the bundled
  `scripts/centerline/derive_rails.py`** (copy it in and adapt it — do not
  reinvent the geometry or reach for raster skeletonization first),
- a copy of the source SVG (or a normalized SVG) kept inside it,
- a derivation script (the adapted `derive_rails.py`),
- `centerline.json` as output — including `method` (which branch ran),
  `recommended_matte_width`, `balance_report`, and `route_decision`,
- a debug overlay SVG **or** Lottie scene showing: the original filled mark at low
  opacity, the outer rail, the inner rail, the paired rail segments, the midpoint
  samples, the derived driver route, and optional normal guides / equal-distance
  checks,
- a separate debug scene/project when useful, e.g.
  `public/projects/<slug>-centerline-debug/scene-1/lottie.json`.

Then carry the **approved driver route** into the production Lottie, where the
original filled mark stays the visible artwork. Keep the sandbox small and
time-boxed: do the geometry proof, then finish production. Do not stop at the
sandbox, and do not ship the debug route as the visible artwork.

## Medial Axis, Straight Skeleton, And Raster Skeletonization

These find a center skeleton, but they are a **fallback, not the main move**.

- Use skeletonization when the source is organic/brush-like, or when the cap-count
  test proves genuine branching (≥3 true caps / a Y or T junction). Unequal rail
  length or a fold-back does **not** qualify — that is what rail pairing handles.
- Do not use raster skeletonization as the first solution for clean polygonal
  ribbon marks.
- The skeleton often retracts from sharp convex corners and may create branches,
  spurs, loops, and noisy junctions. It must be pruned before use.
- Skeleton output is not automatically animation-ready: it needs pruning, route
  selection, and path refitting.
- A skeleton path that only works after adding a huge stroke width is not a valid
  centerline.

## Path Cleanup And Refitting

- Remove duplicate points.
- Remove accidental spurs and short branches.
- Keep the fewest points needed to preserve the intended route.
- Preserve sharp corners when the source is sharp.
- Do not smooth angular logo geometry into rounded curves unless the source has
  curves.
- Refit line segments or cubic curves according to the source geometry.

## Matte Stroke Rules

- A matte stroke is a hidden technical mask, not a visible design stroke.
- Use a stable stroke width, fixed (`"w": {"a": 0, ...}`) at the measured
  `recommended_matte_width`. Do not animate stroke width to compensate for poor
  centerline placement.
- **Sharp polygonal marks → exact Lottie values: `"lc": 3` (square cap), `"lj": 1`
  (miter join), `"ml": 8`.** Never `"lc": 2` / `"lj": 2` (round) by default — round
  caps/joins are the rounded-mask regression. Use round only when the source
  geometry is genuinely round. (`lc`: 1=butt, 2=round, 3=square; `lj`: 1=miter,
  2=round, 3=bevel.)
- Keep driver coordinates in the **source viewBox/coordinate space** so the matte
  registers with the fill; do not rescale the centerline independently of the fill.
- If a renderer cannot honor miter/square, compensate by path placement and stable
  stroke width — not by decorative rounding, endpoint blooms, or width animation.
- Do not smooth sharp corners into curves unless the source has curves.
- Do not add unnecessary points.
- Do not use endpoint bloom as the main reveal solution.
- Do not validate only by saying the matte covers the fill.
- The final visible result stays the original filled artwork.

## Debug Overlay Requirements

A debug overlay is **optional only for simple stroke reuse** (an existing real
stroke path you reuse directly). It is **mandatory** for:

- rail-clear ribbon/tube marks,
- filled marks where the prompt asks for a centerline, single path, path-driven
  reveal, path-revealed matte, stroke matte, or shape-following reveal,
- any case where an authored route would otherwise be tempting.

When mandatory, the overlay is the proof the derived route is centered — produce
it as part of the geometry sandbox. Create it in a *separate* debug scene or
debug section containing:

- original fill at low opacity,
- original contours,
- derived driver path,
- sample midpoint dots,
- temporary matte-width preview,
- optional normal guides from midpoint samples to paired rails,
- optional note for ambiguous segments.

Debug overlays may use colored strokes and dots for readability, but production
matte settings must still follow the Matte Stroke Rules. Do not let debug styling
become production matte styling.

Debug geometry must never replace the final animation. The final production scene
stays clean. Build the geometry sandbox for nontrivial marks, but keep it small
and time-boxed: do not stop at the sandbox, and carry the derived route into the
finished production animation. Do the geometry proof, then finish production.

## Validation

Two separate gates:

- **Geometry gate** — is the driver path actually centered, intentionally routed,
  and derived from the source geometry?
- **Animation gate** — does the reveal look clean in the final Lottie, including
  whether the reveal order/direction reads correctly?

Coverage alone is not enough — a huge matte stroke can cover the shape while the
path is still wrong. Validate centeredness and reveal order, not just coverage. A
valid debug overlay should make it obvious whether the driver path follows the
visual center of the source geometry, not merely whether it covers the shape
after stroke-width inflation.

**Mid-reveal check (shape-following drivers):** inspect a mid-reveal frame.
*Passes* when the revealed frontier traces the driver route through the mark's
interior — the exposed region grows along the mark's own form, not as a straight
screen-aligned edge. *Fails* when it reads as a simple top-to-bottom,
left-to-right, diagonal, or rectangular crop — that is a directional wipe, wrong
unless the user requested one.

## Verification Checklist

Before shipping a shape-following reveal from a filled mark, confirm:

- **Topology:** cap count from the U-turn test matches the chosen treatment
  (exactly 2 caps for single-ribbon pairing; ≥3 ⇒ multiple drivers / skeleton).
- **Rail mode:** chosen by the sharp-corner-fraction test and recorded in
  `centerline.json` `method` (polygonal-midline vs normal-foot).
- **Point count:** centerline is minimal — roughly the number of real rail corners,
  not dozens of points and no out-and-back branch retraces.
- **Centeredness:** `max_balance_imbalance` is reported and small; only convex
  corners are flagged `ambiguous`.
- **Route:** `route_decision` (start cap + vertex order) is recorded and matches the
  rendered reveal direction.
- **Matte stroke:** `lc:3, lj:1, ml:8` for sharp marks (never `lc:2`/`lj:2`); width
  fixed (`"a":0`), no width keyframes; coords in the source viewBox space.
- **Artifacts:** `centerline.json` exists and a *separate* debug project renders
  rails + normal guides + ambiguous markers.
- **Main deliverable:** production scene completes the original-artwork preservation,
  wordmark/logo fidelity, composition, timing, and export/player validation — and
  the geometry pass was time-boxed.

## Main Deliverable Priority

- Spend only enough time on the driver path to produce a valid reveal: run the
  geometry sandbox for nontrivial marks, keep it minimal, then finish production.
  Do not over-engineer a general geometry solver, and do not stop at the sandbox.
- **Time-box the geometry:** derive → prove with the balance report → STOP geometry
  → spend the remaining budget on the full animation (composition, wordmark, timing,
  export). The centerline is one subtask, not the deliverable.
- If a segment is ambiguous, make a minimal documented route-selection decision,
  create a debug note if needed, and continue the main animation.
- Still finish the real work: original artwork preservation, logo/wordmark
  fidelity, composition, timing, Lottie structure, and export/player validation.
- **No scratch pollution.** Temporary solver/debug files are allowed during
  construction, but final project output must not depend on messy scratch
  artifacts. Keep debug assets intentional, named, and separate from production
  scene files.

## Invalid Solutions

- Visual guessing.
- Stroking the original outline and calling it a centerline.
- Uniform scaling or offset-only resizing as the final method.
- Oversized matte width as the only proof.
- Animated stroke-width compensation for poor path placement.
- Round caps/joins added by default (`lc:2` / `lj:2` on a sharp polygonal matte).
- Declaring rail pairing "unreliable" because of unequal rail lengths or a
  fold-back, then using raster skeletonization (or uniform-resample-by-index, which
  is normalized-arclength correspondence in disguise).
- Smoothing sharp geometry.
- Unnecessary extra SVG points.
- Endpoint bloom as the main reveal solution.
- Forcing one path where geometry needs several.
- Using an authored or visually designed spine for a rail-clear ribbon mark
  without first attempting paired-rail midpointing and documenting why it failed
  (attempted pairing, ambiguous/unavailable segment, why midpointing is
  unreliable, and proof the fallback still follows the visual center).
- Skipping the geometry sandbox (derivation script + sampled centerline + debug
  overlay) for a nontrivial filled mark, or stopping at the sandbox without
  carrying the derived route into the finished production animation.
- Using a straight vertical/horizontal/diagonal stroke or a rectangle as the
  matte driver for a shape-following reveal, unless the user explicitly asked for
  a directional wipe.
- Debug artifacts replacing the final animation.

## Lottie Implementation Notes

- The original filled shape remains the visible layer.
- The derived path becomes a hidden stroke/matte driver.
- Trim Paths animates the helper stroke.
- The matte reveals the original fill.
- Wordmark and other logo parts remain separate animation layers.
- The debug scene stays separate from production; it is mandatory for rail-clear
  ribbon/tube and shape-following reveals (see Geometry Sandbox Contract) and
  optional only for simple stroke reuse.
- **Reveal order:** choose it intentionally. The driver path should follow the
  direction the mark should appear to be drawn. Do not let SVG contour order
  decide motion order by accident — a geometrically valid path still animates
  badly if it starts from the wrong end, jumps across the mark, or follows
  arbitrary contour order.

See `player-contract.md` for export/render rules, `svg-compatibility.md` for
Skottie SVG behavior, and `recipe-logo.md` for the surrounding logo recipe.
