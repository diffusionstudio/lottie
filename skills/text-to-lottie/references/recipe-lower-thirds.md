# Recipe: Lower Thirds

Use for lower thirds, name tags, chyron, caption straps, speaker IDs, social
handles, labels, and transparent overlay text.

## User-Language Aliases

- "lower third", "speaker label", "name and title", "caption bar"
- "social handle overlay", "YouTube tag", "news chyron", "name strap"

## Defaults

- Transparent background.
- Keep within safe margins and avoid the canvas edges.
- Prioritize legibility and quick comprehension.
- Ask for name/title/copy if missing; otherwise create editable slots when text
  editing is expected.

## Presets

- `clean-slide`: bar or text slides in, content fades, soft settle.
- `broadcast-snap`: fast blocks with crisp stagger and confident exit.
- `minimal-line`: thin accent line draws, text follows.
- `pill-reveal`: rounded container scales/masks open around text.
- `social-tag`: icon/handle enters with compact bounce and hold.
- `caption-strap`: understated bar with strong text legibility.

## Timing And Easing

- Entry: 45-90 frames.
- Exit: 30-60 frames when requested.
- Use snappy ease-out for bars and softer ease for text.
- Keep the held state stable for reuse in editing timelines.

## Ask Only When Needed

- Ask for exact name/title/handle if absent.
- Ask whether an exit animation is needed if the user says "reusable" or
  "broadcast".
- Ask for placement only if bottom-left/default safe placement conflicts with
  the request.

## Construction Notes

- Expose slots for name, subtitle, accent color, and optional bar color.
- Keep lower-third elements grouped for easy positioning.
- Use masks for clean container reveals rather than clipping through the canvas.
- Leave safe margins for broadcast/video overlays.

## Common Failure Modes

- Text is too small to read over real footage.
- Overlay occupies too much of the frame.
- Entry motion distracts from the speaker/content.
- Background is accidentally opaque.

## Acceptance Checks

- Text is readable over varied backgrounds.
- The animation is transparent unless a background is explicitly requested.
- Entry and exit do not obscure too much of the frame.
- Final held state feels balanced and broadcast-ready.
