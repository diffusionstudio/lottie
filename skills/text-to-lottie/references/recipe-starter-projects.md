# Recipe: Starter Projects

Use when the user wants to start from a type of animation rather than provide a
specific scene. Starters are briefs and defaults, not prebuilt JSON templates.

## User-Language Aliases

- "start a project for X", "make me a template", "give me a starting point"
- "create a reusable animation pack", "make a launch animation from scratch"

## Starter Types

- `brand-logo-pack`: transparent logo reveal, optional short/long variants.
- `kinetic-title-card`: full-frame typography with slotted background/accent.
- `broadcast-lower-third`: reusable transparent overlay with name/title slots.
- `product-ui-feedback`: compact UI success/error/loading microinteractions.
- `icon-loader-set`: small transparent loopable icons and loaders.
- `svg-illustration-reveal`: SVG-derived vector reveal with compatibility pass.
- `product-launch-card`: feature/product announcement with title, media, accent.
- `diagram-explainer`: technical line trace with labels and callouts.
- `data-stat-card`: KPI/stat/chart scene with count-up and direct labels.
- `brand-card-system`: reusable layout skeleton, type system, and accent rule.
- `parallax-scene`: layered pan/zoom or camera-follow composition.
- `ambient-field`: two-tone background from one anchor plus one derived field.
- `generative-loader`: one repeated primitive with phase offsets and clean loop.
- `effects-led-promo`: title/product scene with glow, glass, sweep, or burst.

## Briefing Defaults

If the user does not provide details, choose sensible defaults:

- Canvas: 512x512 for icons/logos/loaders, 1920x1080 for broadcast/title/promo
  work, or match the source SVG/viewBox when supplied.
- Frame rate: 60 fps.
- Duration: 60-120 frames for compact work, 120-180 frames for title/promo/story
  work.
- Background: transparent for reusable overlays/assets, slotted background for
  full-frame compositions.
- Controls: expose only values the user is likely to edit.

## Ask Only When Needed

- Ask for exact copy/assets if the starter cannot be meaningful without them.
- Ask intended placement/platform only when size/background policy is unclear.
- Ask whether the starter should include an exit animation for overlays.

## Acceptance Checks

- The starter produces a concrete scene direction, not a generic list of ideas.
- The selected primary recipe is clear before JSON authoring starts.
- The background policy and output size match the intended use.
- Any starter with stats, charts, loops, particles, or fields has a Skottie-safe
  construction plan before authoring.
