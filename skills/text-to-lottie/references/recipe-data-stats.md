# Recipe: Data, Stats, And Charts

Use for KPI cards, stat reveals, big-number scenes, pitch-slide charts,
dashboard metrics, progress/goal cards, social-proof rows, data-derived
textures, and simple chart animations.

## User-Language Aliases

- "animate these KPIs", "stat card", "big number reveal", "metric animation"
- "pitch chart", "growth chart", "bar chart", "line chart", "data slide"
- "dashboard metric", "progress card", "results row", "social proof"

## Defaults

- Choose one data archetype before authoring. Do not improvise a layout for a
  number.
- The headline should state the insight; the chart or figure confirms it.
- Use one semantic accent against neutral, two values of one hue, or one
  saturated hue per card.
- Count up figures with baked keyframes and tabular numerals unless the prompt
  asks for static text.
- Use slotted background for full-frame data scenes; transparent only when the
  user asks for overlay/asset output.

## Archetype Picker

- Hero figure: one emotional metric, extreme figure-to-label contrast.
- KPI grid or stat-card triad: several parallel proofs using one repeated
  template.
- Results rows: hairline label/value rows for credible outcomes.
- Comparison chart: one accent-vs-neutral bar, line, strip, or scale graphic.
- Progress/goal card: actual vs target, goal line, weekly bars, or ring nesting.
- Dashboard metric mock: one hero metric, one chart, and light supporting state.
- Social proof: outcome-tied logo/name row, metric, and attribution.
- Data-derived texture: heat map, mosaic, or dot/ring field where the pattern
  is data, not decoration.

## Timing And Easing

- Compact stat card: 60-120 frames.
- Multi-card/grid/chart reveal: 120-210 frames.
- Use calm ease-out and no bounce for finance, research, enterprise, and serious
  data.
- Small pops are acceptable for badges, consumer/wellness warmth, or bold social
  panels.
- Support text arrives after the figure or geometry resolves.

## Construction Notes

- Bake counters and odometer rolls. Do not rely on live expressions in Skottie.
- Use tabular or fixed-width numeral shapes so digits do not jitter.
- Sync counts to geometry: line reaches point, bar reaches height, segment
  reaches width, or ring reaches target.
- Direct-label values on points, bars, cards, rows, or panels. Avoid axis
  decoding when the scene is short.
- Use trim paths for lines, hairlines, axes, callout arrows, rules, and flows.
- Use masks or clip reveals for rounded bars/cards so radii do not distort.
- Use slots for insight/headline text, key values, accent color, background
  color, and optional chart colors when useful.
- Placeholder third-party logos, compliance marks, or headshots unless the user
  supplied rights-safe assets.

## Common Failure Modes

- Title names the topic but not the insight.
- Static number appears with a fade instead of a count-up.
- Values require axis/legend decoding.
- Rainbow chart color decorates instead of teaching.
- Too many metrics compete in one beat.
- Serious data uses bouncy or theatrical motion.
- Dashboard mock looks dense but the state is incoherent.
- Rounded bars/cards stretch because they were scaled instead of revealed.

## Acceptance Checks

- The data archetype matches the metric's job.
- The headline states the point and the data confirms it.
- Figures are direct-labeled, counted up, and readable.
- Chart geometry and numeric labels resolve together.
- Palette uses semantic color, not decorative color.
- Final frame works as a clear still data slide.
- Motion adds comprehension and does not overdramatize serious data.
- Counters, masks, trim paths, and rounded reveals are Skottie-safe.
