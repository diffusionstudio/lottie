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

  // MakeManagedAnimation takes one named-blob map for both images and fonts.
  // Images are matched by key (it must equal the lottie's `assets[].p` filename).
  // Fonts are different: CanvasKit feeds every blob to a custom SkFontMgr and
  // resolves text layers by each font's *embedded* family name (matched against
  // the lottie `fonts.list[].fFamily`), so a font's key is arbitrary — we use the
  // filename only to keep it from colliding with another asset.
  const assets: Record<string, ArrayBuffer> = {};
  await Promise.all(
    [...scene.images, ...scene.fonts].map(async (url) => {
      const assetRes = await fetch(url);
      if (assetRes.ok) {
        assets[url.split("/").pop()!] = await assetRes.arrayBuffer();
      }
    }),
  );

  return { json, assets };
}
