import type { CanvasKit, Surface } from "canvaskit-wasm/full";
import type { Scene } from "@/types";
import { getCanvasKit } from "./canvaskit";
import { loadScene } from "./scene";

// Capture at the lottie's native aspect ratio, downscaled so the longest side
// the surface needs is no wider than this. The display slot crops via object-cover.
const MAX_THUMB_WIDTH = 400;

const cache = new Map<string, string>(); // lottie URL -> blob URL
const inflight = new Map<string, Promise<string>>();

// Serialise rendering so we draw one scene at a time and never race on a surface.
let chain: Promise<unknown> = Promise.resolve();

async function render(ck: CanvasKit, scene: Scene): Promise<string> {
  const { json, assets } = await loadScene(scene);
  const anim = ck.MakeManagedAnimation(json, assets);

  // Render at the animation's own aspect ratio, capped at MAX_THUMB_WIDTH.
  const [w, h] = anim.size();
  const scale = Math.min(1, MAX_THUMB_WIDTH / w);
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));

  const surface: Surface | null = ck.MakeSurface(tw, th);
  if (!surface) {
    anim.delete();
    throw new Error("Could not create a CanvasKit raster surface for thumbnails.");
  }

  try {
    const canvas = surface.getCanvas();
    canvas.clear(ck.TRANSPARENT);
    anim.seekFrame(0);
    anim.render(canvas, ck.LTRBRect(0, 0, tw, th)); // fills the surface — no letterboxing
    surface.flush();

    const image = surface.makeImageSnapshot();
    const png = image.encodeToBytes();
    image.delete();
    if (!png) throw new Error("Failed to encode thumbnail PNG.");
    // Copy into a fresh ArrayBuffer-backed view: encodeToBytes may return a
    // view over WASM memory, which Blob's types reject (possible SharedArrayBuffer).
    const bytes = new Uint8Array(png);
    return URL.createObjectURL(new Blob([bytes.buffer], { type: "image/png" }));
  } finally {
    anim.delete();
    surface.delete();
  }
}

/** Render (or return the cached) frame-0 thumbnail for a scene as a blob URL. */
export function getThumbnail(scene: Scene): Promise<string> {
  const key = scene.lottie;

  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);

  const existing = inflight.get(key);
  if (existing) return existing;

  const job = chain.then(async () => {
    const ck = await getCanvasKit();
    const url = await render(ck, scene);
    cache.set(key, url);
    inflight.delete(key);
    return url;
  });

  inflight.set(key, job);
  // Keep the queue alive even if one render rejects.
  chain = job.catch(() => {});
  return job;
}

/** Drop a cached thumbnail (e.g. after the scene's lottie changes) and free its blob URL. */
export function invalidateThumbnail(scene: Scene): void {
  const key = scene.lottie;
  const url = cache.get(key);
  if (url) {
    URL.revokeObjectURL(url);
    cache.delete(key);
  }
  inflight.delete(key);
}
