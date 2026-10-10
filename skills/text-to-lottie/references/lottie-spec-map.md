# Lottie Spec Map

Use this reference when authoring or debugging Lottie JSON structure. It is a
curated map of the upstream spec for this project, not a replacement for it.

Upstream specs:

- https://github.com/lottie/lottie-spec/tree/main/docs/specs

## Core Structure

- Top-level documents should include `v`, `fr`, `ip`, `op`, `w`, `h`, `nm`,
  `assets`, and `layers`.
- `ip` is inclusive and `op` is exclusive. `ip: 0`, `op: 90`, `fr: 60` renders
  frames `0..89`.
- Prefer a meaningful top-level `nm`; the player shows it as the canvas label.
- Keep assets local to the scene folder and reference images by bare filename in
  `assets[].p`.

## Properties And Keyframes

- Static properties use `{ "a": 0, "k": value }`.
- Animated properties use `{ "a": 1, "k": [keyframes] }`.
- Keyframes must be sorted by ascending `t`.
- For a non-hold segment, put both `o` and `i` on the keyframe that starts
  that segment. They describe leaving its value and arriving at the next
  keyframe's value. The final keyframe does not need either handle.
- Scalar animated values use arrays in keyframes, for example `"s": [45]` for
  rotation or opacity.
- Color values are RGB or RGBA floats in `0..1`; opacity values are `0..100`.
- Easing handle `x` values are `0..1`; `y` values may exceed that range for
  controlled overshoot.
- A cubic-bezier `(x1,y1,x2,y2)` uses the start keyframe's **outgoing**
  handle `o:{x:[x1],y:[y1]}` and **incoming** handle
  `i:{x:[x2],y:[y2]}` on that same keyframe. For example, this scalar
  property animates from 0 to 100 over frames 0–30:

  ```json
  { "a": 1, "k": [
    { "t": 0, "s": [0], "o": { "x": [0.2], "y": [0.75] },
      "i": { "x": [0.34], "y": [0.94] } },
    { "t": 30, "s": [100] }
  ] }
  ```

  See the upstream [keyframe easing specification](https://lottie.github.io/lottie-spec/latest/specs/properties/#keyframe-easing).
- Overshoot: prefer a short settle-back keyframe past the target; the compact
  alternative is pushing the segment's `i.y` above 1. Anticipation: push the start
  `o.y` below 0.

## Layers

- Shape layers use `ty: 4`.
- Image layers reference entries in `assets`.
- Layer visibility is `ip <= frame < op`.
- Parent transforms compose through `parent` references. Avoid cycles.
- Mattes, masks, precomps, and time remap are valid but more fragile; use them
  only when simpler shape/layer structure will not produce the result.

## Shapes

- Group related shapes with `ty: "gr"` and put the group transform
  `ty: "tr"` last in the group's `it` array.
- Styles apply to shapes that precede them within the current scope. A shape
  without an applicable fill or stroke will not render.
- Shapes render in reverse stack order inside groups. Verify visually when layer
  order matters.
- Common primitive types:
  - rectangle: `ty: "rc"`
  - ellipse: `ty: "el"`
  - path: `ty: "sh"`
  - polystar: `ty: "sr"`
  - fill: `ty: "fl"`
  - stroke: `ty: "st"`
  - trim path: `ty: "tm"`
  - group transform: `ty: "tr"`

## Slots

- Define reusable values in top-level `slots`.
- Reference a slot with `sid` on a compatible property.
- Slot type is inferred from the slot value. Keep slot values compatible with
  every property that references that `sid`.
- If a property has a missing `sid`, renderers may fall back to the inline value
  or a type default. Do not rely on missing slots.

## Asset And Renderer Notes

- Image asset dimensions should match the expected `w` and `h` bounds when
  possible.
- SVG, masks, gradients, blend modes, and intersections can differ between
  renderers. Verify in Skottie.
- Avoid expressions or renderer-specific extensions unless the player explicitly
  supports them.
