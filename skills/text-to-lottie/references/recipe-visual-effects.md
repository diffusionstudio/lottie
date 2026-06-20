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
- Every effect needs a job: reveal, emphasis, transition, state feedback, or
  material behavior.
- Effects cannot compensate for weak hierarchy, spacing, or final-frame
  composition. Revise the base design first.
- Treat blur, glow, glass, chrome, dither, true 3D, and displacement as
  render-risky. Approximate with vector shapes or bake as assets.
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
- `ambient-field`: one anchor generates a quiet two-tone field or loop behind
  the main content.
- `phase-primitive`: one repeated primitive animates with offset timing and a
  seamless loop.

## Purpose Pairings

- Replace random glow with a focal halo tied to the hero subject, active state,
  or final settle.
- Replace loose circles with action-state feedback, ports, badges, particles
  from a burst origin, or remove them.
- Replace generic sweeps with masked material passes across a specific surface:
  logo edge, text face, card glass, product screen, or metal rim.
- Replace muddy gradients with semantic fills: progress, selection, heat,
  transfer, reveal, or brand color transition.
- Treat "premium" as restraint, crisp masking, material consistency, and a clean
  final frame, not more glow.
- Treat "technical" as precision, structure, and information clarity, not neon
  decoration.
- Prefer a field generated from the hero subject over generic particle scatter.

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
- For ambient/generative effects, use one anchor, one field, one ground, and one
  motion archetype.
- Bake particle, orbit, noise, and expression-like systems to keyframes.
- Use additive-looking color choices cautiously; Skottie/browser output can vary.
- Limit effects on text until legibility is confirmed.
- For typography, use accents or effects only when they support reading rhythm,
  text reveal, word emphasis, or semantic motion.

## Common Failure Modes

- Effect overwhelms the message.
- Glow or sweep clips at canvas edges.
- Gradient/fill effects become muddy.
- Playful bursts feel random because they are not tied to an action beat.
- Decorative effects hide weak composition instead of improving it.
- Premium treatment becomes a pile of glow, glass, and gradients.
- Render-only effects are promised as native vector Lottie behavior.
- Ambient field becomes generic wallpaper unrelated to the subject.
- Typography effects become filler instead of supporting the phrase.
- Effect layers make the object budget feel crowded.

## Acceptance Checks

- Effect supports the primary recipe's message.
- Effect purpose is identifiable even in the final frame.
- Base composition remains strong if the effect is removed.
- Ambient/generative effects are semantically anchored and loop cleanly.
- Typography effects help the viewer read or feel the phrase.
- Final frame is clean after the effect passes.
- No effect layer creates unintended background pixels.
- Skottie render matches the intended intensity and clipping.
