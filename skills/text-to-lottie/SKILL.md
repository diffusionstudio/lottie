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
| Long text, multiple ideas, list/features/steps, timeline, before/after, problem/solution, quote+proof, recap/story, product walkthrough, multi-language variations, chapters, multi-beat sequence, episode, jump/hard cuts, transition grammar | `references/chapterization-transition-grammar.md`, `references/motion-taste.md` |
| Glow, glass, metal, gradient, fill, bubble/burst effects | `references/recipe-visual-effects.md`, `references/design-taste.md`, `references/motion-taste.md` |
| SVG input inside logo/icon/UI/lower-third work | The task recipe plus `references/svg-compatibility.md` |
| Single path, centerline, or one-stroke driver from a filled SVG/logo/icon; path-driven mask; path-driven reveal; shape-following mask; shape-following reveal; stroke matte or path-revealed matte; Trim Paths reveal from a filled mark; handwriting-style reveal; outline-to-centerline; or mask driver path | `references/single-line-vectorization.md`, plus the task recipe and `references/svg-compatibility.md` |
| Starter brief or reusable project direction | `references/recipe-starter-projects.md`, `references/design-taste.md`, `references/motion-taste.md` |
| Any "premium", "clean", "minimal", "modern", "sleek", or "polished" qualifier | `references/design-taste.md` (restraint defaults), plus the routed recipe |

For mixed prompts, choose one primary recipe from the main deliverable, then add
secondary references for source format or visual treatment. Examples: SVG logo
with glow uses logo as primary plus SVG compatibility and visual effects;
product launch with pan/zoom uses product promo plus camera scene motion;
technical SVG diagram tracing uses diagram/technical plus SVG compatibility;
kinetic title with glass sweep uses typography plus visual effects.

## Workflow

1. Route the task using the table above. Read only the relevant references that
   exist.
2. Locate the official player project and resolve the target scene using the
   target precedence below. Before editing, verify the resolved path is
   `public/projects/<project>/<scene-N>/lottie.json`; re-read that current file
   immediately before overwriting because the UI can write slot edits back to
   source.
3. Decide the background policy before authoring.
4. Write or update `public/projects/<project>/<scene-N>/lottie.json` and, when
   useful, `controls.json`. When `single-line-vectorization.md` is routed and the
   source is a nontrivial filled mark, perform the geometry sandbox pass before
   writing the production scene: copy and adapt the bundled
   `skills/text-to-lottie/scripts/centerline/derive_rails.py` (rail pairing — do not
   reach for raster skeletonization first), read its balance report and
   `route_decision`, and build a separate debug overlay to prove the route is
   centered.
5. Validate JSON, run or reuse the dev server, inspect exact frames with
   `?frame=N`, and fix render/design/motion issues before finishing.

## Inline Rules

### Design Defaults (always apply)

These few defaults are non-negotiable and apply to every designed scene. Load
`references/design-taste.md` for the full reasoning, especially for any
"premium", "clean", "minimal", "modern", or "card" prompt.

- Premium means subtract, not add. When a prompt says premium, clean, minimal,
  modern, sleek, or sophisticated, default to restraint: remove chrome before
  adding it. Premium is carried by scale, weight, brightness, spacing, and
  timing, never by cards, borders, dividers, shadows, glow, or stacked tints.
- Chrome/container budget is `0` by default. Do not add a framing card,
  container, border, or divider unless it does a job that whitespace and
  alignment cannot. Separate grids and columns with negative space and alignment
  first, a single hairline second, and a filled or bordered card last and only
  when explicitly warranted.
- One surface tone. Use one background tone. Do not stack two near-black or two
  near-white tints to fake a "surface"; it reads muddy. If a card surface must
  differ from the background, make it one deliberate step with a clear purpose.
- One divider treatment, one color. If dividers are truly needed, use one weight
  and one color for all of them, title rule and column rules included. Never use
  slightly different colors or weights per divider.

### Scene Rules

- Scene files live at `public/projects/<project>/<scene-N>/lottie.json`.
- Resolve target scenes by authority: an explicit file path wins; a browser URL
  route like `/<project>/<scene>` wins next; an already-known project/scene for
  the task wins next; otherwise create a new safe scene. Use `/__context` only
  for discovery, verification, or playback state unless the task explicitly says
  to edit what is currently on screen and no more specific target exists. Do not
  let `/__context.live` override a known file path, URL, or project/scene.
  Overwrite `main-project/scene-1` only if it is still the untouched placeholder;
  otherwise create a new scene.
- Full-frame standalone compositions should include a visible background layer
  with a `bgColor` slot and `controls.json` entry.
- Transparent-by-default outputs include logos, icons, loaders, overlays, lower
  thirds, and SVG-derived assets unless the user asks for a background.
- Include top-level `v`, `fr`, `ip`, `op`, `w`, `h`, `nm`, `assets`, and
  `layers`. Treat `op` as exclusive.
- Use purposeful easing and staging. Avoid defaulting to linear motion. Derive
  easing from the behavior-based anchors in `motion-taste.md` (chosen by motion
  behavior, focal element strongest); do not fall back to one uniform ease for
  every layer.
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

1. Confirm the intended target file path is
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
