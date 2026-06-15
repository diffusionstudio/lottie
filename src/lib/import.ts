import { unzipSync, strFromU8 } from "fflate";

/**
 * Parse a dropped Lottie file into a Bodymovin document.
 * Accepts a plain `.json` animation or a `.lottie` archive (dotLottie: a zip
 * whose `animations/*.json` entries hold the Bodymovin sources).
 */
export async function parseLottieFile(file: File): Promise<Record<string, unknown>> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".lottie")) {
    const unzipped = unzipSync(new Uint8Array(await file.arrayBuffer()));
    const entry =
      Object.keys(unzipped).find((p) => /animations\/.+\.json$/i.test(p)) ??
      Object.keys(unzipped).find((p) => p.toLowerCase().endsWith(".json"));
    if (!entry) throw new Error("No animation JSON found in .lottie archive");
    return JSON.parse(strFromU8(unzipped[entry]));
  }

  return JSON.parse(await file.text());
}

/**
 * Create a new scene in `project` (next index) seeded with `doc`, returning the
 * created project/scene slugs. The scene is created with a default lottie which
 * is then overwritten by the dropped source.
 */
export async function createSceneFromDoc(
  project: string,
  doc: Record<string, unknown>,
): Promise<{ project: string; scene: string }> {
  const created = await fetch("/__scenes/scene", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project }),
  });
  if (!created.ok) throw new Error(`Failed to create scene (HTTP ${created.status})`);
  const { project: proj, scene } = (await created.json()) as { project: string; scene: string };

  const saved = await fetch("/__scenes/lottie", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project: proj, scene, doc }),
  });
  if (!saved.ok) throw new Error(`Failed to save lottie source (HTTP ${saved.status})`);

  return { project: proj, scene };
}
