# Output Rubric

Use this rubric when maintaining or evaluating the skill. Do not load it during
normal animation work.

## Activation And Routing

- The skill triggers for Lottie/Bodymovin, Skottie, logo animation, SVG
  animation, typography, lower thirds, loaders, icons, state feedback, UI
  microinteractions, diagrams, product promos, scene/camera motion, visual
  effects, and scene-debug prompts.
- The skill does not trigger for unrelated design critique, SVG optimization
  without animation, After Effects advice, video/GIF-only work, or abstract
  motion theory.
- The agent reads `player-contract.md` for scene work.
- Mixed prompts choose one primary recipe by deliverable and only add relevant
  secondary references for source format or treatment.
- The agent avoids opening the whole reference library.

## Scene Correctness

- The scene is written to `public/projects/<project>/<scene-N>/lottie.json`.
- Existing user scenes are not overwritten accidentally.
- JSON parses successfully.
- The official Skottie player renders the scene.
- Assets are colocated with the scene and referenced by bare filename.

## Controls And Background

- Full-frame scenes have a `bgColor` slot and matching `controls.json` entry.
- Logos, icons, loaders, overlays, lower thirds, and SVG-derived assets default
  to transparent output unless the user asks for a background.
- Slots are type-compatible with their referenced properties.
- Controls expose useful edits without cluttering the panel.
- Fixed prompt text is authored as vector/shape artwork without first spending
  time on native text-slot experiments.
- Native text slots are reserved for explicitly editable copy after font asset
  loading has been implemented and verified in the local player.

## Motion And Design Quality

- Frame `0`, midpoint, and `op - 1` are visually intentional.
- First, midpoint, and final frames are the minimum still-frame check, not the
  full motion review.
- Motion work also inspects playback and pinned key beat frames: early reveal,
  midpoint, settle or near-final, final frame, loop seam if looping, and semantic
  beats where text, data, logo, chart, CTA, or camera motion resolves.
- Final frame works as a still composition or poster frame.
- Design quality is a completion blocker. A scene that parses and renders still
  fails if hierarchy, spacing, color restraint, object necessity, or final-frame
  composition is weak.
- Complex diagram and product scenes include a concept pass before authoring:
  visual system, focal point, node/detail strategy, hierarchy, final-frame goal,
  and decoration purpose.
- Designed scenes use an object budget: one focal subject, one support layer,
  and one accent system unless the concept clearly needs more.
- The agent chooses an appropriate taste mode instead of treating "premium" as
  one style: restrained product, institutional data, bold social, expressive
  primitive, playful character, or ambient field.
- Motion uses purposeful easing, readable staging, and clear choreography.
- Motion reinforces the same hierarchy as the final frame.
- UI and state feedback feel responsive rather than slow or theatrical.
- Product and promo scenes keep the product/message as the hero.
- Effects support the primary message and do not become noise.
- Typography is legible and not clipped.
- Kinetic typography uses type-driven, semantic choreography rather than a
  uniform entrance applied to every word.
- Kinetic typography assigns anchor, support, and active text roles so the
  active word or phrase carries the main motion.
- Simpler title cards, quote reveals, and editorial text reveals remain valid
  when the prompt asks for restrained text animation.
- SVG-derived shapes preserve viewBox, fills, holes, masks, and intersections.
- Settled SVG-derived Lottie frames are compared against the source artwork.
- Final output feels production-ready rather than placeholder-like.

## Design Judgment Blockers

- Fail outputs that render correctly but have no clear focal subject.
- Fail outputs that rely on first/last-frame inspection when the animation has
  meaningful motion, stagger, camera movement, looping, or semantic beat changes.
- Fail crowded compositions, even when individual details appear meaningful.
- Fail scenes where support elements compete with the main message.
- Fail weak final frames that feel like accidental stopping points.
- Fail typography with accidental line breaks, unstable placement, weak
  hierarchy, or crowded spacing.
- Fail mixed-size text rows aligned on a shared baseline instead of cap-center,
  single runs not optically centered in their container, or stacked title/subline
  blocks with tight or arbitrary vertical spacing.
- Fail color/effect overload where accents compete or "premium" means more
  glow, glass, gradient, or noise.
- Fail product/content scenes where believability comes from density rather
  than coherent state, workflow, copy, and hierarchy.
- Fail decorative color that does not teach category, state, comparison, brand,
  or hierarchy.
- Fail scenes where hierarchy depends on cards, shadows, glow, or chrome before
  scale, weight, brightness, spacing, and timing have been resolved.
- Fail an unnecessary outer framing card or border around a stat group or column
  set when whitespace and alignment would carry it.
- Fail dividers that use more than one color or weight (for example a title rule
  that does not match the column rules).
- Fail two stacked near-black or near-white tints that read as a muddy surface
  instead of one clean background tone.
- Fail "premium", "clean", or "minimal" prompts answered by adding chrome (a
  card, border, divider, or second surface tint) instead of by subtracting.
- If design QA fails, the agent should simplify and revise before calling the
  task complete.

## Data And Chart Quality

- Data/stat scenes choose a clear archetype: hero figure, KPI grid, stat-card
  triad, comparison chart, progress card, dashboard metric, social proof, or
  heat map.
- Headline states the insight, not only the topic.
- Values are direct-labeled; viewers should not need axis or legend decoding in
  a short Lottie.
- Figures count up with baked keyframes, tabular numerals, and labels/units
  arriving after the number resolves.
- Row label and value are cap-center aligned and optically centered in the pill,
  card, or row; row and block spacing follow a consistent vertical rhythm.
- Chart geometry reveals by chart logic: bars grow, lines draw, segments widen,
  dots populate, rings nest or emanate, and labels sync to geometry.
- Serious data uses calm ease-out and no bounce.
- Chartjunk, decorative 3D, rainbow series, and incoherent dashboard density are
  blockers unless the prompt explicitly asks for them.
- Stat triads default to borderless figures or even self-contained cards
  separated by whitespace: no outer framing card, one surface tone, and at most a
  single hairline of one color between equal columns.

## Motion And Loop Quality

- Repeated elements use reading-order stagger or phase offsets unless lockstep
  is intentional.
- Reveals follow build, settle, hold, with support arriving after the hero.
- Beat order, stagger origin, timing, easing, settle/hold, camera/framing, and
  readability are reviewed by scrubbing playback, not only by checking static
  endpoints.
- Loops have engineered seams: matched endpoints, integer cycles, wrapped drift,
  closed rotation, or recycled emanation.
- Loop seams are inspected when applicable; semantic beat frames are inspected
  when numbers resolve, words land, logo lockups form, charts complete, CTAs
  appear, or camera moves settle.
- Ambient/generative motion has one conceptual beat and remains subordinate
  unless the field itself is the deliverable.
- Motion reveals value and meaning; it does not animate chrome to compensate for
  weak composition.

## Render And Construction Risk

- No live expressions are assumed in Skottie; counters, particles, orbits,
  physics, noise, and expression-like systems are baked.
- Path morphs use compatible vertex structures or a safer mask/replacement
  strategy.
- Blur, bloom, glass, chrome, dither, true 3D, displacement, and frame-by-frame
  smears are approximated with vector-safe layers, simplified, or baked as
  assets.
- Dense fields are capped or rasterized when needed for performance.
- Brand-specific marks, protected palettes, UI chrome, logos, headshots, and
  compliance badges are supplied, placeholdered, or omitted; they are not
  restyled or copied from references.

## Anti-Generic Quality

- Fail diagrams that default to dark grid, blue arrows, empty rounded cards,
  monospaced labels, or decorative circles unless the prompt explicitly asks for
  that style.
- Fail product scenes where the product signal is missing, too small, blank, or
  replaceable with any generic app.
- Fail effects that exist only as decoration and do not reveal, emphasize,
  transition, show state, or communicate material.
- Pass "clean", "technical", "premium", "modern", and "polished" prompts only
  when those terms produce concrete design decisions, not stock visual tropes.
- Prefer content-rich nodes, balanced topology, strong type hierarchy, optical
  alignment, and intentional negative space.
- Prefer fewer stronger objects over many meaningful-looking details.
- Prefer color quarantine, semantic accents, warm neutrals, hairlines, tonal
  depth, and whitespace before adding decorative effects.

## Single-Line Vectorization Quality

- The final visible artwork preserves the source fill geometry.
- The derived driver path is not treated as the visible artwork unless requested.
- The centerline/matte path is contour-derived when possible, not visually
  guessed or stroked from the original outline.
- Coverage-only validation is not accepted: a matte that covers the shape while
  the path is off-center or mis-routed fails.
- Stable matte stroke width is preferred; no animated stroke-width compensation
  for poor path placement.
- No default round caps/joins for sharp polygonal logos.
- When a debug overlay is requested, it is separate from the final animation.
- For path-driven mask reveals, reject simple directional wipes
  (vertical/horizontal/diagonal line or rectangle crossing the shape) when the
  prompt asks for a source-derived or shape-following reveal; accept a wipe only
  when the user explicitly requested a directional reveal.
- The main animation is still completed: wordmark/logo fidelity, composition,
  timing, Lottie structure, and export quality.

## Prompt Robustness Cases

- "Create a clean technical architecture diagram animation for a checkout flow."
- "Make a premium product explainer showing three steps and a final CTA."
- "Animate a technical SVG diagram with callouts, but keep it polished and
  presentation-ready."
- "Create a clean data pipeline Lottie without making it look like a dark cyber
  grid."
- "Create kinetic typography for 'fall fast, rise stronger'."
- "Make the word SNAP hit sharply, then settle."
- "Create a premium product feature animation without decorative filler."
- "Make a clean technical workflow explainer with only meaningful visual
  detail."
- "Create a polished title scene with strong hierarchy and restrained color."
- "Create a text-heavy pricing comparison card with fixed Inter typography and
  exact Skottie rendering."
- "Animate a product UI flow that feels believable, not crowded."
- "Animate these three KPIs into a premium stat card."
- "Create a premium KPI stat card with three metrics and restrained motion."
  (Regression: a terse "premium" prompt must subtract chrome, not add a framing
  card, mismatched dividers, or stacked muddy tints.)
- "Create a pitch-slide chart showing revenue growing 11% month over month."
- "Make a generative loader from one repeated dot primitive."
- "Create a clean ambient background behind a headline, no generic particles."
