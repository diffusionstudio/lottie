---
name: text-to-lottie
description: Create, edit, or fix Lottie/Bodymovin JSON animations for the local Skia Skottie player. Use for text-to-Lottie, SVG/logo/type animation, loaders/icons, state feedback, UI microinteractions, lower thirds, diagrams, data/stat/chart animations, product promos, scene/camera motion, visual effects, scene edits, slots/controls, and Skottie debugging.
---

# Text To Lottie

Author production-ready Lottie JSON for the official local Skia Skottie player.
The deliverable is a renderable scene in the player, not isolated JSON.

## Operating Model

- Use the official player project and verify in Skia Skottie. Do not hand-roll a
  custom viewer or switch renderers for verification.
- Keep the skill portable across Agent Skills clients. Avoid host-specific
  commands, command modes, or orchestration conventions in skill instructions.
- Prefer fewer questions and stronger defaults. Ask only when a decision changes
  the output materially, such as transparent vs full-frame background, brand
  constraints, target format, or supplied source assets.
- Prioritize clean, intentional, professional motion over merely satisfying the
  literal prompt.

## Reference Loading

This `SKILL.md` is the thin control plane. Load only one-level references that
match the task. Do not open the whole reference library.

Always read `references/player-contract.md` before creating, editing, fixing, or
verifying a scene. If a routed reference is unavailable, continue using the
inline rules in this file.

| User intent | References to read when present |
| --- | --- |
| Any new/edit/fix Lottie scene | `references/player-contract.md` |
| JSON structure, keyframes, slots, shapes, assets | `references/lottie-spec-map.md` |
| Logo animation | `references/recipe-logo.md`, `references/motion-taste.md`, `references/design-taste.md` |
| Typography, title, quote, text reveal | `references/recipe-typography.md`, `references/design-taste.md`, `references/motion-taste.md` |
| Lower third, name tag, caption bar, overlay | `references/recipe-lower-thirds.md`, `references/design-taste.md`, `references/motion-taste.md` |
| Loader, icon, spinner, badge animation | `references/recipe-loaders-icons.md`, `references/motion-taste.md` |
| Success, error, warning, completion, empty state | `references/recipe-loaders-icons.md`, `references/design-taste.md`, `references/motion-taste.md` |
| UI microinteraction | `references/recipe-ui-microinteractions.md`, `references/design-taste.md`, `references/motion-taste.md` |
| Generic "animate this SVG" or SVG-to-Lottie | `references/recipe-svg-animation.md`, `references/svg-compatibility.md`, `references/motion-taste.md` |
| Camera follow, pan, zoom, parallax, scene motion | `references/recipe-camera-scene-motion.md`, `references/design-taste.md`, `references/motion-taste.md` |
| Diagram, technical line animation, callout, flow trace | `references/recipe-diagram-technical.md`, `references/design-taste.md`, `references/motion-taste.md` |
| Data, stats, KPIs, charts, metrics, dashboard figures | `references/recipe-data-stats.md`, `references/design-taste.md`, `references/motion-taste.md` |
| Product launch, feature announcement, social promo | `references/recipe-product-promo.md`, `references/design-taste.md`, `references/motion-taste.md` |
| Glow, glass, metal, gradient, fill, bubble/burst effects | `references/recipe-visual-effects.md`, `references/design-taste.md`, `references/motion-taste.md` |
| SVG input inside logo/icon/UI/lower-third work | The task recipe plus `references/svg-compatibility.md` |
| Starter brief or reusable project direction | `references/recipe-starter-projects.md`, `references/design-taste.md`, `references/motion-taste.md` |

For mixed prompts, choose one primary recipe from the main deliverable, then add
secondary references for source format or visual treatment. Examples: SVG logo
with glow uses logo as primary plus SVG compatibility and visual effects;
product launch with pan/zoom uses product promo plus camera scene motion;
technical SVG diagram tracing uses diagram/technical plus SVG compatibility;
kinetic title with glass sweep uses typography plus visual effects.

## Workflow

1. Route the task using the table above. Read only the relevant references that
   exist.
2. Locate the official player project and target scene. If editing, re-read the
   current `lottie.json` from disk because the UI can write slot edits back to
   source.
3. Decide the background policy before authoring.
4. Write or update `public/projects/<project>/<scene-N>/lottie.json` and, when
   useful, `controls.json`.
5. Validate JSON, run or reuse the dev server, inspect exact frames with
   `?frame=N`, and fix render/design/motion issues before finishing.

## Inline Rules

- Scene files live at `public/projects/<project>/<scene-N>/lottie.json`.
- Use a target named by the user, the active scene from `GET /__context`, or a
  new safe scene. Overwrite `main-project/scene-1` only if it is still the
  untouched placeholder; otherwise create a new scene.
- Full-frame standalone compositions should include a visible background layer
  with a `bgColor` slot and `controls.json` entry.
- Transparent-by-default outputs include logos, icons, loaders, overlays, lower
  thirds, and SVG-derived assets unless the user asks for a background.
- Include top-level `v`, `fr`, `ip`, `op`, `w`, `h`, `nm`, `assets`, and
  `layers`. Treat `op` as exclusive.
- Use purposeful easing and staging. Avoid defaulting to linear motion.
- Use slots for important editable values and add `controls.json` labels/ranges
  when they improve the properties panel.
- For SVG input, preserve the viewBox, normalize styling, watch fill rules and
  intersections, and verify the result in Skottie.
- Native Lottie text/text slots are unreliable in this player unless font blobs
  are supplied to Skottie. The current scene loader discovers image assets only,
  so author fixed prompt text as vector/shape text immediately. Use native text
  slots only when editable text is explicitly required and font loading has been
  implemented and verified.

## Verification

Before finishing:

1. Confirm the file path is
   `public/projects/<project>/<scene-N>/lottie.json`.
2. Validate JSON:

   ```bash
   node -e "JSON.parse(require('fs').readFileSync('public/projects/<project>/<scene-N>/lottie.json','utf8'))"
   ```

3. Confirm the official player is running and the scene appears in
   `GET /__context`.
4. Inspect pinned frames in the browser. For new scenes, check frame `0`,
   midpoint, and `op - 1`.
5. Confirm the background policy matches the use case.
6. Check for blank canvas, missing assets, unstyled shapes, wrong layer order,
   bad easing, awkward timing, cropped content, text overflow, and visible SVG
   artifacts.
7. Finish only when the animation renders cleanly and feels intentional.

## Maintenance Evals

Do not read eval files during normal animation work. Use them only when testing
or changing this skill:

- `evals/trigger-prompts.json`
- `evals/routing-prompts.json`
- `evals/reference-loading-prompts.json`
- `evals/output-rubric.md`
