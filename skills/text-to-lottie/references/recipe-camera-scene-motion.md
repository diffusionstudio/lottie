# Recipe: Camera And Scene Motion

Use for camera-following motion, pan, zoom, parallax, layered scene movement,
hero pushes, product screenshot tours, and animated scene framing.

## User-Language Aliases

- "pan across this", "zoom into the product", "camera follow"
- "parallax scene", "Ken Burns style", "move through the interface"
- "push in", "pull back", "follow the path", "scene motion"

## Defaults

- Choose one dominant camera idea: push, pull, pan, follow, or parallax.
- Keep the main subject readable throughout the move.
- Use full-frame background policy unless the result is a transparent asset.
- Treat camera motion as attention direction, not decoration.

## Presets

- `premium-push`: slow push-in with subtle foreground/background separation.
- `guided-pan`: horizontal or vertical pan revealing steps in order.
- `focus-follow`: camera follows one hero object or path.
- `layered-parallax`: foreground/midground/background move at different rates.
- `product-tour`: screenshot/product card moves through 2-3 feature beats.

## Timing And Easing

- Compact camera move: 60-120 frames.
- Product or scene tour: 120-240 frames.
- Use smoother easing than object motion; abrupt camera stops feel cheap.
- Hold briefly after the camera arrives so the final message lands.

## Ask Only When Needed

- Ask which subject to follow if the scene has multiple heroes.
- Ask output size/platform if framing depends on aspect ratio.
- Ask whether text must remain readable throughout the move when uncertain.

## Construction Notes

- Prefer grouped/parented transforms over animating every child independently.
- Keep scale changes modest unless the move is the concept.
- Counter-animate text or labels if camera motion makes them hard to read.
- Use parallax only when layered depth exists or can be built cleanly.

## Common Failure Modes

- Camera crops the hero subject or text.
- Parallax layers move without a clear depth hierarchy.
- Motion sickness from too much scale/position change.
- Final frame feels like an accidental crop.

## Acceptance Checks

- The viewer's eye follows the intended subject.
- Important text remains readable or resolves quickly.
- First and final frames are clean compositions.
- Camera motion enhances the message instead of hiding weak layout.
