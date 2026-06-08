---
name: text-to-lottie
description: Author a Lottie (Bodymovin) JSON animation that renders in a local skia player. Use whenever the user asks to create, generate, edit, or fix a Lottie animation, or asks for "an animation" to load.
---

# Authoring Renderable Lottie Files

This app renders Lottie with **Skia's Skottie** module (via `canvaskit-wasm`),
not the JS `lottie-web` runtime. Follow the rules below and
verify the result.

> This skill covers the *mechanics* — the JSON shape Skottie needs. For the
> *craft* (timing, easing, choreography, Disney animation principles), see
> LottieFiles' [motion-design skill](https://github.com/lottiefiles/motion-design-skill).
> Its guidance is in milliseconds; convert to frames with `frames = ms / 1000 * fr`.

## Setting up the project

The deliverable is not just `public/lottie.json`: the viewer should be set up
and the animation should be previewable in the browser. If the player project is
missing, create it; if it exists, install/update dependencies as needed, start
the dev server, and open the local preview URL for verification.

**Always use the official GitHub player project — never hand-roll a custom
viewer.** This skill's JSON rules (slots, the properties panel, the `?frame=`
URL controls, the Skottie wasm wiring) only hold inside that exact project. Do
**not** build your own HTML page, swap in `lottie-web`, or scaffold a bespoke
canvas setup — any of those will silently diverge from how this player renders
and the verification steps below won't apply. If the player project isn't
already on this machine, scaffold a fresh copy of the repo with **degit**:

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

### Required: a background-color control on every animation

**Every animation you produce must expose at least one control for the
background color.** The player does not paint a composition background of its
own, so add a full-composition background layer as the **last** entry in
`layers` (so it renders underneath everything), fill it with a slotted color,
and label that slot in `controls.json`. Use a rectangle the size of the
composition:

```jsonc
// last layer in `layers`:
{
  "ty": 4, "nm": "background", "ip": 0, "op": 120, "st": 0,
  "ks": { "o": { "a": 0, "k": 100 }, "p": { "a": 0, "k": [256, 256, 0] },
          "a": { "a": 0, "k": [0, 0, 0] }, "s": { "a": 0, "k": [100, 100, 100] },
          "r": { "a": 0, "k": 0 } },
  "shapes": [
    { "ty": "gr", "it": [
      { "ty": "rc", "p": { "a": 0, "k": [256, 256] },
        "s": { "a": 0, "k": [512, 512] }, "r": { "a": 0, "k": 0 } },
      { "ty": "fl", "c": { "sid": "bgColor" }, "o": { "a": 0, "k": 100 } },
      { "ty": "tr", "p": { "a": 0, "k": [0, 0] }, "a": { "a": 0, "k": [0, 0] },
        "s": { "a": 0, "k": [100, 100] }, "r": { "a": 0, "k": 0 },
        "o": { "a": 0, "k": 100 } }
    ] }
}
```

```jsonc
// slots:    "bgColor": { "p": { "a": 0, "k": [1, 1, 1, 1] } }   // default white
// controls: { "sid": "bgColor", "label": "Background color" }
```

Match the rectangle's `p`/`s` to your composition's `w`×`h`. This is in addition
to whatever other controls the animation exposes.

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

## Controlling playback from a browser agent

When you drive the page through a browser tool, **do not pixel-drag the slider or
hunt for the play button** — it's unreliable and you can't land on an exact
frame. Instead, **pin the frame in the URL** and read the canvas by its test id:

```
http://localhost:5173/?frame=60&paused=1
```

- `?frame=N` seeks to frame `N` on load and holds it paused, so the moment sits
  still for a screenshot. This is the right way to inspect a specific frame
  (e.g. "is the ball at the bottom at frame 60?"): open `?frame=60`, then
  screenshot.
- `?paused=1` starts paused (at frame 0, or at `frame` if also given);
  `?paused=0` forces autoplay even with a frame pinned.
- With no query params the animation autoplays as usual.

To change the inspected frame, navigate to a new URL (or just edit the query
string and reload). The canvas carries `data-testid="lottie-canvas"`, so a
browser tool can target it directly for screenshots. If the canvas is blank,
the page hasn't finished loading or the Lottie failed to parse (check the
on-screen error).

## Before you finish — checklist

1. The file is valid JSON (no comments, no trailing commas). Validate with
   `node -e "JSON.parse(require('fs').readFileSync('public/lottie.json','utf8'))"`.
2. Every shape primitive/fill is inside a `"ty": "gr"` group's `it` array, and
   each group ends with a `"tr"` transform.
3. Top-level `op` and each layer's `op` cover the frames you animate.
4. Colors are 0–1 RGBA; positions/sizes are within the `w`×`h` composition.
5. Keyframe `s` values are arrays; loops repeat the first value at the end.
6. A background-color control is present: a full-composition background layer
   (last in `layers`) with a slotted fill (e.g. `bgColor`) and a matching
   `controls.json` label.
7. The project is the official GitHub player (scaffolded via degit), not a
   custom/hand-rolled viewer.
8. If the dev server is running, just save — it hot-reloads. Otherwise start it
   with `npm run dev`. A blank canvas (no error) → re-check the group wrapping.
9. The player is running and the preview URL has been opened or reported. When a
   browser tool is available, verify the page shows a nonblank rendered
   animation before finalizing — pin a key frame via the URL (see "Controlling
   playback from a browser agent"), e.g. open `?frame=60&paused=1` and
   screenshot, rather than dragging the on-screen slider.
