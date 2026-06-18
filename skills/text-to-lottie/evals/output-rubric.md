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

## Motion And Design Quality

- Frame `0`, midpoint, and `op - 1` are visually intentional.
- Final frame works as a still composition or poster frame.
- Complex diagram and product scenes include a concept pass before authoring:
  visual system, focal point, node/detail strategy, hierarchy, final-frame goal,
  and decoration purpose.
- Motion uses purposeful easing, readable staging, and clear choreography.
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

## Prompt Robustness Cases

- "Create a clean technical architecture diagram animation for a checkout flow."
- "Make a premium product explainer showing three steps and a final CTA."
- "Animate a technical SVG diagram with callouts, but keep it polished and
  presentation-ready."
- "Create a clean data pipeline Lottie without making it look like a dark cyber
  grid."
- "Create kinetic typography for 'fall fast, rise stronger'."
- "Make the word SNAP hit sharply, then settle."
