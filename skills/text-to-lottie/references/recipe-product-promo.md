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
- Avoid generic launch-card layouts when no product signal is visible.
- Follow the object budget in `design-taste.md`: hero first, support detail
  second, accent system last.
- Expose slots for headline, subhead, accent color, and background color when
  useful.

## Before Authoring

- Define the hero: product screenshot, feature surface, logo, object, or single
  message.
- Define the product signal: UI fragment, thumbnail, feature callout, data chip,
  branded shape, or recognizable workflow step.
- Define the final poster frame: headline position, product scale, CTA/message
  focus, and supporting detail.
- Define believability through coherent product state, workflow, copy, and
  hierarchy, not by adding more interface fragments.
- Decide which accents support the offer. Remove decoration that does not frame,
  reveal, or emphasize the product.

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
- Replace empty cards with screenshot detail, mini UI rows, product thumbnails,
  feature labels, metric chips, or branded placeholders with clear meaning.
- Use supporting chips or callouts only when they clarify the feature or offer.
- If the scene feels crowded, simplify the offer, enlarge the hero, or merge
  support details before adding more product chrome.
- Keep the final frame strong enough to work as a static product graphic.

## Common Failure Modes

- Looks like a generic ad rather than the user's product.
- Too much copy appears too fast.
- Effects compete with the product.
- Final frame lacks a clear offer or feature focus.
- Product surface is too small, blank, or abstract to identify.
- Empty cards and decorative accents make the scene feel template-like.
- Believable-looking UI detail is dense but does not explain the product.

## Acceptance Checks

- Product/feature is unmistakably the hero.
- The scene includes product-specific visual information, not only generic
  containers.
- Product/content detail is coherent and readable without becoming crowded.
- Copy is readable and not overcrowded.
- Final frame works as a poster frame.
- Motion feels polished, not like a template dump.
