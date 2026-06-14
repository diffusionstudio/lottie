import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import type { Scene, Project, ScenesTree } from "../src/types/common";
import type { IncomingMessage, ServerResponse } from "node:http";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);

/** "main-project" -> "Main Project", "scene-1" -> "Scene 1" */
function titleCase(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Order is the trailing "-NN" suffix of a scene slug; absent -> Infinity (sorts last). */
function sceneOrder(slug: string): number {
  const match = slug.match(/-(\d+)$/);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

function listDirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/** "My Cool Anim" -> "my-cool-anim" (folder-safe, used as the URL segment). */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** A folder name under `parent` that doesn't collide, e.g. "foo", "foo-2", "foo-3". */
function uniqueDir(parent: string, base: string): string {
  const root = base || "untitled";
  let slug = root;
  let n = 2;
  while (fs.existsSync(path.join(parent, slug))) slug = `${root}-${n++}`;
  return slug;
}

/** Next "scene-N" slug for a project, one past the highest existing trailing number. */
function nextSceneSlug(projectDir: string): string {
  let max = 0;
  for (const dir of listDirs(projectDir)) {
    const match = dir.match(/-(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `scene-${max + 1}`;
}

/** Minimal Bodymovin scene: a single `w`x`h` background rect filled with `hex`. */
function defaultLottie(w: number, h: number, hex: string): unknown {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  return {
    v: "5.7.0",
    fr: 60,
    ip: 0,
    op: 90,
    w,
    h,
    assets: [],
    layers: [
      {
        ty: 4,
        nm: "background",
        ip: 0,
        op: 90,
        st: 0,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          a: { a: 0, k: [0, 0, 0] },
          s: { a: 0, k: [100, 100, 100] },
          p: { a: 0, k: [w / 2, h / 2, 0] },
        },
        shapes: [
          {
            ty: "gr",
            nm: "background-group",
            it: [
              { ty: "rc", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [w, h] }, r: { a: 0, k: 0 } },
              { ty: "fl", c: { a: 0, k: [r, g, b, 1] }, o: { a: 0, k: 100 } },
              {
                ty: "tr",
                p: { a: 0, k: [0, 0] },
                a: { a: 0, k: [0, 0] },
                s: { a: 0, k: [100, 100] },
                r: { a: 0, k: 0 },
                o: { a: 0, k: 100 },
              },
            ],
          },
        ],
      },
    ],
  };
}

/** Create `<sceneDir>/lottie.json` with a fresh 512x512 #262626 scene. */
function createScene(sceneDir: string): void {
  fs.mkdirSync(sceneDir, { recursive: true });
  fs.writeFileSync(
    path.join(sceneDir, "lottie.json"),
    JSON.stringify(defaultLottie(512, 512, "#262626"), null, 2),
  );
}

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data || "{}"));
      } catch {
        resolve({});
      }
    });
  });
}

function scanScene(projectSlug: string, sceneSlug: string, sceneDir: string): Scene | null {
  const files = fs
    .readdirSync(sceneDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);

  if (!files.includes("lottie.json")) return null;

  const base = `/projects/${projectSlug}/${sceneSlug}`;
  const images = files
    .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
    .sort()
    .map((name) => `${base}/${name}`);

  return {
    slug: sceneSlug,
    label: titleCase(sceneSlug),
    order: sceneOrder(sceneSlug),
    lottie: `${base}/lottie.json`,
    controls: files.includes("controls.json") ? `${base}/controls.json` : undefined,
    images,
  };
}

/** Discover all projects/scenes under `projectsDir` into an ordered tree. */
export function scanProjects(projectsDir: string): ScenesTree {
  const projects: Project[] = [];

  for (const projectSlug of listDirs(projectsDir).sort()) {
    const projectDir = path.join(projectsDir, projectSlug);
    const scenes: Scene[] = [];

    for (const sceneSlug of listDirs(projectDir)) {
      const scene = scanScene(projectSlug, sceneSlug, path.join(projectDir, sceneSlug));
      if (scene) scenes.push(scene);
    }

    scenes.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
    if (scenes.length > 0) {
      projects.push({ slug: projectSlug, label: titleCase(projectSlug), scenes });
    }
  }

  return { projects };
}

/**
 * Auto-discovers `public/projects/<project>/<scene-NN>/` folders.
 * - Dev: serves the tree at `GET /__scenes` and live-pushes `scenes:update` over
 *   Vite's HMR socket whenever a project/scene file is added, removed, or renamed.
 * - Build: emits a static `scenes.json` for production.
 */
export function scenesPlugin(): Plugin {
  let projectsDir = "";

  return {
    name: "scenes-discovery",

    configResolved(config) {
      projectsDir = path.resolve(config.root, "public/projects");
    },

    configureServer(server) {
      const json = (res: ServerResponse, status: number, body: unknown) => {
        res.statusCode = status;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(body));
      };

      // Create a new project with a default scene. Body: { name }.
      server.middlewares.use("/__scenes/project", async (req, res) => {
        if (req.method !== "POST") return json(res, 405, { error: "method not allowed" });
        const body = await readJsonBody(req);
        const projectSlug = uniqueDir(projectsDir, slugify(String(body.name ?? "")));
        const sceneSlug = "scene-1";
        createScene(path.join(projectsDir, projectSlug, sceneSlug));
        json(res, 201, { project: projectSlug, scene: sceneSlug });
      });

      // Append a new default scene to an existing project. Body: { project }.
      server.middlewares.use("/__scenes/scene", async (req, res) => {
        if (req.method !== "POST") return json(res, 405, { error: "method not allowed" });
        const body = await readJsonBody(req);
        const projectSlug = String(body.project ?? "");
        const projectDir = path.resolve(projectsDir, projectSlug);
        if (!projectDir.startsWith(projectsDir + path.sep) || !fs.existsSync(projectDir)) {
          return json(res, 404, { error: "project not found" });
        }
        const sceneSlug = nextSceneSlug(projectDir);
        createScene(path.join(projectDir, sceneSlug));
        json(res, 201, { project: projectSlug, scene: sceneSlug });
      });

      server.middlewares.use("/__scenes", (_req, res) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(scanProjects(projectsDir)));
      });

      const notify = (file: string) => {
        if (!file.startsWith(projectsDir)) return;
        server.ws.send({ type: "custom", event: "scenes:update", data: scanProjects(projectsDir) });
      };

      server.watcher.add(projectsDir);
      for (const event of ["add", "unlink", "addDir", "unlinkDir", "change"] as const) {
        server.watcher.on(event, notify);
      }
    },

    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "scenes.json",
        source: JSON.stringify(scanProjects(projectsDir)),
      });
    },
  };
}
