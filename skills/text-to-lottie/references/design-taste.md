# Design Taste

Use this reference when composition, typography, layout, color, or brand polish
matters.

## Contents

- Design Decision Loop
- Simplify Before Adding
- Composition Defaults
- Anti-Generic Replacements
- Placement And Framing
- Typography
- Color And Material
- Production Polish

## Design Decision Loop

Before authoring a designed scene, define the message, focal subject, support
layer, accent system, and final-frame composition goal. If those choices are
not clear, the design will usually drift toward generic shapes.

- Translate "clean", "technical", or "premium" into a specific system: editorial
  light, product UI, schematic minimal, branded system map, dense dashboard
  detail, or presentation-grade explainer.
- Start with the fewest objects needed. A strong default is one focal subject,
  one support layer, and one accent system.
- Choose the main still image first. Motion should reveal and clarify that
  composition, not rescue a weak final frame.
- Decide which elements carry meaning. Decoration should either group content,
  show state, direct attention, reinforce brand, or be removed.
- Separate believability from density. Product or content detail is believable
  when state, workflow, labels, and hierarchy are internally consistent, not
  when the scene simply contains more interface fragments.
- If hierarchy, spacing, color restraint, object necessity, or final-frame
  quality fails, simplify and revise before finishing.

## Simplify Before Adding

- Prefer fewer stronger objects over many meaningful-looking details.
- Remove, merge, resize, clarify, or rebalance existing elements before adding
  a new object, badge, line, glow, or texture.
- Treat a detail as valid only when it improves comprehension, hierarchy,
  workflow clarity, state, brand signal, or reading rhythm.
- A detail can have a role and still fail if the composition becomes crowded,
  evenly weighted, or hard to read.
- When the scene feels generic, first strengthen the focal subject, spacing,
  typography, and color roles. Add effects only after the composition holds.

## Composition Defaults

- Start with a clear hierarchy: primary subject, supporting detail, accent.
- Keep the object budget visible while designing: focal subject first, support
  second, accent last.
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
- Decide the focal line or phrase before styling support text.
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
- Assign color roles before adding new colors: background/neutral, focal
  subject, accent, and optional semantic state.
- Do not let multiple accents compete for the same level of attention.
- Avoid muddy gradients, arbitrary glows, and decorative effects that reduce
  legibility.
- When using glass/metal/glow effects, keep the base composition readable with
  the effect removed.
- Verify color contrast on the intended background or transparent preview.

## Production Polish

- Check frame `0`, midpoint, and the final frame as design compositions.
- The final frame should have one clear focal subject, readable support, and
  intentional negative space.
- The final frame should feel visually finished, not merely like the last
  rendered frame.
- Remove temporary construction shapes, debug colors, and placeholder names.
- Confirm no text, stroke, glow, or reveal mask clips during motion.
- Ensure the motion path and visual hierarchy point to the same subject.
- Prefer fewer, better elements over many weak accents.
- Reject placeholder-looking scenes even when they render correctly. If a node,
  label, or accent does not communicate meaning, refine it or remove it.
- Treat unresolved hierarchy, crowded detail, weak typography, color overload,
  or a poor final still as blockers. Revise the scene before considering it
  complete.
