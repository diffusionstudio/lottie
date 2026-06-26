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
4. Operation Taxonomy
5. Method Selection Ladder
6. Contour Pairing And Rail Midpointing
7. Medial Axis, Straight Skeleton, And Raster Skeletonization
8. Path Cleanup And Refitting
9. Matte Stroke Rules
10. Debug Overlay Requirements
11. Validation
12. Main Deliverable Priority
13. Invalid Solutions
14. Lottie Implementation Notes

## Purpose

Single-line vectorization derives a motion-driver path from existing artwork. The
derived path is usually a *hidden technical driver* — for Trim Paths, a stroke
matte, or mask animation — not the visible artwork. The visible layer normally
stays the original filled SVG.

Decision system, in order: preserve the source artwork; classify the source
geometry; choose the correct driver-path method; for ribbon-like polygon marks
prefer paired-rail midpointing; use skeletonization only when appropriate, then
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

The last row catches letters like `e`, `o`, `a`, cutout icons, and marks with
interior negative space, where careless path merging breaks fill rules and masks.

## Method Selection Ladder

Choose methods in this order:

1. **Reuse an existing real stroke path** if the SVG already contains one.
2. **Ribbon-like polygon marks with visible inner and outer rails → paired-rail
   midpointing is the DEFAULT method.** Do not jump to raster skeletonization
   unless rail pairing fails.
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

For ribbon-like polygon marks with visible inner and outer rails, paired-rail
midpointing is the default — do not jump to raster skeletonization unless rail
pairing fails. It is preferred for folded ribbons, flags, bolts, monograms, and
tube-like logos.

Procedure:

1. Identify the outer and inner rails of the shape.
2. Pair corresponding rail segments by route order and geometric role.
3. Sample points along the paired rails.
4. Compute midpoint samples between paired points.
5. Connect the midpoint samples into the intended route.
6. Refit as a clean path (see Path Cleanup And Refitting).

## Medial Axis, Straight Skeleton, And Raster Skeletonization

These find a center skeleton, but they are a **fallback, not the main move**.

- Use skeletonization when the source is organic, brush-like, or when rail
  pairing is not reliable.
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
- Use a stable stroke width.
- Do not animate stroke width to compensate for poor centerline placement.
- No default round caps or round joins.
- Make cap/join choices **renderer-aware**: use source-matched cap/join settings
  where the renderer supports them (sharp polygonal marks → sharp/miter-like
  joins and butt/square caps). If renderer limitations force a different cap/join,
  compensate by path placement and stable stroke width — not by decorative
  rounding, endpoint blooms, or stroke-width animation.
- Do not smooth sharp corners into curves unless the source has curves.
- Do not add unnecessary points.
- Do not use endpoint bloom as the main reveal solution.
- Do not validate only by saying the matte covers the fill.
- The final visible result stays the original filled artwork.

## Debug Overlay Requirements

Debug overlays are conditional, not mandatory. Create one on request, or when the
centerline is nontrivial, in a *separate* debug scene or debug section containing:

- original fill at low opacity,
- original contours,
- derived driver path,
- sample midpoint dots,
- temporary matte-width preview,
- optional normal guides from midpoint samples to paired rails,
- optional note for ambiguous segments.

Debug geometry must never replace the final animation. The final production scene
stays clean. Do not spend the whole run building a geometry sandbox.

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

## Main Deliverable Priority

- Spend only enough time on the driver path to produce a valid reveal. Do not
  over-engineer a general geometry solver inside the task.
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
- Round caps/joins added by default.
- Smoothing sharp geometry.
- Unnecessary extra SVG points.
- Endpoint bloom as the main reveal solution.
- Forcing one path where geometry needs several.
- Debug artifacts replacing the final animation.

## Lottie Implementation Notes

- The original filled shape remains the visible layer.
- The derived path becomes a hidden stroke/matte driver.
- Trim Paths animates the helper stroke.
- The matte reveals the original fill.
- Wordmark and other logo parts remain separate animation layers.
- The debug scene is optional and separate.
- **Reveal order:** choose it intentionally. The driver path should follow the
  direction the mark should appear to be drawn. Do not let SVG contour order
  decide motion order by accident — a geometrically valid path still animates
  badly if it starts from the wrong end, jumps across the mark, or follows
  arbitrary contour order.

See `player-contract.md` for export/render rules, `svg-compatibility.md` for
Skottie SVG behavior, and `recipe-logo.md` for the surrounding logo recipe.
