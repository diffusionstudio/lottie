# Player Contract

Use this reference before creating, editing, fixing, or verifying any scene.

## Setup

Use the official player project. Do not verify through a custom page,
`lottie-web`, or another renderer.

If the player project is missing:

```bash
npx degit diffusionstudio/lottie my-animation
cd my-animation
npm install
npm run dev
```

The dev server defaults to `http://localhost:3030`. If the project already
exists, use its existing setup and start `npm run dev` when browser verification
is needed.

## Scene Layout

Every renderable scene lives under `public/projects/`:

```text
public/
  canvaskit.wasm
  projects/
    <project-slug>/
      <scene-N>/
        lottie.json
        controls.json
        <image files>
```

- `lottie.json` is required. A scene without it is ignored.
- Project and scene slugs become URL segments: `/<project>/<scene>`.
- Scene ordering comes from the trailing number in `scene-<N>`.
- Put image assets next to the scene and reference them by bare filename in
  `assets[].p`, for example `"p": "logo.svg"`.

## Target Scene Policy

- Use a target scene named by the user.
- If editing what is on screen, read the active project/scene from
  `GET /__context`.
- If creating new work without a target, create a new project/scene or the next
  available `scene-<N>`.
- Overwrite `public/projects/main-project/scene-1/lottie.json` only when it is
  still the untouched placeholder. If unsure, create a new scene.

Treat `main-project/scene-1` as safe to overwrite only if it has one simple
background layer, no meaningful assets, no custom controls, and a generic name
such as `Scene 1 - 512x512`.

## Live Editor Behavior

- The scene tree watches folders and updates live.
- Editing an existing `lottie.json` may require reload or re-navigation.
- Slot edits in the UI are written back through `/__scenes/lottie`, so re-read
  source before applying another edit.

## Context Endpoint

Use the context endpoint instead of guessing:

```bash
curl -s http://localhost:3030/__context
```

It reports the project tree, active project/scene, frame, total frames, fps, and
last-modified times.

## Frame Pinning

Inspect exact frames by navigating to:

```text
http://localhost:3030/<project>/<scene>?frame=<N>
```

`?frame=N` seeks and pauses on load. Use frame `0`, midpoint, and `op - 1` for
new scenes; use focused frames for small edits. The canvas is
`<canvas id="main-canvas">`.

## Slots And Controls

Use slots for user-editable values that should appear in the player properties
panel. The player discovers slots automatically through Skottie.

Top-level slot pattern:

```json
{
  "slots": {
    "accentColor": { "p": { "a": 0, "k": [0.2, 0.5, 1, 1] } },
    "scaleAmount": { "p": { "a": 0, "k": 100 } }
  }
}
```

Reference a slot with `sid` on a compatible property:

```json
{ "c": { "sid": "accentColor" } }
```

Add `controls.json` next to `lottie.json` when labels or numeric ranges matter:

```json
{
  "controls": [
    { "sid": "accentColor", "label": "Accent color" },
    { "sid": "scaleAmount", "label": "Scale", "min": 40, "max": 160, "step": 1 }
  ]
}
```

Slot value types map to controls:

| Slot value | Control |
| --- | --- |
| number | slider |
| RGBA array `0..1` | color picker |
| two-number array | two number inputs |
| string text slot | text input |

Slot types must match the properties that reference them.

## Text Rendering Fast Path

- Native Lottie text layers and text slots are not reliable in this player by
  default. CanvasKit exposes text slots, but text still needs font data at
  Skottie animation creation time.
- The current scene loader passes discovered image assets to
  `MakeManagedAnimation`; it does not discover or pass scene font files.
- Local CanvasKit verification showed native text renders transparent without a
  font blob and renders once the matching font blob is supplied.
- For fixed prompt text, do not spend time trying native text first. Author text
  as vector/shape artwork immediately.
- Use native text slots only when editable text is explicitly required and font
  asset loading has been implemented and verified in the official player.

## Vector Text Vertical Placement

Vector text has no line-height or auto-centering. You place every glyph by hand,
so compute the baseline from the font's cap height instead of eyeballing it.

- Derive cap height from the font, not a guessed number:
  `capEm = sCapHeight / unitsPerEm`, then `cap = capEm * size`. If the font lacks
  the metric, fall back to `capEm ≈ 0.7` (use x-height `≈ 0.52em` for all-lowercase
  runs).
- To vertically center a run in a container whose center is `cy`:
  `baseline = cy + cap / 2`.
- For a row holding two runs of different sizes (for example a small label and a
  large value), center each run on the shared center line using its **own** cap
  height. A shared baseline makes the smaller run sink below the larger one.

## Background Policy

- Full-frame standalone compositions should include a visible background layer
  with a `bgColor` slot and a `controls.json` entry.
- Transparent-by-default outputs include logos, icons, loaders, overlays, lower
  thirds, and SVG-derived assets unless the user asks for a background.
- Do not add an opaque rectangle just to fill the canvas.
- If a transparent animation needs preview contrast, use the player/canvas
  environment for verification instead of baking unwanted pixels into the JSON.

## Verification

- Validate JSON before browser verification.
- Confirm the scene appears in `/__context`.
- Inspect pinned frames in the browser. New scenes need frame `0`, midpoint, and
  `op - 1`.
- Fix blank canvas, missing assets, unstyled shapes, wrong layer order, bad
  easing, cropped content, text overflow, and SVG artifacts before finishing.

## Final Review Passes

Run lightweight render, design, and motion reviews before calling a scene
complete. First, midpoint, and final frames are the minimum still-frame check,
not a substitute for motion review.

- Render review: validate JSON, confirm `/__context`, verify assets load, and
  inspect pinned frames in the official player.
- Design review: inspect frame `0`, midpoint, `op - 1`, and any major semantic
  still. Check focal point, placement, spacing, hierarchy, typography, color
  roles, object necessity, and final-frame strength.
- Text alignment review: inspect text rows zoomed in, not only at full-frame. A
  few pixels of vertical misalignment are invisible at composition scale. Confirm
  that mixed-size runs sharing a row are cap-center aligned, that single runs are
  optically centered in their container, and that stacked blocks (such as a
  headline and its subline) follow an intentional vertical rhythm.
- Motion review: scrub playback and inspect key beat frames: frame `0`, early
  reveal, midpoint, settle or near-final, `op - 1`, loop seam if looping, and
  semantic beats where a number resolves, word lands, logo lockup forms, chart
  finishes drawing, CTA appears, or camera move settles.
- Check beat order, stagger origin, timing, easing, settle/hold, loop seam,
  camera/framing, and readability during motion.
- If design or motion review fails, simplify and revise before finishing. A
  valid render is not enough.
