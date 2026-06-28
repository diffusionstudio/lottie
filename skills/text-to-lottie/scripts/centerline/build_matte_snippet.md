# Matte wiring snippet (production + debug)

Reference Lottie wiring for a centerline reveal, consuming `centerline.json` from
`derive_rails.py`. This is the proven shape — copy the structure, do not improvise
caps/joins. The visible artwork stays the **original filled mark**; the centerline
is a hidden stroke matte.

## Production scene (the only thing the user sees)

Two layers: a matte driver (`td:1`) and the original filled mark (`tt:1`).

```jsonc
// layers[0] — matte DRIVER (hidden). Stroke is the alpha; Trim Paths reveals it.
{
  "ind": 1, "ty": 4, "nm": "flag-reveal-matte",
  "td": 1,                                  // this layer is a track matte
  "ks": { /* identity transform */ },
  "shapes": [{ "ty": "gr", "nm": "matte", "it": [
    { "ty": "sh", "nm": "centerline", "ks": { "a": 0, "k": {
        // Open polyline: i/o are all [0,0]; v = route_decision.matte_vertex_order.
        "i": [[0,0], ...], "o": [[0,0], ...],
        "v": [ /* route_decision.matte_vertex_order — already cap-extended */ ],
        "c": false                          // OPEN polyline, never closed
    }}},
    { "ty": "tm", "nm": "trim",             // Trim Paths = the reveal
      "s": { "a": 0, "k": 0 },
      "e": { "a": 1, "k": [
        { "t": 6,  "s": [0],   "o": {"x":[0.42],"y":[0.10]}, "i": {"x":[0.58],"y":[0.92]} },
        { "t": 66, "s": [100] }
      ]},
      "o": { "a": 0, "k": 0 }, "m": 1 },     // m:1 -> trim AFTER stroke (width stays fixed)
    { "ty": "st", "nm": "matte-stroke",
      "c": { "a": 0, "k": [1,1,1,1] },       // white; hidden, color irrelevant
      "o": { "a": 0, "k": 100 },
      "w": { "a": 0, "k": 18.9 },            // recommended_matte_width — FIXED ("a":0)
      "lc": 1,                               // route_decision.matte_linecap (1=butt 2=round 3=square): butt for sharp/polygonal, round for curved
      "lj": 1,                               // MITER join (1=miter 2=round 3=bevel) — keeps settled mark sharp
      "ml": 8 },                             // generous miter limit
    { "ty": "tr" /* identity */ }
  ]}]
}

// layers[1] — original FILLED mark, matted by the layer above.
{
  "ind": 2, "ty": 4, "nm": "flag-fill",
  "tt": 1,                                   // use the track matte from the layer above
  "shapes": [{ "ty": "gr", "it": [
    { "ty": "sh", "ks": { /* ORIGINAL filled subpath, c:true */ } },
    { "ty": "fl", "c": { "a": 0, "k": [r,g,b,1], "sid": "brandColor" } },
    { "ty": "tr" }
  ]}]
}
```

Hard rules (these are what the regression got wrong):
- **Cap = `route_decision.matte_linecap` (a decision), `lj:1` (miter join), `ml:8`.** **Cap and
  join are separate decisions.** The matte is a track matte over the sharp fill, so the
  **join** shapes the *settled* mark and the **cap** shapes only the *moving frontier*:
  - **`lj:1` (miter), never `lj:2` (round join).** A round join rounds the *settled*
    artwork — that is the rounded-mask regression, and it stays banned.
  - **Cap defaults to butt (`lc:1`) for sharp/polygonal marks.** As the Trim frontier crosses
    an interior corner/fold, a butt cap leaves a hard step — a transient **zigzag/notch**
    (≈ ½·width·tan(turn/2)). The settled mark stays sharp regardless (miter join); only this
    *moving* frontier notches. Every sharp interior corner is listed in
    `cap_decision.notch_risk_corners` (always reported) — its transient notch is **accepted by
    default, not auto-fixed**. To remove it, OFFER `--linecap round` (rounds only the frontier,
    leaving the settled mark sharp) as a revision when that transient matters for the mark.
  - **Cap defaults to round (`lc:2`) only for curved/handwriting marks**, or on `--linecap
    round`. A round cap rounds *only the frontier* (the settled mark is the sharp fill, so it
    stays sharp); it stays the opt-in tool for a transient notch the user wants gone, but is
    no longer the sharp-mark default. Always take the value from `matte_linecap`.
- **Never square (`lc:3`) at the start.** A square cap projects half the stroke width past the
  start vertex the instant Trim leaves 0, so the reveal pops a full-width blob at frame 1 — it
  reads as "starting at ~5–10%," not growing from a point. The solver resolves this:
  `route_decision.matte_vertex_order` is **already extended** outward by
  half the local width at both ends (`route_decision.cap_extension`), so the butt/round
  terminal sits over *background* (clipped away by the matte), giving a clean point-start *and*
  full finish. Neither butt nor round reaches further than the fill, so caps never worsen
  bleed. Use the extended order as-is with `matte_linecap`.
- **Stroke width is fixed** (`"w": {"a":0, ...}`) at `recommended_matte_width`. Never
  animate width to fix coverage, never bloom the endpoint.
- Matte polyline uses **`route_decision.matte_vertex_order`** (the cap-extended one) so the
  reveal starts at the intended cap and grows from a point. It is **open** (`c:false`).
- Driver coordinates stay in the **source viewBox space** so they register with the fill.
- **Trim `e` value runs `[0] → [100]`** (assert the keyframes below), and the first vertex
  of `matte_vertex_order` is the start cap. **Do not start the trim above 0.** A trim that
  starts mid-value (10/20) to hide a bad first frame is a tell that the start vertex is
  wrong — fix the vertex, not the trim. **But note: a 0→100 trim is necessary, not
  sufficient.** It proves the *trim* is right; it cannot see cap geometry. A square cap
  blooms at frame 1 even with a perfect 0→100 trim — that is why a butt/round cap (never
  `lc:3`) + the cap-extended order matters. The block above is correct: `s:{a:0,k:0}` and `e`
  keyframes `s:[0]` → `s:[100]`, stroked with `matte_linecap` (butt for sharp, round for curved).

## Single-width vs per-section: read `width_decision`

`derive_rails.py` reports `width_decision` (`single-width` | `per-section`) and `width_spread`.
- **`single-width`** (low spread, and `containment_report.bleed_samples` empty) → use the
  single-stroke block above at `recommended_matte_width`. Oversized width is never a
  substitute for a correct route.
- **`per-section`** (spread at/above the gate, or any cross-limb bleed under a single width)
  → use the per-section matte variant below. A static per-section width profile is a
  *fitting*, not an animation — there are still no width keyframes.

## Per-section matte variant (high spread / bleed)

One `gr` per centerline section, each with its own open `sh` (that section's centerline
segment), its own `st` at the section's `matte_width_profile[i]`, with section boundaries
**overlapped by ε** so the matte stays continuous (otherwise a step at the join can flash
a gap during the reveal). All sub-paths share **one coordinated Trim** across the ordered
group so the reveal reads as a single frontier.

**Secondary until rendered:** the per-section geometry is proven (the containment pass
shows no bleed), but its reveal continuity — no gap-flash at the overlapped section
boundaries under the shared Trim — only shows once animated. Render it before trusting it,
same caveat as the curved/normal-foot branch.

```jsonc
{ "ty": "gr", "nm": "matte", "it": [
  // one sub-group per section, in matte_vertex_order; boundaries overlap by ε
  { "ty": "gr", "nm": "sec-0", "it": [
    { "ty": "sh", "ks": { "a": 0, "k": {
        "i": [[0,0],[0,0]], "o": [[0,0],[0,0]],
        "v": [ [x0,y0], [x1,y1] ],          // section 0 segment (+ε overlap into sec-1)
        "c": false }}},
    { "ty": "st", "c": {"a":0,"k":[1,1,1,1]}, "o": {"a":0,"k":100},
      "w": { "a": 0, "k": /* matte_width_profile[0] */ 17.08 },  // per-section, FIXED
      "lc": 1, "lj": 1, "ml": 8 },          // route_decision.matte_linecap (butt for sharp);
                                            // first/last section uses the cap-extended endpoint (terminal clipped to bg)
    { "ty": "tr" }
  ]},
  // ... sec-1, sec-2, each at matte_width_profile[i] ...
  { "ty": "tm", "nm": "trim",                // ONE shared trim across the whole group
    "s": { "a": 0, "k": 0 },
    "e": { "a": 1, "k": [
      { "t": 6,  "s": [0],   "o": {"x":[0.42],"y":[0.10]}, "i": {"x":[0.58],"y":[0.92]} },
      { "t": 66, "s": [100] }                // ASSERT: [0] -> [100]
    ]},
    "o": { "a": 0, "k": 0 }, "m": 1 },
  { "ty": "tr" }
]}
```

**Terminal-cap rule.** Use `route_decision.matte_linecap` with the cap-extended
`matte_vertex_order`: the terminal blooms over background and is clipped
away (no frame-1 bloom) and each cap is still covered because the endpoint was pushed out by
half a width. **Butt (`lc:1`) is the default for sharp/polygonal marks** — the settled apex
stays sharp (miter join), and the sharp interior corners that show a transient frontier notch
are listed in `cap_decision.notch_risk_corners` (always reported, notch accepted by default).
**Round (`lc:2`) is the default
only for curved/handwriting marks** (or `--linecap round` when the user wants a left-sharp
corner's transient notch gone) — it sweeps crossings smoothly and rounds only the frontier.
Square (`lc:3`) is what the regression used to "guarantee full reveal," but it blooms at the
start and, at a tip within half a stroke width of a neighbouring limb, drives the stroke into
that limb — cross-limb bleed (see `containment_report.bleed_samples`); butt and round both
reach no further than the fill, so neither worsens this. **Cap ≠ join:** `lj:1` (miter) stays
the join default regardless — a round *join* (`lj:2`) would round the *settled* mark (the
regression), whereas the cap only shapes the moving frontier. For per-section mattes the
shared trim plus the ε-overlap between sections keeps the frontier continuous. If a convex
corner points at a nearby limb and the honest `centerline.svg` shows red there, bevel that one
join (`lj:3`) rather than widening.

## Debug scene (OPTIONAL — the required flat proof is `centerline.svg`)

The solver auto-emits `centerline.svg` next to `centerline.json` on every run — that flat
overlay (filled contour, rails+caps, the matte footprint stroked with the **decided cap**,
centerline, **red bleed stretches**, yellow ambiguous rings, **grey notch-risk corner
markers**) is the **required** human-verification artifact and opens with no dev server. The
Lottie debug scene below is **optional** richer proof, never a substitute for the flat SVG.

`public/projects/<slug>-centerline-debug/scene-1/lottie.json`, one static frame. Layer
list (front to back) — all readable colored strokes/dots; this styling never leaks into
the production matte:

1. original filled mark @ ~22% gray (context)
2. original contour outline (thin gray)
3. `railA_outer` (orange) + `railB_inner` (purple) + caps A/B (green)
4. normal guides: for each `balance_report` sample, a short line to `left_foot` and to
   `right_foot` (shows centeredness)
5. derived centerline (bright cyan, thin)
6. midpoint dots at each sample; `ambiguous` samples get a larger yellow ring

Build it from the same `centerline.json`; read `max_balance_imbalance`, the `ambiguous`
flags, and `containment_report` before trusting the route.
