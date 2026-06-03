// Copies the CanvasKit wasm binary into /public so Vite serves it at /canvaskit.wasm.
// Runs on postinstall; safe to run manually: `node scripts/copy-canvaskit.mjs`.
import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Use the "full" build — it includes the Skottie (Lottie) module.
const src = resolve(require.resolve("canvaskit-wasm/full"), "../canvaskit.wasm");
const dest = resolve(__dirname, "../public/canvaskit.wasm");

await mkdir(dirname(dest), { recursive: true });
await copyFile(src, dest);
console.log(`Copied CanvasKit wasm -> ${dest}`);
