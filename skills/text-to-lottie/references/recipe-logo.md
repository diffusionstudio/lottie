# Recipe: Logo Animation

Use for brand marks, wordmarks, logo reveals, intro/outro marks, app splash
marks, and SVG logo sources.

## User-Language Aliases

- "make my logo move", "logo reveal", "animate our mark", "app splash"
- "draw in this logo", "intro logo", "outro bug", "wordmark animation"

## Defaults

- Preserve brand shape, color, spacing, and final lockup unless asked to
  redesign.
- Default to transparent background.
- Ask for brand constraints only when the source does not imply them or when the
  user asks for a specific style.
- Read `svg-compatibility.md` when the logo source is SVG.

## Presets

- `mark-draw`: trim-path or mask reveal for line/outline logos.
- `assemble-settle`: pieces enter from nearby offsets and settle into the mark.
- `premium-fade`: soft opacity/scale reveal with subtle final polish.
- `accent-sweep`: brand accent passes across the mark, then disappears.
- `wordmark-cascade`: letters or word groups reveal in restrained stagger.
- `splash-pop`: compact app/splash reveal with a short hold.

## Timing And Easing

- Simple mark: 45-75 frames.
- Mark plus wordmark: 75-120 frames.
- Use low-overshoot premium settles unless the brand is explicitly playful.
- Keep final 10-20 frames stable enough for a clean logo lockup.

## Ask Only When Needed

- Ask for transparent vs full-frame if the intended use is unclear.
- Ask for brand adjectives only when the prompt gives no style direction.
- Ask whether to animate the full lockup or mark-only when both are present and
  the requested use is ambiguous.

## Construction Notes

- Separate mark, wordmark, and accent layers when possible.
- Keep final pose exactly aligned to the source logo.
- Avoid distorting brand geometry through squash, bounce, rotation, or blur-like
  effects unless the user requests that personality.
- If a background is requested, expose `bgColor` and keep logo colors editable
  only when useful.

## Common Failure Modes

- Final frame does not match the source lockup.
- Wordmark letter spacing drifts during or after motion.
- Decorative effects overpower brand recognition.
- Transparent output accidentally includes background pixels.

## Acceptance Checks

- Final frame is a faithful logo lockup.
- Transparent output contains no unintended background pixels.
- Motion feels brand-appropriate, not generic.
- SVG intersections, holes, masks, and strokes render correctly in Skottie.
