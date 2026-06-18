# Recipe: Typography Animation

Use for titles, title cards, quotes, kinetic typography, text reveals, captions,
handwritten/path reveals, text morphs, counters, and short message-led scenes.

## User-Language Aliases

- "animate this headline", "make a title card", "kinetic type", "quote reveal"
- "handwritten text", "draw this word on", "typewriter", "morph this text"
- "add text for X", "caption this", "animated number/stat"

## Defaults

- Ask for exact copy only if missing.
- Default to transparent background for overlay/title elements; use a slotted
  background for full-frame title cards.
- Prefer readable hierarchy over novelty.
- Convert text to paths when exact font rendering matters or font availability
  is uncertain.

## Presets

- `editorial-reveal`: calm mask reveal, slight tracking/position settle.
- `kinetic-snap`: staggered word or line entries with crisp overshoot.
- `typewriter-clean`: stepped character/word reveal with a soft cursor/accent.
- `quote-lift`: quote fades/slides in by line, attribution follows after a beat.
- `handwritten-trace`: path reveal following writing direction, subtle ink hold.
- `text-morph-lite`: crossfade/mask/position replacement unless paths are safe.
- `numeric-pop`: numbers scale or count in, supporting labels settle softly.

## Timing And Easing

- Short title/card: 60-120 frames.
- Longer quote: 90-180 frames.
- Typewriter/handwritten: pace by readability, not constant path length alone.
- Use ease-out for entrances, stepped timing for typewriter, and low overshoot
  only for kinetic/playful styles.

## Ask Only When Needed

- Ask for exact text if absent.
- Ask for brand/font constraints when source context is missing and typography is
  central.
- Ask whether output should be full-frame or transparent if ambiguous.

## Construction Notes

- Break text into semantic lines, words, or glyph groups based on the preset.
- Keep line lengths short enough for the canvas and target use.
- Use masks or shape reveals for premium title work; use opacity/position
  stagger for simpler captions.
- Use path morphing only with compatible path structures; otherwise use
  replacement, reveal, or crossfade.
- Expose useful slots: text content when supported, accent color, background
  color for full-frame cards, and timing/scale only when user editing matters.

## Common Failure Modes

- Text becomes unreadable mid-animation.
- Line breaks feel accidental.
- The final frame is visually weaker than the motion.
- Handwritten reveals move against the natural stroke direction.
- Text morphs warp because path structures are incompatible.

## Acceptance Checks

- First and final frames are clean still compositions.
- Text is readable at all inspected frames.
- Staggering supports meaning instead of making words hard to follow.
- No text touches unsafe edges or clips during motion.
