# Recipe: Loaders, Icons, And State Feedback

Use for loaders, spinners, progress loops, badges, simple icons, success/error
states, warning alerts, empty states, and compact status animations.

## User-Language Aliases

- "loading spinner", "looping loader", "progress ring", "animated icon"
- "success check", "error x", "warning triangle", "complete animation"
- "toast icon", "empty state", "status badge", "done indicator"

## Defaults

- Transparent background.
- Loop cleanly for loaders/spinners/progress.
- Play once and settle for success/error/warning states unless looping is asked.
- Keep geometry crisp and readable at small sizes.
- Prefer one primitive or icon idea repeated with phase offsets over unrelated
  moving parts.
- Add only one charm gesture, such as blink, bounce, pulse, or draw-on, when it
  fits the brand tone.

## Presets

- `orbital-loader`: rotating dots or marks with seamless timing.
- `stroke-trace`: icon stroke draws, holds briefly, then resets or loops.
- `pulse-badge`: compact scale/opacity pulse around a status symbol.
- `check-complete`: path draw plus short settle for success states.
- `error-shake`: brief x/alert emphasis, controlled and not frantic.
- `warning-pulse`: triangle/badge reveal with restrained attention pulse.
- `scan-progress`: linear or radial progress sweep with controlled repetition.
- `phase-dots`: repeated dots or marks animate with offset timing and a matched
  loop seam.

## Timing And Easing

- State feedback: 30-75 frames with a stable final pose.
- Loaders: 60-120 frame seamless loops.
- Use continuous linear only for rotational/progress loops.
- Use short ease-out or low-bounce spring-like settles for success states.

## Ask Only When Needed

- Ask loop vs one-shot only if the request is ambiguous.
- Ask target size if the icon must fit a specific UI slot.
- Ask brand/accent color if no source style exists.

## Construction Notes

- Use trim paths for strokes, checks, rings, and circular loaders.
- Match first and last frames for loops.
- Engineer loop seams with identical first/last state or a period-locked cycle.
- Avoid excessive detail below small-icon sizes.
- Expose slots for accent color, stroke width, and background only if full-frame.

## Common Failure Modes

- Loop seam is visible.
- Repeated parts move in lockstep and feel mechanical.
- Icon becomes unrecognizable during motion.
- State animation feels too playful for an error/warning.
- Stroke caps or joins render differently than expected.

## Acceptance Checks

- Loop seam is invisible when looping.
- Repeated motion uses phase offset unless lockstep is intentional.
- Icon remains recognizable during motion.
- Timing feels useful, not frantic.
- Transparent output has no unwanted background layer.
