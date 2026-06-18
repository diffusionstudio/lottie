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
- Motion uses purposeful easing, readable staging, and clear choreography.
- UI and state feedback feel responsive rather than slow or theatrical.
- Product and promo scenes keep the product/message as the hero.
- Effects support the primary message and do not become noise.
- Typography is legible and not clipped.
- SVG-derived shapes preserve viewBox, fills, holes, masks, and intersections.
- Settled SVG-derived Lottie frames are compared against the source artwork.
- Final output feels production-ready rather than placeholder-like.
