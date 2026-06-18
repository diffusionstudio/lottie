# Recipe: Product, Launch, And Social Promo

Use for product launches, feature announcements, app/product card reveals,
release notes visuals, social promos, and short marketing-style Lottie scenes.

## User-Language Aliases

- "product launch animation", "feature announcement", "new feature promo"
- "social post animation", "app screenshot reveal", "launch card"
- "show off this product", "announcement banner", "release animation"

## Defaults

- Treat the product/feature as the hero.
- Use full-frame composition unless the user asks for a transparent asset.
- Keep copy short and readable; animate one message clearly.
- Expose slots for headline, subhead, accent color, and background color when
  useful.

## Presets

- `hero-card-reveal`: product card/screenshot enters, headline follows.
- `feature-spotlight`: one feature area highlights with label/callout.
- `launch-burst`: title/product reveal with restrained celebratory accents.
- `social-loop`: short looping promo with clear first/final frame.
- `update-stack`: multiple feature chips/cards stagger into place.

## Timing And Easing

- Single announcement: 90-150 frames.
- Multi-beat product scene: 150-240 frames.
- Use premium ease-out for hero elements and small staggers for supporting
  copy/chips.
- Keep any loop subtle enough for social/product contexts.

## Ask Only When Needed

- Ask for exact headline/subhead if missing.
- Ask for product asset/screenshot if the prompt expects one but none exists.
- Ask aspect ratio only if platform is unclear and it changes composition.

## Construction Notes

- Build around a hero layer, copy group, accent layer, and optional background.
- Use camera scene motion as secondary when the prompt asks for pan/zoom/tour.
- Use visual effects as secondary for glow, glass, sweep, or burst treatments.
- Avoid stuffing too many feature points into one short scene.

## Common Failure Modes

- Looks like a generic ad rather than the user's product.
- Too much copy appears too fast.
- Effects compete with the product.
- Final frame lacks a clear offer or feature focus.

## Acceptance Checks

- Product/feature is unmistakably the hero.
- Copy is readable and not overcrowded.
- Final frame works as a poster frame.
- Motion feels polished, not like a template dump.
