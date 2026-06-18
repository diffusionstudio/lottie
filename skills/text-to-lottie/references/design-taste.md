# Design Taste

Use this reference when composition, typography, layout, color, or brand polish
matters.

## Concept Pass

Before authoring complex diagram or product scenes, define the visual system,
focal point, node/detail strategy, hierarchy, final-frame composition goal, and
the purpose of any decoration. If those choices are not clear, the design will
usually drift toward generic shapes.

- Translate "clean", "technical", or "premium" into a specific system: editorial
  light, product UI, schematic minimal, branded system map, dense dashboard
  detail, or presentation-grade explainer.
- Choose the main still image first. Motion should reveal and clarify that
  composition, not rescue a weak final frame.
- Decide which elements carry meaning. Decoration should either group content,
  show state, direct attention, reinforce brand, or be removed.

## Composition Defaults

- Start with a clear hierarchy: primary subject, supporting detail, accent.
- Compose the first and final frames as intentional still designs.
- Use visual center, not only mathematical center. Round shapes, tall marks, and
  asymmetric logos may need optical nudging.
- Keep safe margins around text, logos, and overlays. Leave extra room for
  motion overshoot and blur-like effects.
- Use negative space as an active design element; do not fill every empty area.
- Align to a simple grid, baseline, or optical axis. Break alignment only when
  the concept clearly benefits.

## Anti-Generic Replacements

- Do not default to dark grids, blue arrows, empty cards, monospaced labels, or
  decorative circles for technical work. Use a chosen visual system with clear
  information hierarchy.
- Replace empty rounded cards with meaningful node details: icons, mini UI
  fragments, step numbers, labels, thumbnails, status marks, metrics, or data
  hints.
- Replace arbitrary accent circles with ports, badges, state indicators,
  handles, highlights, or remove them.
- Replace decorative grid wallpaper with structural alignment, section bands,
  subtle dividers, real axes, or whitespace.
- Replace generic glow with a focal halo, active-state emphasis, masked material
  pass, or no effect.

## Placement And Framing

- For transparent assets, frame the artwork tightly enough to feel usable but
  leave breathing room for motion.
- For full-frame scenes, keep the subject away from edges unless edge contact is
  part of the design.
- Preserve logo lockups. Do not change mark/wordmark proportions, spacing,
  rotation, or final alignment unless explicitly asked.
- Check whether the animation's final resting pose is the intended exported
  asset, not an in-between state.

## Typography

- Use one main type idea per composition: editorial, utilitarian, kinetic,
  playful, or premium.
- Keep text readable at the intended size. Avoid crowding edges.
- Split long text into deliberate lines; do not let line breaks feel accidental.
- Establish type hierarchy with size, weight, case, and spacing before adding
  effects.
- Balance text blocks optically: line length, rag, weight, and spacing should
  feel stable in the final frame.
- Align baselines and cap heights when mixing labels, names, numbers, or icons.
- Use monospaced type only for code, data, terminals, or system-like content.
- Use weight, size, and timing before adding decorative elements.
- Convert to paths when exact font rendering matters and font support is
  uncertain.

## Color And Material

- Start from source/brand colors when provided.
- Use one dominant neutral or background, one primary color, and one accent
  unless the concept demands more.
- Avoid muddy gradients, arbitrary glows, and decorative effects that reduce
  legibility.
- When using glass/metal/glow effects, keep the base composition readable with
  the effect removed.
- Verify color contrast on the intended background or transparent preview.

## Production Polish

- Check frame `0`, midpoint, and the final frame as design compositions.
- Remove temporary construction shapes, debug colors, and placeholder names.
- Confirm no text, stroke, glow, or reveal mask clips during motion.
- Ensure the motion path and visual hierarchy point to the same subject.
- Prefer fewer, better elements over many weak accents.
- Reject placeholder-looking scenes even when they render correctly. If a node,
  label, or accent does not communicate meaning, refine it or remove it.
