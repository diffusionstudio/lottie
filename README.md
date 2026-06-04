# lottie-experiments

A full-screen Lottie player built on **Skia CanvasKit (Skottie)**, with a
React + shadcn/ui + TypeScript control surface. Built to **generate a Lottie
animation with an LLM and watch it play live**: the agent writes
`public/lottie.json`, the dev server hot-reloads it.

## Getting started

```bash
npm install   # also copies the CanvasKit wasm into /public (postinstall)
npm run dev
```

Then open the printed local URL.

## Generating an animation with an LLM

This is the intended workflow:

1. **Scaffold** a fresh project (optional — this repo already is one) with
   [degit](https://github.com/Rich-Harris/degit), which copies the repo as a
   clean starting point (no git history):
   ```bash
   npx degit diffusionstudio/lottie my-animation
   cd my-animation
   npm install
   ```
2. **Run** `npm run dev`.
3. **Point a coding agent at the repo.** It reads [`CLAUDE.md`](CLAUDE.md) and the
   [`write-lottie` skill](.claude/skills/write-lottie/SKILL.md), then writes a
   renderable Lottie to `public/lottie.json`. A Vite dev plugin
   ([`vite.config.ts`](vite.config.ts)) watches that file and **full-reloads the
   page on save**, so the animation appears immediately.

## Swapping the animation manually

Replace [`public/lottie.json`](public/lottie.json) with any Lottie JSON; the dev
server reloads it on save. Note that Skottie expects shape elements wrapped in a
group (`"ty": "gr"` with an `it` array) — flat shape lists render blank. The
[`write-lottie` skill](.claude/skills/write-lottie/SKILL.md) documents the full
set of Skottie gotchas.

## CanvasKit wasm

The wasm binary is **not** committed; it is copied from
`node_modules/canvaskit-wasm/bin/full/canvaskit.wasm` into `public/` by
[`scripts/copy-canvaskit.mjs`](scripts/copy-canvaskit.mjs) on `postinstall`. Run
it manually any time with `node scripts/copy-canvaskit.mjs`.
