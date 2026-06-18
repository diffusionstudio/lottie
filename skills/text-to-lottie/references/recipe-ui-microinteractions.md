# Recipe: UI Microinteractions

Use for button states, toggles, feedback ticks, hover/click affordances,
notifications, progress states, onboarding hints, empty-state feedback, and
compact product UI motion.

## User-Language Aliases

- "button press", "hover animation", "toggle switch", "tap feedback"
- "toast notification", "progress bar", "confirmation feedback"
- "empty state motion", "form success", "small UI interaction"

## Defaults

- Short, responsive motion.
- Preserve the user's UI style if source context exists.
- Use subtle distances and clear state changes.
- Transparent background unless demonstrating a full component card.

## Presets

- `soft-confirm`: success tick or status icon draws and settles.
- `toggle-shift`: knob slides with color/opacity state change.
- `button-press`: scale/brightness press and quick release.
- `notification-pop`: small card/icon enters, holds, exits.
- `progress-fill`: determinate bar/ring fill with readable easing.
- `empty-nudge`: small illustration or icon prompts action without noise.

## Timing And Easing

- Press/hover feedback: 8-18 frames.
- Toggle/progress/state transition: 18-45 frames.
- Notification enter/exit: 30-75 frames.
- Use low-distance ease-out. Avoid large overshoot in functional UI.

## Ask Only When Needed

- Ask for the UI state pair if not clear.
- Ask whether the animation is one-shot, reversible, or looped if ambiguous.
- Ask for exact label/copy only when text appears in the animation.

## Construction Notes

- Keep state transitions reversible when practical.
- Use consistent timing across related states.
- Expose slots for accent color, label text, and progress value when useful.
- Avoid large brand-intro motion in functional UI contexts.

## Common Failure Modes

- Animation feels slow after a user action.
- Motion is too large for the component's size.
- State change is unclear without reading surrounding UI.
- Final state does not align to the component geometry.

## Acceptance Checks

- Motion communicates the state change immediately.
- No element jumps, clips, or overshoots awkwardly.
- The animation still reads when viewed small.
- Timing feels responsive at 60 fps.
