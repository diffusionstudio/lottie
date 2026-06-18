# Recipe: Visual Effects

Use for glass/metal/shader-like sweeps, glow, gradient and fill effects, light
passes, playful bubbles, bursts, sparkles, confetti-like accents, and effect-led
animations.

This recipe is usually secondary. Use it as primary only when the effect itself
is the main deliverable.

## User-Language Aliases

- "add a glow", "glass sweep", "metal shine", "gradient wave"
- "bubble burst", "playful pop", "sparkle", "shine pass"
- "fill effect", "liquid reveal", "make it feel premium"

## Defaults

- Keep the base composition readable without the effect.
- Use effects to reveal, emphasize, or transition, not as constant decoration.
- Prefer simple Lottie shapes, gradients, masks, and opacity layers over
  renderer-specific filters.
- Preserve transparent output when used with logos, icons, overlays, or SVG
  assets.

## Presets

- `glass-sweep`: translucent angled pass across text, logo, or product.
- `metal-sheen`: narrow highlight sweep with quick fade and subtle contrast.
- `soft-glow`: restrained halo pulse behind the hero subject.
- `gradient-fill`: color/fill transition moving across a shape or word.
- `bubble-burst`: playful circles expand/fade around a success or reveal.
- `spark-accent`: tiny highlights appear around a final settle.

## Timing And Easing

- Sweeps: 30-75 frames, usually faster than the main reveal.
- Glow pulses: 45-90 frames, low amplitude.
- Bursts: 20-45 frames, quick expansion and fade.
- Use ease-out on expansion, linear or near-linear on light passes, and avoid
  long lingering effects unless ambient motion is requested.

## Ask Only When Needed

- Ask whether the desired feel is premium, playful, technical, or magical if the
  prompt only says "make it cool".
- Ask whether the effect should loop if it sounds ambient.
- Ask for brand color constraints when effects change the palette.

## Construction Notes

- Keep effect layers separate and named.
- Clip/sweep effects with masks only when necessary and verify all frames.
- Use additive-looking color choices cautiously; Skottie/browser output can vary.
- Limit effects on text until legibility is confirmed.

## Common Failure Modes

- Effect overwhelms the message.
- Glow or sweep clips at canvas edges.
- Gradient/fill effects become muddy.
- Playful bursts feel random because they are not tied to an action beat.

## Acceptance Checks

- Effect supports the primary recipe's message.
- Final frame is clean after the effect passes.
- No effect layer creates unintended background pixels.
- Skottie render matches the intended intensity and clipping.
