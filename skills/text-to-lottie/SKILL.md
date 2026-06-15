---
name: text-to-lottie
description: Author a Lottie (Bodymovin) JSON animation that renders in a local skia player. Use whenever the user asks to create, generate, edit, or fix a Lottie animation, or asks for "an animation" to load.
---

# Authoring Renderable Lottie Files

This app renders Lottie with **Skia's Skottie** module, follow the rules below and verify the result.

## Setting up the project

The deliverable is not just a `lottie.json`: the viewer should be set up and the
animation should be previewable in the browser. If the player project is
missing, create it; if it exists, install/update dependencies as needed, start
the dev server, and open the local preview URL for verification.

**Always use the official GitHub player project — never hand-roll a custom
viewer.** This skill's JSON rules (slots, the properties panel, the `?frame=`
URL controls, the Skottie wasm wiring) only hold inside that exact project. Do
**not** build your own HTML page, swap in `lottie-web`, or scaffold a bespoke
canvas setup — any of those will silently diverge from how this player renders
and the verification steps below won't apply. If the player project isn't
already on this machine, scaffold a fresh copy of the repo with **degit**:

```bash
npx degit diffusionstudio/lottie my-animation
cd my-animation
npm install   # postinstall copies the CanvasKit wasm into /public
npm run dev
```

Then open the printed local URL. The dev server defaults to **`http://localhost:3030`**. If you already have the project, just `npm install && npm run dev`.

## Required folder structure in `/public`

The player is a multi-scene editor: every scene lives in its own folder under
`public/projects/`, and the app routes to one by path. **You must follow this
layout exactly** — anything off-layout is ignored.

```
public/
├── canvaskit.wasm                 # Skia wasm (copied in by postinstall — don't touch)
└── projects/
    └── <project-slug>/            # e.g. main-project
        └── <scene-N>/             # e.g. scene-1, scene-2, … (see ordering below)
            ├── lottie.json        # REQUIRED — the Bodymovin animation
            ├── controls.json      # OPTIONAL — properties-panel metadata (see slots)
            └── <image files>      # OPTIONAL — .png/.jpg/.jpeg/.webp/.gif/.svg assets
```

Rules the scanner enforces:

- **Slugs are URL segments.** `<project-slug>` and `<scene-N>` must be
  folder-safe lowercase-ish names; they become the path `/<project>/<scene>`.
  The sidebar label is derived by title-casing the slug (`main-project` →
  "Main Project", `scene-1` → "Scene 1").
- **Scene ordering is the trailing `-N`.** A scene's sort order is the number at
  the end of its slug (`scene-1`, `scene-2`, …, regex `/-(\d+)$/`). Name new
  scenes `scene-<N>` so they order correctly; a slug with no trailing number
  sorts last.
- **`lottie.json` is mandatory.** A scene folder without one is silently dropped
  from the tree (and a project with zero valid scenes disappears entirely).
- **Images are referenced by bare filename.** Put an image in the scene folder
  and reference it in the Lottie's `assets[].p` by filename only
  (e.g. `"p": "background.png"`); the loader resolves it from the same folder.

## Where to write the file (and how it loads)

- Write your animation to **`public/projects/<project>/<scene-N>/lottie.json`**.
  If you're creating a brand-new animation and no target scene is specified,
  create a project folder (e.g. `public/projects/my-animation/scene-1/`) and
  write `lottie.json` there, then open `/my-animation/scene-1`.
- The app routes on **`/:project/:scene`** ([`src/router.tsx`](../../../src/router.tsx));
  `/` redirects to the first project's first scene. The canvas provider
  ([`src/context/canvas.tsx`](../../../src/context/canvas.tsx)) fetches that
  scene's `lottie.json` (plus its images) and renders it.
- With the dev server running, the scenes plugin **watches the folder tree**.
  Adding, removing, or renaming a project/scene folder live-updates the sidebar
  over Vite's HMR socket (no reload). Editing the *contents* of an existing
  `lottie.json` does **not** auto-reload the active scene — reload the page (or
  re-navigate) to pick up hand-edited JSON.

## Example

```json lottie.json
{
  "v": "5.7.0",
  "fr": 60,
  "ip": 0,
  "op": 90,
  "w": 512,
  "h": 512,
  "nm": "Bouncing ball",
  "assets": [],
  "slots": {
    "ballColor": { "p": { "a": 0, "k": [0.231, 0.6, 1, 1] } },
    "ballOpacity": { "p": { "a": 0, "k": 100 } },
    "ballSize": { "p": { "a": 0, "k": [120, 120] } }
  },
  "layers": [
    {
      "ty": 4,
      "nm": "ball",
      "ip": 0,
      "op": 90,
      "st": 0,
      "ks": {
        "o": { "sid": "ballOpacity" },
        "r": { "a": 0, "k": 0 },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": { "a": 0, "k": [100, 100, 100] },
        "p": {
          "a": 1,
          "k": [
            { "t": 0, "s": [256, 140, 0], "i": { "x": [0.5], "y": [1] }, "o": { "x": [0.7], "y": [0] } },
            { "t": 45, "s": [256, 380, 0], "i": { "x": [0.3], "y": [1] }, "o": { "x": [0.5], "y": [0] } },
            { "t": 90, "s": [256, 140, 0] }
          ]
        }
      },
      "shapes": [
        {
          "ty": "gr",
          "nm": "ball-group",
          "it": [
            { "ty": "el", "p": { "a": 0, "k": [0, 0] }, "s": { "sid": "ballSize" } },
            { "ty": "fl", "c": { "sid": "ballColor" }, "o": { "a": 0, "k": 100 } },
            { "ty": "tr", "p": { "a": 0, "k": [0, 0] }, "a": { "a": 0, "k": [0, 0] }, "s": { "a": 0, "k": [100, 100] }, "r": { "a": 0, "k": 0 }, "o": { "a": 0, "k": 100 } }
          ]
        }
      ]
    },
    {
      "ty": 4,
      "nm": "background",
      "ip": 0,
      "op": 90,
      "st": 0,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { "a": 0, "k": 0 },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": { "a": 0, "k": [100, 100, 100] },
        "p": { "a": 0, "k": [256, 256, 0] }
      },
      "shapes": [
        {
          "ty": "gr",
          "nm": "background-group",
          "it": [
            { "ty": "rc", "p": { "a": 0, "k": [0, 0] }, "s": { "a": 0, "k": [512, 512] }, "r": { "a": 0, "k": 0 } },
            { "ty": "fl", "c": { "a": 0, "k": [0.5, 0.5, 0.5, 1] }, "o": { "a": 0, "k": 100 } },
            { "ty": "tr", "p": { "a": 0, "k": [0, 0] }, "a": { "a": 0, "k": [0, 0] }, "s": { "a": 0, "k": [100, 100] }, "r": { "a": 0, "k": 0 }, "o": { "a": 0, "k": 100 } }
          ]
        }
      ]
    }
  ]
}
```

```json controls.json
{
  "controls": [
    { "sid": "ballColor", "label": "Ball color" },
    { "sid": "ballOpacity", "label": "Ball opacity", "min": 0, "max": 100, "step": 1 },
    { "sid": "ballSize", "label": "Ball size", "min": 20, "max": 400, "step": 1 }
  ]
}
```

**Recommended: a top-level `nm` string.** Give the document a root `nm` name.
The player renders it as a label above the canvas and surfaces it in the agent
context (see `/__context` below);

## Exposing editable properties (slots + the properties panel)

The app can render a live **properties panel** (text inputs and sliders) that
edit chosen values of the animation in real time. This rides on Skottie's
native **slot** feature — no re-parse, the change shows on the next frame.

To make a property editable, do two things:

**1. Declare a slot in the Lottie JSON.** Add a top-level `"slots"` object whose
keys are slot IDs, and point a property at one with `"sid"` instead of (or
alongside) an inline value. The slot's `"p"` holds the default, in the same
shape the property would normally take.

```jsonc
{
  "v": "5.7.0", "fr": 60, "ip": 0, "op": 90, "w": 512, "h": 512, "assets": [],
  "slots": {
    "ballColor": { "p": { "a": 0, "k": [0.231, 0.6, 1, 1] } },   // color: RGBA 0–1
    "ballSize":  { "p": { "a": 0, "k": 120 } }                    // scalar
  },
  "layers": [ /* ... */
    // in the fill:    "c": { "sid": "ballColor" }
    // in a scalar:    "s": { "sid": "ballSize" }
  ]
}
```

Slot types map to controls like this:

| Slot value | Control rendered |
|------------|------------------|
| scalar (a single number) | slider |
| color (RGBA 0–1)         | color picker |
| vec2 (`[x, y]`)          | two number inputs |
| text (a string)          | text input |

The app discovers slots automatically via Skottie's `getSlotInfo()` — you do
**not** list them anywhere else for them to work. The panel appears as soon as
the animation declares at least one slot.

**Every animation you produce must expose at least one control for the
background color.**


```jsonc
// slots:    "bgColor": { "p": { "a": 0, "k": [1, 1, 1, 1] } }   // default white
// controls: { "sid": "bgColor", "label": "Background color" }
```


**2. (Optional) Describe presentation in the scene's `controls.json`.** Slots
only expose an ID and type, not a label or a sensible slider range. A sidecar
file next to the scene's `lottie.json` (i.e.
`public/projects/<project>/<scene-N>/controls.json`) adds that. It is optional —
missing entries fall back to the slot ID and a generic 0–100 range.

```jsonc
{
  "controls": [
    { "sid": "ballColor", "label": "Ball color" },
    { "sid": "ballSize",  "label": "Ball size", "min": 40, "max": 240, "step": 1 }
  ]
}
```

- `sid` must match a slot ID exactly.
- `label` is the display name; `min`/`max`/`step` shape scalar sliders and vec2
  inputs (ignored for color/text).
- An entry whose `sid` matches no slot is simply ignored; a slot with no entry
  still renders with defaults.

## Scenes the user can create or edit

The player is a live editor, so a scene's `lottie.json` is not only an input —
**the user (and the UI) can change it out from under you:**

- **New projects/scenes** appear via the sidebar's `+` buttons, by dropping a
  `.json`/`.lottie` file onto the canvas, or by you creating folders on disk.
  The watcher live-updates the tree, so a folder you write under
  `public/projects/<project>/<scene-N>/` shows up without a restart.
- **Control edits are written back to disk.** When the user drags a slider or
  edits a slotted value, the app POSTs the updated document to `/__scenes/lottie`
  and overwrites that scene's `lottie.json` — `public/projects` is the source of
  truth. So before you re-edit a file, **re-read it from disk** rather than
  trusting an earlier copy; the on-screen values may already differ.

When you want to write or modify a scene, just write the `lottie.json` file at
the correct path (the structure above). Use the existing scene if the user
pointed you at one; otherwise create a new scene folder with the next
`scene-<N>` index so you don't clobber their work.

**For new projects, overwrite the placeholder scne in `public/projects/main-project/scene-1/lottie.json`.**

## Inspecting what's playing — `/__context`

The dev server exposes an **context endpoint** at `GET /__context`.
Prefer this over guessing from screenshots: it returns the full project/scene
tree (with `lastModified` mtimes), which scene is **active**, and the **live
playback state** — including the current frame computed from elapsed time:

```bash
curl -s http://localhost:3030/__context
```

Use it to confirm your file landed (does the scene appear?), to see which scene
the user is looking at, and to check the playhead without screenshotting. The
browser POSTs to the same endpoint as a heartbeat — you don't need to POST.

## Controlling playback

When you drive the page through a browser tool, **pin the frame in the URL** and read the canvas:

```
http://localhost:3030/main-project/scene-1?frame=60
```

- `?frame=N` seeks to frame `N` on load **and pauses** there, so the moment sits
  still for a screenshot. This is the right way to inspect a specific frame, then
  screenshot.
- With no `frame` param the animation autoplays (on first load) as usual.
- The frame is per-scene, so include the scene path: `/<project>/<scene>?frame=N`.

To change the inspected frame, navigate to a new URL (or edit the query string
and reload). The canvas is `<canvas id="main-canvas">`. If the canvas is blank,
the page hasn't finished loading or the Lottie failed to parse (check the
on-screen error).

## Verification recommendations

Drive verification through the URL: `?frame=N` seeks and pauses, so each
screenshot lands on an exact, still frame. Read the frame count from
`GET /__context` (`live.totalFrames`) or compute it from `op` and `fr`.

- **New scene → three screenshots** spanning the timeline: frame `0`, the
  midpoint (`op/2`), and the last frame (`op-1`). This catches the start state,
  the motion mid-flight, and the end pose in one pass.
- **Small edits → one or two screenshots** around the region of interest (the
  frames where your change is visible). No need to redo the full three-frame
  sweep.
- **Hunt for artifacts, not just prompt-fidelity.** Beyond "does it match what
  was asked," look for problems that make output look unfinished. The result should be clean, intentional, and production-ready.

## Best practices

- Prioritize producing high-fidelity, production-ready animations.
- Use appropriate easings and timing. Linear easings are often not the best choice.
- Consider the overall motion design, including pacing, transitions, and visual continuity.
- Choose the implementation approach that best fits the task.
  - For complex or procedural animations, creating a script in `script/` to generate the Lottie file may be simpler and more maintainable.
  - For targeted changes, modifying the Lottie JSON directly may be more efficient than recreating the animation.

## Before you finish — checklist

1. The file lives at `public/projects/<project>/<scene-N>/lottie.json` (folder
   structure followed; scene named `scene-<N>` for correct ordering).
2. The file is valid JSON (no comments, no trailing commas). Validate with
   `node -e "JSON.parse(require('fs').readFileSync('public/projects/<project>/<scene-N>/lottie.json','utf8'))"`.
3. The project is the official GitHub player (scaffolded via degit)
4. The dev server is running (`npm run dev`); navigate to
    `/<project>/<scene>` to see the scene. A blank canvas (no error) → re-check
    the group wrapping.
5. The canvas is rendering the desired animation

## References

- Lottie format specification: <https://github.com/lottie/lottie-spec/tree/main/docs/specs>
