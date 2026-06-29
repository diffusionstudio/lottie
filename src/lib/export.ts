import { zipSync, type Zippable } from "fflate";
import type { Project } from "@/types";

/**
 * Bundle a project's on-disk source into a zip and trigger a download.
 * The archive has three folders: `animations/` (one lottie.json per scene),
 * `images/` (all scene image assets), and `fonts/` (all scene font files). This
 * reads the served source files, not the in-memory skottie state, so it relies
 * on edits already being saved back.
 */
export async function exportProjectZip(project: Project): Promise<void> {
  const files: Zippable = {};

  const bundle = async (urls: string[], folder: string) => {
    for (const url of urls) {
      const res = await fetch(url);
      if (res.ok) {
        const name = url.split("/").pop()!;
        files[`${folder}/${name}`] = new Uint8Array(await res.arrayBuffer());
      }
    }
  };

  for (const scene of project.scenes) {
    const res = await fetch(scene.lottie);
    if (res.ok) {
      files[`animations/${scene.slug}.json`] = new Uint8Array(await res.arrayBuffer());
    }
    await bundle(scene.images, "images");
    await bundle(scene.fonts, "fonts");
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
