---
name: text-to-lottie
description: Author a Lottie (Bodymovin) JSON animation that renders in a local skia player. Use whenever the user asks to create, generate, edit, or fix a Lottie animation, or asks for "an animation" to load.
---

# Writing a renderable Lottie for this project

This app renders Lottie with **Skia's Skottie** module (via `canvaskit-wasm`),
not the JS `lottie-web` runtime. Follow the rules below and
verify the result.

## Setting up the project

If you don't already have the player project on this machine, scaffold a fresh
copy with **degit**:

```bash
npx degit diffusionstudio/lottie my-animation
cd my-animation
npm install   # postinstall copies the CanvasKit wasm into /public
npm run dev
```

Then open the printed local URL. If you already have the project, just
`npm install && npm run dev`.

## Where to write the file (and how it loads)

- Write the animation JSON to **`public/lottie.json`**. That is the only file
  you need to touch to change what the app shows — [`src/App.tsx`](../../../src/App.tsx)
  fetches `/lottie.json` at startup.
- With the dev server running (`npm run dev`), a Vite plugin watches that file
  and **full-reloads the page on save**, so your edit appears immediately. No
  other wiring is required.
- If parsing fails, the app shows the error on screen ("CanvasKit could not
  parse the Lottie file.").

## Required top-level shape

Every Lottie document is one JSON object with at least these fields:

```jsonc
{
  "v": "5.7.0",      // bodymovin version string
  "fr": 60,          // frame rate (fps)
  "ip": 0,           // in point (start frame)
  "op": 120,         // out point (end frame) — duration = (op - ip) / fr seconds
  "w": 512,          // composition width  (px)
  "h": 512,          // composition height (px)
  "assets": [],      // images / precomps; [] if none
  "layers": [ /* ... */ ]
}
```

The app letterboxes the `w`×`h` composition to fit the canvas, so pick a square
or sensible aspect ratio. `op` controls the total frame count shown in the UI.

## Layers

`layers` follows After Effects order: the **first** entry in the array is the
**topmost** layer, and later entries render underneath it. Each layer needs at
minimum:

```jsonc
{
  "ty": 4,           // layer type: 4 = shape layer (the common case)
  "nm": "circle",    // name (optional but helpful)
  "ip": 0,           // layer in point
  "op": 120,         // layer out point — must cover the frames you want it visible
  "st": 0,           // start time
  "ks": { /* transform — see below */ },
  "shapes": [ /* ... */ ]   // for shape layers
}
```

Common layer types: `4` shape, `2` image, `1` solid, `0` precomp, `5` text.
Prefer **shape layers (`ty: 4`)** for LLM-authored animations — no external
assets needed.

### The transform block (`ks`)

Every layer has a transform. Each property is either static (`{ "a": 0, "k": value }`)
or animated (`{ "a": 1, "k": [ ...keyframes ] }`).

```jsonc
"ks": {
  "o": { "a": 0, "k": 100 },                 // opacity 0–100
  "r": { "a": 0, "k": 0 },                   // rotation (degrees)
  "p": { "a": 0, "k": [256, 256, 0] },       // position [x, y, z]
  "a": { "a": 0, "k": [0, 0, 0] },           // anchor point [x, y, z]
  "s": { "a": 0, "k": [100, 100, 100] }      // scale (percent, per axis)
}
```

**Anchor matters:** rotation and scale pivot around the anchor `a`, expressed in
the layer's own coordinate space. To rotate a shape around its own center, set
the shape's geometry around the anchor (e.g. center the ellipse on `a`).

## Shapes — the #1 Skottie gotcha

**Skottie requires shape elements to be wrapped in a Group (`ty: "gr"`).** A flat
list of shapes + fills directly in `shapes` renders **blank**. Always nest the
geometry, fill/stroke, and a group transform inside a group's `it` array:

```jsonc
"shapes": [
  {
    "ty": "gr",            // GROUP — required wrapper
    "nm": "ball",
    "it": [
      {
        "ty": "el",        // ellipse
        "p": { "a": 0, "k": [0, 0] },
        "s": { "a": 0, "k": [120, 120] }
      },
      {
        "ty": "fl",        // fill
        "c": { "a": 0, "k": [0.2, 0.6, 1, 1] },   // RGBA, each 0–1
        "o": { "a": 0, "k": 100 }
      },
      {
        "ty": "tr",        // GROUP TRANSFORM — include even if identity
        "p": { "a": 0, "k": [0, 0] },
        "a": { "a": 0, "k": [0, 0] },
        "s": { "a": 0, "k": [100, 100] },
        "r": { "a": 0, "k": 0 },
        "o": { "a": 0, "k": 100 }
      }
    ]
  }
]
```

Shape primitives inside `it`:
- `"el"` ellipse — `p` center, `s` [width, height]
- `"rc"` rectangle — `p` center, `s` [w, h], `r` corner radius
- `"sh"` custom path — `ks.k` is a bezier `{ "c": closed?, "v": verts, "i": inTangents, "o": outTangents }`
- `"st"` stroke — `c` color, `w` width, `o` opacity
- `"fl"` fill — `c` color (RGBA 0–1), `o` opacity
- `"tr"` the group's transform (always include it last)

**Colors are normalized 0–1 RGBA**, not 0–255. `[1, 0, 0, 1]` is opaque red.

## Animating a property (keyframes)

Set `"a": 1` and make `k` an array of keyframe objects. Each keyframe has a
time `t` (frame), a value `s` (start value for that segment, as an array), and
easing handles `i`/`o`:

```jsonc
"p": {
  "a": 1,
  "k": [
    { "t": 0,   "s": [256, 120], "i": { "x": [0.5], "y": [1] }, "o": { "x": [0.5], "y": [0] } },
    { "t": 60,  "s": [256, 400], "i": { "x": [0.5], "y": [1] }, "o": { "x": [0.5], "y": [0] } },
    { "t": 120, "s": [256, 120] }
  ]
}
```

- `t` is the frame number; the last keyframe usually has no `i`/`o`/easing pair
  beyond `s` (it's the end).
- `s` is **always an array**, even for scalars like rotation: `"s": [360]`.
- `i`/`o` are the bezier ease handles (incoming / outgoing). `x`/`y` arrays in
  `[0..1]`. For a smooth ease use `x:[0.5], y:[1]` (in) and `x:[0.5], y:[0]`
  (out); for linear use `x:[0], y:[0]` / `x:[1], y:[1]`. Multi-dimensional
  values may use per-axis arrays.
- To **loop seamlessly**, make the last keyframe's value equal the first.

## Exposing editable properties (slots + the properties panel)

The app can render a live **properties panel** (text inputs and sliders) that
edit chosen values of the animation in real time. This rides on Skottie's
native **slot** feature — no re-parse, the change shows on the next frame.

To make a property editable, do two things:

**1. Declare a slot in the Lottie JSON.** Add a top-level `"slots"` object whose
keys are slot IDs, and point a property at one with `"sid"` instead of (or
alongside) an inline value. The slot's `"p"` holds the default, in the same
shape the property would normally take.

```jsonc
{
  "v": "5.7.0", "fr": 60, "ip": 0, "op": 90, "w": 512, "h": 512, "assets": [],
  "slots": {
    "ballColor": { "p": { "a": 0, "k": [0.231, 0.6, 1, 1] } },   // color: RGBA 0–1
    "ballSize":  { "p": { "a": 0, "k": 120 } }                    // scalar
  },
  "layers": [ /* ... */
    // in the fill:    "c": { "sid": "ballColor" }
    // in a scalar:    "s": { "sid": "ballSize" }
  ]
}
```

Slot types map to controls like this:

| Slot value | Control rendered |
|------------|------------------|
| scalar (a single number) | slider |
| color (RGBA 0–1)         | color picker |
| vec2 (`[x, y]`)          | two number inputs |
| text (a string)          | text input |

The app discovers slots automatically via Skottie's `getSlotInfo()` — you do
**not** list them anywhere else for them to work. The panel appears as soon as
the animation declares at least one slot.

**2. (Optional) Describe presentation in `public/controls.json`.** Slots only
expose an ID and type, not a label or a sensible slider range. The sidecar file
adds that. It is optional — missing entries fall back to the slot ID and a
generic 0–100 range. Like `lottie.json`, it hot-reloads on save.

```jsonc
{
  "controls": [
    { "sid": "ballColor", "label": "Ball color" },
    { "sid": "ballSize",  "label": "Ball size", "min": 40, "max": 240, "step": 1 }
  ]
}
```

- `sid` must match a slot ID exactly.
- `label` is the display name; `min`/`max`/`step` shape scalar sliders and vec2
  inputs (ignored for color/text).
- An entry whose `sid` matches no slot is simply ignored; a slot with no entry
  still renders with defaults.

## Before you finish — checklist

1. The file is valid JSON (no comments, no trailing commas). Validate with
   `node -e "JSON.parse(require('fs').readFileSync('public/lottie.json','utf8'))"`.
2. Every shape primitive/fill is inside a `"ty": "gr"` group's `it` array, and
   each group ends with a `"tr"` transform.
3. Top-level `op` and each layer's `op` cover the frames you animate.
4. Colors are 0–1 RGBA; positions/sizes are within the `w`×`h` composition.
5. Keyframe `s` values are arrays; loops repeat the first value at the end.
6. If the dev server is running, just save — it hot-reloads. Otherwise start it
   with `npm run dev`. A blank canvas (no error) → re-check the group wrapping.
