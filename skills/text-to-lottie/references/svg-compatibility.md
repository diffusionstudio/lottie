# SVG Compatibility

Use this reference whenever the source artwork is SVG or the output depends on
SVG-like path behavior.

## Prevention-First Intake

- Inspect the `viewBox`, width, height, coordinate origin, groups, masks,
  gradients, style tags, and text before animating.
- Preserve the intended viewBox and scale the Lottie composition around it.
- Inline or resolve CSS-dependent styling. Avoid external classes, inherited
  styles, web fonts, CSS variables, and filters that Skottie may not match.
- Keep layer names meaningful when splitting paths for animation.
- Compare the settled Lottie frame against the source SVG before finishing.

## Geometry Cleanup

- Resolve nested transforms into path/group coordinates when practical.
- Expand strokes to fills when stroke joins, caps, dash behavior, or scaling may
  render differently in Skottie or downstream players.
- Keep strokes as strokes when trim-path drawing is the animation itself, but
  verify cap/join behavior.
- Flatten unnecessary groups, but keep semantically useful groups for animation
  control.
- Avoid fragile boolean intersections when a simple separate path stack is
  visually equivalent.

## Fill Rules And Compound Paths

- Watch self-intersections, compound paths, and holes. Even-odd and non-zero
  fill rules can differ after conversion.
- Prefer clean compound paths with explicit intended holes.
- If a shape relies on overlapping subpaths to cancel areas, consider splitting
  or rebuilding it into simpler visible shapes.
- Verify holes at frame `0`, during reveal, and at the settled frame.

## Masks, Clips, Gradients, And Effects

- Use masks and clip paths only when needed; simple grouped shapes are safer.
- If a mask moves, check all masked frames for popping or disappearing content.
- Prefer simple linear/radial gradients. Provide solid fallback shapes if the
  look is critical.
- Rebuild SVG filters, shadows, blurs, and blend modes as simple Lottie shapes
  or restrained effect layers where possible.
- Align crisp icon geometry to avoid fuzzy fractional-pixel edges.

## Text And Morphing

- Convert SVG text to paths when exact typography matters or font availability is
  uncertain.
- Keep text editable only when the player text-slot behavior is the main need.
- Avoid path morphing unless source and target paths have compatible vertex
  structure and direction.
- For incompatible morphs, use masks, crossfades, staggered replacement, or
  layer assembly instead.

## Renderer Differences

- Browser SVG, Skottie, and downstream web playback may disagree on
  intersections, masks, gradients, strokes, and unsupported effects.
- Verify in Skottie as the source of truth for this project.
- For website export risk, prefer explicit fills, simple masks, local assets,
  and fewer renderer-specific features.

## Animation Strategy

- For logos, separate mark, wordmark, accents, and background policy.
- For icons, animate semantic parts rather than arbitrary path fragments.
- For diagrams, preserve reading order and trace paths in the direction users
  should understand them.
- For generic SVGs, first identify what should move: path drawing, reveal masks,
  layer assembly, color transition, or transform choreography.
- Keep transparent output by default unless the user requests a full-frame
  background.

## Verification

- Compare the settled Lottie frame against the source SVG at matching scale.
- Check frame `0`, the main action frame, and the settled frame.
- Look for holes filling incorrectly, clipped strokes, gradient jumps, masked
  areas disappearing, and intersections rendering differently than the source.
