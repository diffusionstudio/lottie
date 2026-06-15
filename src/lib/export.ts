import { zipSync, type Zippable } from "fflate";
import type { Project } from "@/types";

/**
 * Bundle a project's on-disk source into a zip and trigger a download.
 * The archive has two folders: `animations/` (one lottie.json per scene) and
 * `images/` (all scene image assets). This reads the served source files, not
 * the in-memory skottie state, so it relies on edits already being saved back.
 */
export async function exportProjectZip(project: Project): Promise<void> {
  const files: Zippable = {};

  for (const scene of project.scenes) {
    const res = await fetch(scene.lottie);
    if (res.ok) {
      files[`animations/${scene.slug}.json`] = new Uint8Array(await res.arrayBuffer());
    }
    for (const url of scene.images) {
      const imgRes = await fetch(url);
      if (imgRes.ok) {
        const name = url.split("/").pop()!;
        files[`images/${name}`] = new Uint8Array(await imgRes.arrayBuffer());
      }
    }
  }

  const zipped = zipSync(files);
  const blob = new Blob([zipped as BlobPart], { type: "application/zip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.slug}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
