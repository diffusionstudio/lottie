# lottie-experiments

A full-screen Lottie player built on **Skia CanvasKit (Skottie)**, with a
React + shadcn/ui + TypeScript control surface.

- Vite + React 18 + TypeScript
- Tailwind v4 + shadcn/ui (`new-york`) components
- Skia `canvaskit-wasm` (the **full** build, which includes the Skottie module)
  renders the animation onto a WebGL surface
- A floating control card (play/pause, seek slider, current time / duration)

## Getting started

```bash
npm install   # also copies the CanvasKit wasm into /public (postinstall)
npm run dev
```

Then open the printed local URL.

## How it works

- [`src/lib/lottie-player.ts`](src/lib/lottie-player.ts) — `LottiePlayer` owns the
  CanvasKit surface and a `requestAnimationFrame` loop. Playback is driven off
  wall-clock time (so speed is independent of frame rate), the surface is
  recreated on resize, and the animation is letterboxed to fit the canvas.
- [`src/App.tsx`](src/App.tsx) — fetches `/lottie.json` at startup, wires the
  player to React state, and lays out the full-screen canvas + control card.
- [`src/components/PlaybackControls.tsx`](src/components/PlaybackControls.tsx) —
  the floating shadcn `Card` with the play/pause button, seek `Slider`, and time
  readout.

## Swapping the animation

Replace [`public/lottie.json`](public/lottie.json) with any Lottie JSON. Note
that Skottie expects shape elements wrapped in a group (`"ty": "gr"` with an
`it` array) — flat shape lists render blank.

## CanvasKit wasm

The wasm binary is **not** committed; it is copied from
`node_modules/canvaskit-wasm/bin/full/canvaskit.wasm` into `public/` by
[`scripts/copy-canvaskit.mjs`](scripts/copy-canvaskit.mjs) on `postinstall`. Run
it manually any time with `node scripts/copy-canvaskit.mjs`.
