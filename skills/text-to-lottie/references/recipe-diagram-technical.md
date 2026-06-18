# Recipe: Diagram And Technical Animation

Use for technical diagrams, flow traces, line animations, callouts, architecture
explainer graphics, process steps, and data/connection reveals.

## User-Language Aliases

- "trace this diagram", "animate the flow", "show the pipeline"
- "technical line animation", "callout animation", "draw the connection"
- "architecture explainer", "step-by-step diagram", "network/path reveal"

## Defaults

- Prioritize clarity over decoration.
- Reveal in the order the viewer should understand the system.
- Use transparent background for overlays/assets; use slotted background for
  full-frame explainers.
- Read `svg-compatibility.md` when the source diagram is SVG.

## Presets

- `flow-trace`: lines draw in path order, nodes activate after connection.
- `callout-pop`: labels or badges enter after their target is visible.
- `scan-highlight`: highlight travels across a path or system segment.
- `node-network`: nodes appear in clusters, connections follow.
- `step-build`: diagram builds one logical step at a time.

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

## Common Failure Modes

- Everything reveals at once, losing the explanation.
- Lines draw opposite the intended flow.
- Labels overlap or appear before their target.
- Decorative effects reduce technical clarity.

## Acceptance Checks

- The reveal order explains the system.
- Final frame is a clean, accurate diagram.
- Lines, arrows, labels, and callouts stay readable.
- SVG source diagrams preserve holes, clipping, and intersections.
