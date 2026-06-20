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
- Establish type hierarchy, line composition, and final-frame balance before
  adding accents or effects.
- Choose the type voice deliberately: serif for human/editorial authority,
  grotesque for product/function, monospace for technical labels, expressive
  display type when the word itself is the subject.
- Convert text to paths when exact font rendering matters or font availability
  is uncertain.

## Category Distinctions

- Title card: strong final still, clear hierarchy, restrained reveal.
- Quote reveal: reading pace, line rhythm, attribution after the main idea.
- Editorial text reveal: polished line breaks, masks, layout, and negative
  space.
- Handwritten/path reveal: natural stroke order, trim timing, and ink hold.
- Kinetic typography: type-driven choreography tied to meaning, not only a text
  entrance.
- Text morph: compatible paths only; otherwise use mask, crossfade, replacement,
  or layout change.
- Text-on-path or camera-follow text: typography remains primary; use camera
  scene motion as secondary only when framing movement is requested.

## Typography Roles

- Anchor text stabilizes the composition and may stay still or move subtly.
- Support text provides context and should usually be calmer than the main
  phrase.
- Active text carries the main motion idea. For kinetic typography, choose at
  least one active word or phrase before authoring.

## Kinetic Quality Bar

- For "kinetic typography", animate at least one major word or phrase with
  meaning-driven position, scale, masking, layout change, framing/camera
  movement, rhythmic timing, or emphasis.
- Slide, fade, scale, and stagger are valid tools, but uniform entrance motion
  applied to every word is not enough for kinetic typography.
- Preserve readability. Kinetic type needs contrast between active motion and
  stillness; not every word should compete for attention.
- Let semantic words influence motion: `fall` drops, `rise` lifts, `snap` hits
  sharply, `break` separates, `flow` travels smoothly, `soft` eases gently,
  `heavy` lands with weight, `loud` expands or hits harder, `quiet` recedes,
  `fast` compresses timing, and `slow` holds longer.

## Presets

- `title-clean`: restrained title reveal with strong final still.
- `editorial-reveal`: calm mask reveal, line rhythm, slight position settle.
- `quote-lift`: quote enters by line, attribution follows after a readable beat.
- `kinetic-word-choreography`: one active word drives layout, scale, or rhythm.
- `kinetic-snap`: semantic active word hits sharply, support text stays calmer.
- `statement-mask`: line-by-line mask reveal with strong still-frame hierarchy.
- `word-per-beat`: one word or phrase owns each beat, then resolves to a held
  lockup.
- `typewriter-clean`: stepped character/word reveal with a soft cursor/accent.
- `handwritten-trace`: path reveal following writing direction, subtle ink hold.
- `text-morph-lite`: crossfade/mask/position replacement unless paths are safe.
- `text-path-follow`: text follows a curve or camera-framed path while readable.
- `numeric-pop`: numbers scale or count in, supporting labels settle softly.

## Timing And Easing

- Short title/card: 60-120 frames.
- Longer quote: 90-180 frames.
- Typewriter/handwritten: pace by readability, not constant path length alone.
- Use ease-out for entrances, stepped timing for typewriter, and low overshoot
  only for kinetic/playful styles.
- Kinetic typography: build around phrase-level beats; active words can move
  more strongly while anchor/support text holds the composition.

## Ask Only When Needed

- Ask for exact text if absent.
- Ask for brand/font constraints when source context is missing and typography is
  central.
- Ask whether output should be full-frame or transparent if ambiguous.

## Construction Notes

- Break text into semantic lines, words, or glyph groups based on the preset.
- Keep line lengths short enough for the canvas and target use.
- Keep one focal line or phrase dominant; support text should clarify rather
  than compete.
- Use masks or shape reveals for premium title work; use opacity/position
  stagger for simpler captions.
- Use per-line mask reveals and meaning-based line breaks for statement/title
  work. Avoid random per-letter motion unless the prompt asks for it.
- For kinetic typography, define anchor, support, and active text roles before
  keyframing.
- Avoid applying the same opacity/position/scale entrance to every word. Offset
  properties and timing according to meaning, reading order, and emphasis.
- Use lines, dots, dividers, glows, and ornaments only when they guide reading
  order, reveal text, emphasize a word, support rhythm, or reinforce semantic
  motion.
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
- Kinetic typography is only a uniform word-by-word entrance.
- Every word moves equally, so no active phrase leads the viewer.
- Decorative accents fill space but do not guide reading or meaning.
- Type accents or effects arrive before the hierarchy and line breaks are
  resolved.
- Typeface choice does not match the message tone.

## Acceptance Checks

- First and final frames are clean still compositions.
- Text is readable at all inspected frames.
- Staggering supports meaning instead of making words hard to follow.
- Kinetic prompts have an active word or phrase with semantic, type-driven
  motion.
- Anchor/support text stabilizes the composition and does not compete with the
  active phrase.
- Accents support reading rhythm, reveal, emphasis, or semantic motion.
- Type hierarchy, line breaks, and optical placement pass before effects are
  considered polish.
- If type is the subject, each major beat is readable as a strong still frame.
- No text touches unsafe edges or clips during motion.
