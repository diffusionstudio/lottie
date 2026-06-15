import CanvasKitInit from "canvaskit-wasm/full";
import type { CanvasKit } from "canvaskit-wasm/full";

let instance: Promise<CanvasKit> | null = null;

// Memoised so the main canvas and the thumbnail renderer share one WASM instance
// instead of fetching and instantiating canvaskit.wasm twice.
export function getCanvasKit(): Promise<CanvasKit> {
  if (!instance) {
    instance = CanvasKitInit({ locateFile: () => "/canvaskit.wasm" });
  }
  return instance;
}
