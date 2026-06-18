# Motion Taste

Use this reference when choosing pacing, easings, staging, or animation style.

## Principles

- Stage motion in readable beats: anticipation, action/reveal, settle.
- Give the primary subject the clearest timing. Secondary elements should support
  it, not compete.
- Match easing to intent. Functional UI needs speed and clarity; brand motion can
  hold longer; playful effects can overshoot more.
- Avoid linear interpolation unless mechanical motion is the intent.
- Avoid generic easing where every property starts and stops together. Offset
  opacity, position, scale, and trim timing so the motion has choreography.

## Timing Defaults

- UI microinteractions: 12-30 frames at 60 fps.
- State feedback icons: 30-75 frames, usually with a short hold.
- Logo marks: 45-120 frames depending on complexity.
- Lower thirds: 45-90 frames in, optional 30-60 frames out.
- Typography reveals: 45-150 frames depending on text length.
- Product/social promos: 90-180 frames for one clear message.
- Loaders/icons: loop cleanly over 60-120 frames.

## Easing Intent

- Clean ease-out: quick start, soft settle. Good for entrances and UI.
- Ease-in-out: balanced movement between two visible states.
- Back/overshoot: use sparingly for confirmation, playful icons, and brand
  accents; keep overshoot small for premium work.
- Anticipate: pull slightly opposite the main action before a fast reveal.
- Steps/holds: good for typewriter, counters, scans, and technical beats.
- Continuous linear: use for rotations, scanners, progress loops, and mechanical
  motion where a seam would be visible.

## Choreography

- Decide the lead element, then delay supporting elements by 2-8 frames for
  compact UI and 4-14 frames for expressive scenes.
- Stagger from the meaningful origin: first, center, last, path direction, or
  focal point.
- Let opacity often start after movement begins and finish before the settle.
- Do not animate every property on every layer. Stillness gives motion contrast.
- Scrub around the settle. The final 10-20 percent of motion should feel
  intentional, not like a numerical drift.

## Camera, Parallax, And Scene Motion

- Treat camera motion as the viewer's attention, not decoration.
- Use one dominant camera move: push in, pull out, pan, follow, or parallax.
- Move foreground, subject, and background at different rates only when it
  clarifies depth.
- Keep camera easing smoother than object easing. Abrupt camera stops feel cheap.
- Avoid pan/zoom that makes text unreadable or crops the hero subject.

## Path Reveals And Loops

- Path drawing should follow the natural reading or construction order.
- Keep trim-path speed visually even; short segments may need shorter durations.
- For handwriting/path reveals, add a slight follow-through or ink settle only
  if it suits the style.
- For loops, match first and last frames in position, opacity, color, and
  perceived velocity.

## Style Presets

- `premium-settle`: slower reveal, low overshoot, elegant final ease.
- `kinetic-snap`: fast stagger, strong contrast, crisp settles.
- `soft-interface`: small distances, low overshoot, short duration.
- `technical-trace`: trim paths, precise timing, minimal flourish.
- `ambient-loop`: no visible seam, constant perceived energy.
- `playful-pop`: larger scale contrast, friendly overshoot, quick recovery.

## Checks

- Midpoint should communicate what is happening, not only look like transition
  blur.
- Loop start/end should be invisible unless a reset is intentional.
- Secondary motion should never distract from the requested message.
- If an animation feels generic, adjust stagger origin, easing intent, or the
  final settle before adding more effects.
