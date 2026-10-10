# Motion Taste

Use this reference when choosing pacing, easings, staging, or animation style.

## Contents

- Principles
- Timing Defaults
- Easing Anchors
- Choreography
- Reveal Grammar
- Chapterization And Transition Grammar
- Motion Economy
- Typography Choreography
- Data And Figure Motion
- Camera, Parallax, And Scene Motion
- Path Reveals And Loops
- Loop And Generative Motion
- Style Presets
- Render-Aware Motion
- Final Motion Review
- Checks

## Principles

- Stage motion in readable beats: anticipation, action/reveal, settle.
- Give the primary subject the clearest timing. Secondary elements should support
  it, not compete.
- Match easing to intent. Functional UI needs speed and clarity; brand motion can
  hold longer; playful effects can overshoot more.
- Avoid linear interpolation unless mechanical motion is the intent.
- Avoid generic easing where every property shares the same timing by default.
  Use locked timing for rigid/UI-stable motion, and offset opacity, position,
  scale, or trim timing only when it improves choreography.

## Timing Defaults

- UI microinteractions: 12-30 frames at 60 fps.
- State feedback icons: 30-75 frames, usually with a short hold.
- Logo marks: 45-120 frames depending on complexity.
- Lower thirds: 45-90 frames in, optional 30-60 frames out.
- Typography reveals: 45-150 frames depending on text length.
- Product/social promos: 90-180 frames for one clear message.
- Loaders/icons: loop cleanly over 60-120 frames.

## Easing Anchors

Known-good defaults to **derive from**, not a closed preset list. Anchors
describe motion **behavior** (entering, settling, traveling, exiting, looping,
cut companion), not layer type: a logo, hero, title, card, or accent each picks
by what it is doing this beat. Bezier is `x1,y1,x2,y2`.

| anchor | behavior | cubic-bezier | feel |
| --- | --- | --- | --- |
| `entrance-sharp` | entering, mask-wipe decel | `.20,.75,.34,.94` | fast in, soft land |
| `settle-soft` | settling, count-up landing, logo lockup | `.00,.65,.51,.99` | deep ease-out, no bounce |
| `kinetic-ui` | expressive small state move (toggle, accent) | `.85,.46,.14,.53` | lively — not every UI move |
| `expressive-pop` | active kinetic word, brand flourish | `.94,.75,.34,.94` | fast-out + soft settle (overshoot opt-in) |
| `travel-balanced` | object travel, camera, state-to-state | `1.00,.49,.00,.55` | S-curve ease-in-out |
| `exit-accelerate` | exiting, hard-cut companion | `1.00,.02,.54,.42` | slow start, fast end |
| `travel-cut` | only interrupted / masked / cut-before-settle | `.15,.85,.95,.05` | fast-slow-fast, never settles |

- Derive, don't invent: start from the nearest anchor and adjust one quality —
  acceleration, coast, landing softness, exit speed, overshoot. Reach for a new
  curve only when no anchor fits.
- Per-property orchestration: choose *how* properties coordinate, not just which
  easing each uses — match the method to the motion character. *Locked*
  (start/end together) for UI, panels, buttons, mechanical/synced state.
  *Lead/follow* (one property leads a few frames, another follows) for
  logo/hero/organic, where position, scale, rotation, opacity, masks, trim, or
  number changes may use different curves, start/end frames, or durations.
  *Primary/secondary* (one property carries the motion, others support subtly).
  *Early-opacity/late-settle* (opacity resolves fast while position/scale keeps
  settling, for readability). *Single-property overshoot* (only scale or
  rotation overshoots, position stays controlled).
- Hierarchy: only the focal element gets the strongest personality
  (`expressive-pop`, overshoot, snap); support uses quieter anchors
  (`settle-soft`, `travel-balanced`).
- Distance/duration: large travel → smoother acceleration and more time (don't
  snap); tiny UI → short, not theatrical; camera → calmer than the objects in it.
- Typography: support `settle-soft`; active word `expressive-pop`/`entrance-sharp`.
  Count-up: near-linear digits, `settle-soft` landing. Mask-wipe: `entrance-sharp`,
  revealed content `settle-soft`.
- Hard cut / jump cut / chapter transition: outgoing `exit-accelerate` (or
  `travel-cut` for long travel), cut before it settles; pair with a motion-masked
  swap when continuity matters — see Chapterization And Transition Grammar.
- Loop reset: match first/last velocity; use a visible reset only via
  `exit-accelerate`+cut.
- Overshoot: small, premium-off by default. Prefer a settle-back keyframe (past
  the target, then ease back — Skottie-safe); segment `i.y` ~1.08 to 1.2 is
  the compact alternative. Both `i` and `o` belong to the segment's start
  keyframe; see `lottie-spec-map.md` for the placement example.
- Also useful: anticipate (pull slightly opposite before a fast reveal),
  steps/holds (typewriter, counters, scans, technical beats), and continuous
  linear (rotations, scanners, progress loops, mechanical seams).

## Choreography

- Decide the lead element, then delay supporting elements by 2-8 frames for
  compact UI and 4-14 frames for expressive scenes.
- Stagger from the meaningful origin: first, center, last, path direction, or
  focal point.
- Let opacity often start after movement begins and finish before the settle.
- Do not animate every property on every layer. Stillness gives motion contrast.
- Scrub around the settle. The final 10-20 percent of motion should feel
  intentional, not like a numerical drift.

## Reveal Grammar

- Use build, settle, hold as the default reveal spine. The hold is where the
  message or brand registers.
- Reveal in reading or importance order. Hero/focal subject lands first;
  labels, stats, metadata, and support arrive after.
- Stagger repeated items by about 3-6 frames for compact motion or 50-80 ms for
  scene-level beats.
- Prefer mask-wipes, marker sweeps, trim-path draw-ons, and purposeful cuts over
  uniform opacity fades for premium scenes.
- One scene or beat should have one main flourish. Too many reveals in the same
  beat weakens hierarchy.

## Chapterization And Transition Grammar

- Gate: if the prompt carries more than one idea (long text, lists, multiple
  stats, timeline, before/after, problem/solution, quote+proof, walkthrough,
  recap/story, multi-language or repeating variations), split it into chapters
  instead of cramming one scene. A single-purpose beat (logo lockup, one CTA, one
  stat, legal/read-critical, calm hero that must settle) stays one beat and lands.
- Give each chapter one readable job, and let the main message get a coast or
  hold before any seam.
- Choose each transition by seam purpose — preserve continuity, create contrast,
  reset rhythm, or land a point — not at random. A transition is chapter role +
  timing + direction + cut point + masking + easing, not easing alone.
- For dense/multi-part prompts, read
  `references/chapterization-transition-grammar.md` for the full when/when-not,
  roles, structure modes, transition grammar, selection, cut-on-action mechanics,
  easing-anchor support, and guardrails.

## Motion Economy

- Motion should reinforce the same hierarchy as the final frame: focal subject
  strongest, support calmer, accents lowest priority.
- Animate fewer properties when that produces a clearer read.
- If movement makes the scene feel busy, crowded, or unfocused, simplify the
  visual structure before adding more motion.
- Effects, camera moves, and staggers should never compensate for weak layout.
  Revise the composition first.

## Typography Choreography

- Treat kinetic typography as phrase performance, not uniform text entrance.
- Assign anchor, support, and active text. Let the active word or phrase carry
  the strongest motion while support text stays calmer.
- Use semantic easing and spacing: sharp words can hit harder, soft words can
  settle gently, heavy words can land lower, and flowing words can travel
  continuously.
- Offset position, scale, mask, opacity, and layout timing so words relate to
  the phrase instead of sharing identical keyframes.
- Preserve reading order. Expressive motion should make the phrase clearer, not
  harder to parse.

## Data And Figure Motion

- Animate data by its own logic: bars grow from baseline, lines draw left to
  right, segments widen to proportion, dots populate, rings nest or emanate,
  and Sankey-like flows route from source to target.
- Count figures up with baked keyframes, tabular numerals, and an ease-out
  settle. Let labels or units arrive after the number resolves.
- Sync labels to geometry. A point label should resolve as the line reaches it;
  a bar value should count while the bar grows.
- Use mask-wipes for insight headlines and trim paths for hairlines, axes,
  connectors, rules, and chart strokes.
- Serious data needs calm ease-out and no bounce. Small pops are acceptable only
  for badges, consumer/wellness warmth, or bold social panels.

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

## Loop And Generative Motion

- Repeated fields need phase offsets by index, distance, row, or path position.
  Lockstep pulsing reads mechanical unless the prompt asks for it.
- Engineer loop seams with identical first/last frames, integer wave cycles,
  closed rotations, wrapped drift, or recycled emanation rings.
- Give ambient loops one conceptual beat: pulse, mirror, morph, inversion,
  density build, or recovery to order.
- Use one repeated primitive and one main animated property where possible.
- Rich motion is licensed when the animated abstract element carries the
  message. Keep surrounding type, UI, and support calmer.
- Morph the same objects between states instead of spawning unrelated new
  objects when continuity is important.

## Style Presets

- `premium-settle`: slower reveal, low overshoot, elegant final ease.
- `kinetic-snap`: fast stagger, strong contrast, crisp settles.
- `soft-interface`: small distances, low overshoot, short duration.
- `technical-trace`: trim paths, precise timing, minimal flourish.
- `ambient-loop`: no visible seam, constant perceived energy.
- `playful-pop`: larger scale contrast, friendly overshoot, quick recovery.
- `data-confirm`: insight headline, geometry reveal, synced count-up, calm hold.
- `phase-field`: repeated primitive with baked offsets and seamless loop.

## Render-Aware Motion

- Bake counters, particle offsets, orbit math, physics, and expression-like
  systems to keyframes before relying on Skottie.
- Fake velocity with offset duplicate layers instead of motion blur.
- Treat blur, bloom, glass, chrome, dither, true 3D, and displacement as
  renderer-risky. Approximate with vector shapes, stacked tonal fills, or baked
  raster assets.
- Path morphs require compatible vertex structures. If not safe, use masks,
  replacements, or crossfades.
- Cap dense fields and verify performance. Repeater-based fields cannot assume
  independent per-instance animation.

## Final Motion Review

- Scrub playback. First and last frames alone are not enough to judge timing,
  stagger, readability, or settle quality.
- Inspect key beat frames: frame `0`, early reveal or first meaningful beat,
  midpoint, settle or near-final, `op - 1`, loop seam if looping, and semantic
  beats where a number resolves, word lands, logo lockup forms, chart finishes
  drawing, CTA appears, or camera move settles.
- Check beat order: the focal subject should lead, support should follow, and
  accents should not steal the read.
- Check stagger origin and spacing: repeated elements should begin from the
  meaningful source, path direction, reading order, or focal point.
- Check timing and easing: entrances should feel intentional, not uniform;
  settles should land cleanly without drift, snap-back, or accidental float.
- Check readability during motion: text, data, icons, and UI states should be
  parseable at the moments they matter.
- If motion feels busy or hides weak layout, simplify the visual structure or
  reduce animated properties before adding more choreography.

## Checks

- Midpoint should communicate what is happening, not only look like transition
  blur.
- The final settle should land in the strongest composition, not only stop on a
  valid frame.
- Loop start/end should be invisible unless a reset is intentional.
- Secondary motion should never distract from the requested message.
- If an animation feels generic, adjust stagger origin, easing intent, or the
  final settle before adding more effects.
- For kinetic typography, reject motion where every word uses the same entrance
  timing and property changes unless the prompt asks for a minimal reveal.
