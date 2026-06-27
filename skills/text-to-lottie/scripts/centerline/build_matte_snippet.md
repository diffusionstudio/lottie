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
        "i": [[0,0], ...], "o": [[0,0], ...],
        "v": [ /* route_decision.matte_vertex_order from centerline.json */ ],
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
      "lc": 3,                               // SQUARE cap (1=butt 2=round 3=square)
      "lj": 1,                               // MITER join (1=miter 2=round 3=bevel)
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
- **`lc:3, lj:1, ml:8`** for sharp polygonal marks. **Never `lc:2`/`lj:2`** (round) by
  default. Use round only if the source geometry is genuinely round.
- **Stroke width is fixed** (`"w": {"a":0, ...}`) at `recommended_matte_width`. Never
  animate width to fix coverage, never bloom the endpoint.
- Matte polyline uses **`route_decision.matte_vertex_order`** so the reveal starts at the
  intended cap. It is **open** (`c:false`).
- Driver coordinates stay in the **source viewBox space** so they register with the fill.

## Debug scene (separate project, never inside production)

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

The debug scene is the proof the route is centered. Build it from the same
`centerline.json`; read `max_balance_imbalance` and the `ambiguous` flags before trusting
the route.
