# Text-To-Lottie

This project includes a full-screen Lottie player built on **Skia CanvasKit (Skottie)**, with a
React + shadcn/ui + TypeScript control surface. Built to **generate a Lottie
animation with an LLM and watch it play live**: the agent writes
`public/lottie.json`, the dev server hot-reloads it.

## Usage 

Run
```bash
npx skills add diffusionstudio/lottie
```

Then ask claude code/codex or any other agent supporting skills to generate an animation using `text-to-lottie`

## Getting started

Alternatively you can set up the repository manually

```bash
npm install   # also copies the CanvasKit wasm into /public (postinstall)
npm run dev
```

Then open the printed local URL.

## CanvasKit wasm

The wasm binary is **not** committed; it is copied from
`node_modules/canvaskit-wasm/bin/full/canvaskit.wasm` into `public/` by
[`scripts/copy-canvaskit.mjs`](scripts/copy-canvaskit.mjs) on `postinstall`. Run
it manually any time with `node scripts/copy-canvaskit.mjs`.
