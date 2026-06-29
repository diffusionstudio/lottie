# Single-Line Redraw (handwriting / draw-on)

> **Scope — the stroke is the visible artwork.** Use this when the deliverable is a
> single continuous pen line *drawing itself on*: handwriting, handwritten text
> animation, draw-on, write-on, signature, "make it look hand-drawn". The
> visible result **is the stroke** — there is no fill hidden behind a matte. If
> instead the original **filled** mark must stay visible and you only need a hidden
> path to *reveal* it, **STOP — use `single-line-vectorization.md`** (mask-reveal),
> not this file. (See When To Use / When Not below.)

Redraw is the inverse of mask-reveal. Mask-reveal keeps a filled SVG visible and
hides a Trim/matte driver behind it (`td`/`tt`). Redraw makes the **stroke itself**
the art and animates Trim Paths *on that visible stroke* — no track matte, no fill
layer underneath. Do not import the rail-pairing solver, the matte snippet, or the
masking reference's machinery; they solve the opposite problem.

## Contents

1. When To Use / When Not
2. Input Contract
3. Tier A — Reuse Existing Stroked Paths (exact)
4. Lottie Wiring Skeleton (verbatim)
5. Draw-Order Rules
6. Style Defaults For Handwriting
7. Boundaries — Automatic vs User-Provided
8. Invalid Solutions
9. Script

A small additive helper lives at `scripts/redraw/build_redraw.py` — it parses open
stroked paths and emits the wiring below plus a flat `redraw-preview.svg`. It does
**not** do centerline extraction, rail pairing, or skeletonization.

## When To Use / When Not

Decide by **source geometry**, not intent words (handwriting language appears in
every variant). Decide in this order (first match wins):

1. **Source has open stroked path(s)** (`fill="none"` + `stroke=…`, no `Z`) →
   **REDRAW · reuse.** The centerline is *given*. Go to Tier A. Always prefer this.
2. **Redraw intent + only a filled SVG** → **REDRAW · stroke-data-required.** A fill
   cannot be reliably inverted to one ordered pen path (see Boundaries). Request a
   single-line/stroke source (single-line font, un-outlined stroke export, or
   authored strokes). Offer the Phase 2 skeleton attempt *only* with the explicit
   "review draw order" caveat. Do **not** silently hand it to the masking solver.
3. **Fill must stay visible / reveal-of-a-fill** → not this file → use
   `single-line-vectorization.md`.
4. **Plain kinetic text drawing on** (typed wordmark, "draw this word on like ink",
   no stroked-SVG source) → typically `recipe-typography.md`'s handwritten-trace
   route. Use this file when the request is specifically a single continuous
   pen-line redraw of stroked/authored source geometry.
5. **Ambiguous?** If you genuinely can't tell whether the stroke is the visible art
   or a fill is being revealed, ask once: *"Should the letters draw themselves on as
   a moving pen line (redraw), or should existing filled artwork be revealed along
   its shape (mask)?"*

## Input Contract

- **Redraw-ready** = open stroked path(s) in draw order, ideally one `<path>` per pen
  stroke. Exact and automatic.
- **Single-line font / un-outlined stroke export** = also redraw-ready. Exact.
- **Filled-only** = degraded. The pen centerline is not present in the geometry;
  request stroke data first. Skeleton-traversal recovery (Phase 2) is constant-width,
  low-overlap only and is **always flagged `draw_order: review`** — never exact.

## Tier A — Reuse Existing Stroked Paths (exact)

This is the high-value, exact path. Do not re-derive geometry you already have.

1. Parse each `<path>`'s `d`. **Keep the Béziers** — convert on-curve points and
   cubic control points into Lottie's vertex + in/out-tangent form (`v`/`i`/`o`).
   Do **not** flatten curves to dense polylines (that destroys the tangents, balloons
   the point count, and roughens the settled stroke). `derive_rails.py`'s
   `flatten_subpath` is the wrong tool here — it flattens on purpose.
2. **One stroke group (one layer) per pen `<path>`.** Keep the source `fill="none"`
   intent: the shape is open (`c:false`), not closed.
3. Add Trim Paths per stroke, animating `e` from `0 → 100` over the stroke's draw
   window. The first vertex must be the pen entry (see Draw-Order Rules).
4. Stroke the path with the **visible design width** (the source `stroke-width`),
   round cap, round join (see Style Defaults).
5. Stagger strokes in reading order so the word writes continuously (see Draw-Order).

The settled (100%) frame must match the source stroke exactly — no smoothing away of
source curvature, no forced sharpening.

## Lottie Wiring Skeleton (verbatim)

One layer per pen stroke. The stroke is the visible art; Trim Paths is the write-on.
**No `td`/`tt`, no fill layer.** Derive the trim end-frame from the scene `fr`/`op` —
the `24` below is illustrative, not a constant.

```jsonc
// one layer per stroke; staggered ip or staggered trim start
{
  "ind": 1, "ty": 4, "nm": "redraw-h",
  "ks": { /* identity transform */ },
  "shapes": [{ "ty": "gr", "nm": "stroke-h", "it": [
    { "ty": "sh", "nm": "pen-path", "ks": { "a": 0, "k": {
        "i": [ /* in tangents from source Béziers */ ],
        "o": [ /* out tangents from source Béziers */ ],
        "v": [ /* on-curve points from source d */ ],
        "c": false                              // OPEN — never closed
    }}},
    { "ty": "tm", "nm": "write-on",             // Trim Paths = the redraw
      "s": { "a": 0, "k": 0 },
      "e": { "a": 1, "k": [
        { "t": 0,  "s": [0],   "o": {"x":[0.42],"y":[0.0]}, "i": {"x":[0.58],"y":[1.0]} },
        { "t": 24, "s": [100] }                 // assert 0 -> 100; frame from scene fr
      ]},
      "o": { "a": 0, "k": 0 }, "m": 1 },        // m:1 -> trim after stroke
    { "ty": "st", "nm": "ink",                  // VISIBLE stroke (this is the artwork)
      "c": { "a": 0, "k": [0,0,0,1], "sid": "textColor" },
      "o": { "a": 0, "k": 100 },
      "w": { "a": 0, "k": 14.8883 },            // source stroke-width, FIXED
      "lc": 2,                                  // ROUND cap (handwriting terminal)
      "lj": 2,                                  // ROUND join (correct for cursive; banned in masking)
      "ml": 4 },
    { "ty": "tr" /* identity */ }
  ]}]
}
// stroke-2 ("ello") = same shape, ip/trim staggered to start as stroke-1 finishes (slight overlap).
```

Hard rules:
- `c:false` (open). Width fixed (`"a":0`). `lc:2`/`lj:2` for handwriting. No matte, no
  fill layer.
- Trim `e` runs `0 → 100`; first vertex is the pen entry; coords in source viewBox
  space.
- Multi-stroke: stagger by ~80–90% of each stroke's duration so the word writes
  continuously L→R.

**Why `lj:2` here when masking bans it:** the masking reference bans round join `lj:2`
because the matte sits over a *settled sharp fill* and a round join would round that
settled mark. In redraw the source is round-capped and curvy and the stroke *is* the
art, so round join + round cap is the **correct default**. Same token, opposite
meaning — which is exactly why the two modes stay separate.

## Draw-Order Rules

- **Horizontal text:** sort strokes left-to-right by baseline (use SVG path order only
  as a tiebreak for strokes at the same x).
- **Within a stroke:** start at the natural pen entry (left/top) unless the source
  encodes direction. Reverse the vertex list if the source `d` runs the wrong way.
- **Continuity:** overlap successive strokes' trims slightly (start stroke N at
  ~80–90% of stroke N−1) so the line reads as one continuous hand, not disjoint pieces.
- Do **not** force one continuous path across genuinely separate strokes (e.g. "h" and
  "ello"); keep them as separate ordered layers and stagger them.

## Style Defaults For Handwriting

- Round cap `lc:2`, round join `lj:2`.
- Constant width by default = the **visible design width** (the source stroke-width),
  not a coverage width. Width is fixed (`"a":0`); no width keyframes.
- Color via slot, e.g. `"sid": "textColor"`, with a `controls.json` entry.
- Preserve source curvature; never smooth it away and never force-sharpen it.

## Boundaries — Automatic vs User-Provided

| Capability | Status |
|---|---|
| Redraw from existing open stroked paths (reuse) | **Exact, automatic** |
| Redraw from single-line font / un-outlined stroke export | **Exact, automatic** |
| Per-stroke trim timing, draw-order staggering, cap/width/color wiring | **Deterministic, automatic** |
| Left-to-right glyph ordering (horizontal text) | **Reliable, automatic** |
| Constant-width, low-overlap filled mark → skeleton+traversal | **Approximate · review draw order** |
| Draw direction within a stroke (start/end) | **Heuristic · review** |
| Variable-width handwriting/brush from a fill | **Not reliable — require stroke data** |
| Heavy self-overlap / many crossings from a fill | **Not reliable — require stroke data** |
| True calligraphic stroke order/direction from a fill | **Not recoverable — require stroke data** |
| Matching a specific person's writing motion | **Not recoverable — require stroke data** |

Rule: if the goal is a true redraw and the only input is a filled shape, request
stroke/centerline data first; don't attempt inversion. Skeleton-traversal is
constant-width, low-overlap only, and always flagged review.

## Invalid Solutions

- Using a **track matte** (`td`/`tt`) for a redraw — that is mask-reveal; the redraw
  output is a visible stroke + Trim, nothing hidden.
- Calling the **filled outline boundary** a centerline.
- **2-rail pairing** (the masking solver) on a self-crossing handwriting form.
- Emitting a **raster skeleton** as a single path without graph traversal / ordering.
- **Forcing one continuous path** across genuinely separate strokes.
- Flattening Béziers to dense polylines and shipping that as the pen path (roughens
  the settled stroke, balloons points).
- Smoothing away source curvature, or force-sharpening round handwriting terminals.

## Script

`scripts/redraw/build_redraw.py` (Phase 1) — input an SVG (or `--d`) with open stroked
paths; orders strokes baseline L→R; emits the wiring above and a flat
`redraw-preview.svg` (each stroke at its width, numbered in draw order, with a
start-point dot). It does **not** do centerline extraction, rail pairing, or
skeletonization. Run it on the source SVG, or smoke-test inline with `--d`, e.g.
`python3 build_redraw.py --d "M10 50 C 30 10 60 10 80 50" --width 6`. See also
`player-contract.md` for export/render rules and `svg-compatibility.md` for Skottie
stroke/trim behavior.
