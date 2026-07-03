import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

const require = createRequire(import.meta.url);

/**
 * Studio: a tiny job queue that bridges the browser and a coding agent.
 *
 * The Studio page (public/studio.html) POSTs a generation request — prompt,
 * options, and an optional grounding image — to `/api/jobs`. Each request is
 * written to `.studio-jobs/<id>/job.json` (plus `input.<ext>` for the image)
 * with `status: "pending"`. A watching agent (Claude Code) picks up pending
 * jobs, authors the Lottie scene under `public/projects/...`, and writes the
 * result back into `job.json` (`status: "done"`, `scene`, `sceneUrl`). The page
 * polls `/api/jobs/<id>` and embeds the player once the scene exists.
 *
 * No API key lives here — the agent is the generation engine.
 */

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

const SAFE_ID = /^[A-Za-z0-9._-]+$/;

// CanvasKit (full/skottie build) is heavy to instantiate — load once, reuse
// across exports.
let canvasKitPromise: Promise<any> | null = null;
function getCanvasKit(binDir: string): Promise<any> {
  if (!canvasKitPromise) {
    const init = require(path.join(binDir, "canvaskit.js"));
    canvasKitPromise = init({ locateFile: (f: string) => path.join(binDir, f) });
  }
  return canvasKitPromise;
}

/** Render a scene frame-by-frame through Skottie and pipe raw RGBA to ffmpeg → MP4. */
async function renderMp4(opts: {
  ck: any; sceneDir: string; doc: any; fps: number;
  bg: [number, number, number] | null; loops: number; ffmpegPath: string;
}): Promise<Buffer> {
  const { ck, sceneDir, doc, fps, bg, loops, ffmpegPath } = opts;

  const assets: Record<string, Buffer> = {};
  for (const a of doc.assets || []) {
    if (a?.p && typeof a.p === "string" && !a.p.startsWith("data:")) {
      const f = path.join(sceneDir, a.p);
      if (fs.existsSync(f)) assets[a.p] = fs.readFileSync(f);
    }
  }

  const W = doc.w || 512, H = doc.h || 512;
  const anim = ck.MakeManagedAnimation(JSON.stringify(doc), assets);
  const total = Math.max(1, Math.round(anim.duration() * anim.fps()));
  const surface = ck.MakeSurface(W, H);
  const canvas = surface.getCanvas();
  // MP4/H.264 has no alpha — composite transparent scenes on a solid colour.
  const [r, g, b] = bg ?? [255, 255, 255];
  const outFile = path.join(os.tmpdir(), `lottie-${crypto.randomUUID()}.mp4`);

  const ff = spawn(ffmpegPath, [
    "-y", "-f", "rawvideo", "-pixel_format", "rgba",
    "-video_size", `${W}x${H}`, "-framerate", String(fps), "-i", "pipe:0",
    "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2,format=yuv420p",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18",
    "-movflags", "+faststart", outFile,
  ]);
  let ffErr = "";
  ff.stderr.on("data", (d) => { ffErr += d.toString(); if (ffErr.length > 4000) ffErr = ffErr.slice(-2000); });
  const closed = new Promise<void>((resolve, reject) => {
    ff.on("error", reject);
    ff.on("close", (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}: ${ffErr.slice(-500)}`)));
  });

  try {
    for (let l = 0; l < loops; l++) {
      for (let f = 0; f < total; f++) {
        anim.seekFrame(f);
        canvas.clear(ck.Color(r, g, b, 255));
        anim.render(canvas, ck.LTRBRect(0, 0, W, H));
        surface.flush();
        const img = surface.makeImageSnapshot();
        const px: Uint8Array = img.readPixels(0, 0, {
          width: W, height: H,
          colorType: ck.ColorType.RGBA_8888,
          alphaType: ck.AlphaType.Unpremul,
          colorSpace: ck.ColorSpace.SRGB,
        });
        img.delete();
        const buf = Buffer.from(px.buffer, px.byteOffset, px.byteLength);
        if (!ff.stdin.write(buf)) await new Promise((res) => ff.stdin.once("drain", res));
      }
    }
    ff.stdin.end();
    await closed;
  } finally {
    surface.delete();
    anim.delete();
  }

  const out = fs.readFileSync(outFile);
  fs.unlink(outFile, () => {});
  return out;
}

interface Job {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: "pending" | "processing" | "done" | "error";
  prompt: string;
  options: Record<string, unknown>;
  imageFile: string | null;
  scene: string | null; // "<project>/<scene>"
  sceneUrl: string | null; // "/<project>/<scene>"
  note: string | null; // agent-facing progress / summary
  error: string | null;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", () => resolve(""));
  });
}

function readJob(jobsDir: string, id: string): Job | null {
  if (!SAFE_ID.test(id)) return null;
  const file = path.join(jobsDir, id, "job.json");
  if (!file.startsWith(jobsDir + path.sep) || !fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as Job;
  } catch {
    return null;
  }
}

function listJobs(jobsDir: string): Job[] {
  if (!fs.existsSync(jobsDir)) return [];
  return fs
    .readdirSync(jobsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => readJob(jobsDir, e.name))
    .filter((j): j is Job => j !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function studioPlugin(): Plugin {
  let jobsDir = "";
  let projectsDir = "";
  let ckBinDir = "";

  return {
    name: "studio-jobs",

    configResolved(config) {
      jobsDir = path.resolve(config.root, ".studio-jobs");
      projectsDir = path.resolve(config.root, "public/projects");
      ckBinDir = path.resolve(config.root, "node_modules/canvaskit-wasm/bin/full");
    },

    configureServer(server) {
      fs.mkdirSync(jobsDir, { recursive: true });

      const json = (res: ServerResponse, status: number, body: unknown) => {
        res.statusCode = status;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(body));
      };

      // connect strips the "/api/jobs" mount prefix, so req.url is "/" (collection)
      // or "/<id>" (single job).
      server.middlewares.use("/api/jobs", async (req, res) => {
        const rest = (req.url || "/").split("?")[0];
        const id = rest.replace(/^\/+/, "").split("/")[0];

        // GET /api/jobs — list
        if (req.method === "GET" && !id) {
          return json(res, 200, { jobs: listJobs(jobsDir) });
        }

        // GET /api/jobs/<id> — single
        if (req.method === "GET" && id) {
          const job = readJob(jobsDir, id);
          return job ? json(res, 200, job) : json(res, 404, { error: "not found" });
        }

        // POST /api/jobs — enqueue a new generation job
        if (req.method === "POST" && !id) {
          let body: Record<string, unknown> = {};
          try {
            body = JSON.parse((await readBody(req)) || "{}");
          } catch {
            return json(res, 400, { error: "invalid JSON body" });
          }
          const prompt = String(body.prompt ?? "").trim();
          if (!prompt) return json(res, 400, { error: "prompt is required" });

          const now = new Date().toISOString();
          const jobId = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;
          const dir = path.join(jobsDir, jobId);
          fs.mkdirSync(dir, { recursive: true });

          let imageFile: string | null = null;
          const image = typeof body.image === "string" ? body.image : "";
          const match = image.match(/^data:([^;]+);base64,(.*)$/s);
          if (match) {
            const ext = MIME_EXT[match[1].toLowerCase()] ?? "bin";
            imageFile = `input.${ext}`;
            fs.writeFileSync(path.join(dir, imageFile), Buffer.from(match[2], "base64"));
          }

          const job: Job = {
            id: jobId,
            createdAt: now,
            updatedAt: now,
            status: "pending",
            prompt,
            options: (body.options as Record<string, unknown>) ?? {},
            imageFile,
            scene: null,
            sceneUrl: null,
            note: null,
            error: null,
          };
          fs.writeFileSync(path.join(dir, "job.json"), JSON.stringify(job, null, 2));
          return json(res, 201, job);
        }

        json(res, 405, { error: "method not allowed" });
      });

      // GET /api/export?project=&scene=&bg=&fps=&loops=  -> download an MP4
      server.middlewares.use("/api/export", async (req, res) => {
        if (req.method !== "GET") return json(res, 405, { error: "method not allowed" });
        try {
          const q = new URL(req.url || "/", "http://x").searchParams;
          const project = q.get("project") || "";
          const scene = q.get("scene") || "";
          if (!SAFE_ID.test(project) || !SAFE_ID.test(scene)) {
            return json(res, 400, { error: "bad project/scene" });
          }
          const sceneDir = path.join(projectsDir, project, scene);
          const lottiePath = path.join(sceneDir, "lottie.json");
          if (!lottiePath.startsWith(projectsDir + path.sep) || !fs.existsSync(lottiePath)) {
            return json(res, 404, { error: "scene not found" });
          }
          const doc = JSON.parse(fs.readFileSync(lottiePath, "utf8"));

          const bgParam = (q.get("bg") || "ffffff").toLowerCase();
          let bg: [number, number, number] | null = [255, 255, 255];
          if (bgParam === "transparent") bg = [255, 255, 255]; // no alpha in mp4
          else if (/^[0-9a-f]{6}$/.test(bgParam)) {
            bg = [parseInt(bgParam.slice(0, 2), 16), parseInt(bgParam.slice(2, 4), 16), parseInt(bgParam.slice(4, 6), 16)];
          }
          const fps = Math.min(60, Math.max(1, Number(q.get("fps")) || doc.fr || 30));
          const loops = Math.min(8, Math.max(1, Number(q.get("loops")) || 1));

          const ffmpegPath: string = require("ffmpeg-static");
          const ck = await getCanvasKit(ckBinDir);
          const buf = await renderMp4({ ck, sceneDir, doc, fps, bg, loops, ffmpegPath });

          res.statusCode = 200;
          res.setHeader("Content-Type", "video/mp4");
          res.setHeader("Content-Length", String(buf.length));
          res.setHeader("Content-Disposition", `attachment; filename="${project}-${scene}.mp4"`);
          res.end(buf);
        } catch (e) {
          const msg = String((e as Error)?.message ?? e);
          const hint = msg.includes("ENOENT") ? "ffmpeg binary not found (ffmpeg-static)" : msg;
          json(res, 500, { error: hint });
        }
      });

      // Convenience: /studio -> the Studio page.
      server.middlewares.use("/studio", (req, res, next) => {
        if (req.url && req.url !== "/" && req.url !== "") return next();
        res.statusCode = 302;
        res.setHeader("Location", "/studio.html");
        res.end();
      });
    },
  };
}
