# Recipe: SVG Animation

Use for generic "animate this SVG", SVG-to-Lottie, vector illustration reveals,
and SVG assets that are not clearly logo/icon/UI/lower-third/product/diagram
work.

Always read `svg-compatibility.md` with this recipe.

## User-Language Aliases

- "turn this SVG into Lottie", "animate this vector", "SVG reveal"
- "make this illustration move", "draw this SVG", "bring this SVG to life"

## Defaults

- Keep output transparent unless the SVG is clearly a full-frame illustration or
  the user requests a background.
- Preserve the source composition and viewBox.
- Animate meaningful structure: groups, paths, strokes, accents, labels, or
  visual flow.
- Route technical diagrams, product promos, and effect-led requests to their
  specific recipes when those are the main deliverable.

## Presets

- `path-draw`: strokes draw on with trim paths, then settle/fill.
- `layer-unfold`: grouped elements reveal in depth or reading order.
- `fill-sweep`: solid regions receive a directional color or opacity reveal.
- `illustration-drift`: tiny grouped parallax/position motion after reveal.
- `morph-lite`: small shape/position changes, only when source paths are safe.

## Timing And Easing

- Simple SVG/icon: 45-90 frames.
- Complex illustration: 90-180 frames.
- Use trim-path pacing based on perceived length, not raw segment count.
- Use calm ease-out for assembly and avoid morphing unless geometry is safe.

## Ask Only When Needed

- Ask what part should move if the SVG is complex and no intent is given.
- Ask transparent vs full-frame only when source framing is ambiguous.
- Ask whether exact final fidelity matters if the prompt invites creative
  transformation.

## Construction Notes

- Inspect groups and paths before deciding animation units.
- Resolve SVG styling and transforms enough that Lottie output is predictable.
- Use masks/reveals for complex filled shapes; use trim paths for clean strokes.
- Avoid path morphing unless paths have compatible vertex structure.
- Expose slots for accent color, background color when used, and optional scale
  or emphasis controls when useful.

## Common Failure Modes

- Final frame no longer matches the source.
- Hidden CSS styling disappears after conversion.
- Fill rules or masks break holes/intersections.
- Arbitrary path fragments move without a readable idea.

## Acceptance Checks

- Final frame matches the SVG source visually unless creative change was asked.
- No holes, clips, masks, gradients, or intersections break in Skottie.
- The animation has a clear reading order or reveal logic.
- Transparent/full-frame background policy is intentional.
