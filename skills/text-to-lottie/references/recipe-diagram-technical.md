# Recipe: Diagram And Technical Animation

Use for technical diagrams, flow traces, line animations, callouts, architecture
explainer graphics, process steps, and data/connection reveals.

## User-Language Aliases

- "trace this diagram", "animate the flow", "show the pipeline"
- "technical line animation", "callout animation", "draw the connection"
- "architecture explainer", "step-by-step diagram", "network/path reveal"

## Defaults

- Prioritize clarity over decoration.
- Follow the object budget in `design-taste.md`: start with the smallest set of
  nodes, paths, labels, and accents that explains the system.
- Reveal in the order the viewer should understand the system.
- Do not treat "technical" as dark grid, blue arrows, empty rounded cards, and
  decorative circles. Pick a concrete visual system.
- Use transparent background for overlays/assets; use slotted background for
  full-frame explainers.
- Read `svg-compatibility.md` when the source diagram is SVG.

## Before Authoring

- Define the final-frame topology: primary path, supporting clusters, callout
  positions, and strongest still-frame read.
- Choose a visual system: editorial light, product UI, schematic minimal,
  branded system map, dense dashboard detail, or presentation-grade explainer.
- Choose the structural relationship: chain for sequence, bracket for
  part-whole, orbit for convergence, radial for system, grid for comparison,
  or hairline rows for evidence.
- Decide the node/detail strategy. Each node should communicate role, state,
  sequence, metric, UI fragment, icon, or label.
- Decide what the lines mean: data flow, dependency, sequence, ownership, or
  state transition.
- Keep believability separate from density: use coherent system states and
  clear workflow labels instead of fake technical micro-detail.

## Presets

- `flow-trace`: lines draw in path order, nodes activate after connection.
- `callout-pop`: labels or badges enter after their target is visible.
- `scan-highlight`: highlight travels across a path or system segment.
- `node-network`: nodes appear in clusters, connections follow.
- `step-build`: diagram builds one logical step at a time.
- `orbit-system`: radial nodes draw in, orbit subtly, and counter-rotate labels
  to keep them upright.

## Timing And Easing

- Simple diagram: 75-150 frames.
- Multi-step explainer: 150-300 frames.
- Use linear or near-linear trim for technical traces, with eased activation for
  nodes and labels.
- Hold after each major step long enough for comprehension.

## Ask Only When Needed

- Ask for the intended reading order if it is not clear from the diagram.
- Ask whether labels should be editable when text is prominent.
- Ask full-frame vs transparent only if destination is unclear.

## Construction Notes

- Separate paths, nodes, labels, and highlights.
- Use trim paths for lines and small opacity/scale settles for nodes.
- Avoid path morphing; technical diagrams need stable geometry.
- Keep labels aligned and readable throughout the trace.
- Give each node useful interior detail: icon, number, small label, status dot,
  mini UI row, thumbnail, metric, or port.
- Use arrows only when direction is ambiguous. Vary line weight, opacity, or
  style to show primary and secondary flow.
- Use grids as alignment structure or axes, not decorative wallpaper.
- Turn floating circles into ports, status indicators, badges, or remove them.
- Use tonal rings, hairlines, halftone-like dots, or subtle value steps for
  depth before glow or shadows.
- For orbit/radial systems, counter-rotate text/icons if the parent rotates.
- If the final frame feels crowded, reduce nodes, merge labels, or emphasize the
  primary path before adding more detail.

## Common Failure Modes

- Everything reveals at once, losing the explanation.
- Lines draw opposite the intended flow.
- Labels overlap or appear before their target.
- Decorative effects reduce technical clarity.
- Empty rounded rectangles make the diagram feel placeholder-like.
- Dark grid plus blue arrow chains make the scene feel generic unless requested.
- Generic node mesh suggests "technical" without explaining a relationship.
- Large blank regions weaken the final poster frame.
- Fake complexity adds visual noise without explaining the system.
- Dense meaningful-looking detail makes the system harder to understand.

## Acceptance Checks

- The reveal order explains the system.
- Final frame is a clean, accurate diagram.
- Lines, arrows, labels, and callouts stay readable.
- Nodes contain enough information to be meaningful without the animation.
- The final topology feels balanced, with intentional negative space.
- Decoration has a job: grouping, state, brand, attention, or structure.
- Diagram structure communicates the relationship without relying on labels
  alone.
- Detail improves comprehension without crowding the final composition.
- SVG source diagrams preserve holes, clipping, and intersections.
