import type { Scene } from "@/types";

export interface SceneData {
  json: string;
  assets: Record<string, ArrayBuffer>;
}

export async function loadScene(scene: Scene): Promise<SceneData> {
  const res = await fetch(scene.lottie, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load ${scene.lottie} (HTTP ${res.status})`);
  }
  const json = await res.text();

  // Fetch image assets keyed by filename, matching the lottie's `assets[].p` values
  // so MakeManagedAnimation can resolve them.
  const assets: Record<string, ArrayBuffer> = {};
  await Promise.all(
    scene.images.map(async (url) => {
      const imgRes = await fetch(url);
      if (imgRes.ok) {
        assets[url.split("/").pop()!] = await imgRes.arrayBuffer();
      }
    }),
  );

  return { json, assets };
}
