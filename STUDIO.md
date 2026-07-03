# Lottie Studio

A small web UI + agent bridge on top of [diffusion-studio/lottie](https://github.com/diffusionstudio/lottie)
(the official Skia/Skottie Lottie player). You drop a photo/SVG, write a prompt,
pick options — a coding agent (Claude Code) picks the job up, authors the Lottie
scene, and the player shows it live.

This is an early proof of concept, not a finished product. See **Roadmap** below.

## Run

```bash
npm install
npm run dev          # player on http://localhost:3030
```

Open the studio at **http://localhost:3030/studio.html** (or `/studio`).

## How it works (the bridge)

No API key lives in the app — a watching agent is the generation engine.

```
Studio page  ──POST /api/jobs──▶  .studio-jobs/<id>/job.json (+ image)   [status: pending]
   (browser)                              │
                                          ▼
                          Claude Code watches for pending jobs,
                          authors public/projects/<project>/<scene-N>/lottie.json,
                          writes status: done + scene back into job.json
                                          │
Studio polls /api/jobs/<id> ◀────────────┘   → embeds the player once the scene exists
```

- **`public/studio.html`** — the studio UI: image dropzone, prompt, options
  (project, size, fps, frames, background transparent/color, loop, editable
  controls, notes), live player iframe, recent-jobs feed.
- **`vite-plugins/studio.ts`** — the job queue API (`POST/GET /api/jobs`,
  `GET /api/jobs/:id`, `/studio` redirect). Jobs live under `.studio-jobs/`
  (gitignored).
- **Scenes** are authored under `public/projects/<project>/<scene-N>/` as
  `lottie.json` (+ optional `controls.json`, image/font assets) — the same
  contract the base player already watches. Raster grounding images are embedded
  as Lottie image assets so the original art is preserved pixel-for-pixel; overlay
  layers (blink/wink/wave/camera) are parented to the image so they track it.

## MP4 export

Each finished scene has an **MP4 indir** button (background colour selectable —
MP4 has no alpha). `GET /api/export?project=&scene=&bg=&fps=&loops=` renders the
scene frame-by-frame through Skottie and encodes H.264 via a bundled
`ffmpeg-static` binary (no system ffmpeg needed), then streams the file back.

## Roadmap (what would make it good)

**Quality engine**
1. Agentic generate → render → **vision-check** → self-correct loop (align
   eyes, catch edge gaps, verify the loop seam) instead of one-shot authoring.
2. Layer/part separation & rigging (SVG input or auto-segmentation + background
   removal) for real limb motion — walk, arm-wave, lip-sync.
3. Automatic face/landmark detection so blink/wink/lip-sync auto-align to any
   character (no hand-tuned coordinates).
4. A parameterized motion-preset library (blink, wink, wave, bounce, float,
   pop-in, shake, breathe, parallax, camera push/pull, confetti…).

**Studio UX**
5. Timeline: play/pause/scrub, frame pinning, before/after, chat-style "refine"
   on an existing scene, regenerate.
6. Export to GIF / MP4 / WebM + copy-ready snippets (web, RN Skottie, iOS,
   Android, Flutter).
7. SVG-first grounding, multiple references, region capture; background
   transparent/color/gradient/keep-source with auto source-color extraction.

**Infra**
8. Headless mode (run with an API key, no live agent session) + queue
   robustness (retry/cancel/multi-job) + a persistent gallery.
9. Quality guardrails on every generation: JSON validate, render-check,
   loop-seam check, blank-canvas rejection.

## Credit

Built on **diffusion-studio/lottie** (Text-to-Lottie). Base player, skill, and
player contract are theirs; the Studio UI, job-bridge, and generated scenes are
the additions here.
