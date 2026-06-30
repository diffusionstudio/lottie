import { Accessor, createContext, createEffect, createResource, createMemo, createSignal, onCleanup, onMount, Resource, untrack, useContext, type JSX } from 'solid-js';
import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import { ControlMeta, AnimationSlot, Scene } from '@/types';
import { useScenes } from '@/context/scenes';
import { getCanvasKit } from '@/lib/canvaskit';
import { loadScene } from '@/lib/scene';
import { applySlotValues, readTextSlotValue, type LottieDoc } from '@/lib/lottie';
import { parseLottieFile, createSceneFromDoc } from '@/lib/import';

import type { CanvasKit, Surface, ManagedSkottieAnimation, Font, Paint, Typeface } from "canvaskit-wasm/full";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 32;
const ZOOM_SENSITIVITY = 0.003;
const INITIAL_MARGIN_Y = 100; // CSS px above and below the animation
const LABEL_FONT_SIZE = 11; // CSS px, screen space (does not scale with zoom)
const LABEL_GAP_Y = 7; // CSS px between the label baseline and the frame
const LABEL_MIN_WIDTH = 24; // CSS px the label may occupy on a tiny frame
const LABEL_FONT_URL = new URL('@/assets/fonts/Inter-VariableFont_opsz,wght.ttf', import.meta.url).toString();

const CanvasContext = createContext<{
  zoom: Accessor<number>;
  playing: Accessor<boolean>;
  currentFrame: Accessor<number>;
  totalFrames: Accessor<number>;
  fps: Accessor<number>;
  slots: Accessor<AnimationSlot[]>;
  controls: Resource<Record<string, ControlMeta>>;
  setScalarSlot(id: string, value: number): void;
  setColorSlot(id: string, rgba: [number, number, number, number]): void;
  setVec2Slot(id: string, xy: [number, number]): void;
  setTextSlot(id: string, text: string): void;
  commitSource(): void;
  togglePlayback(): void;
  seek(frame: number): void;
  zoomByCentered(factor: number): void;
  resetCamera(): void;
}>();

export function CanvasProvider(props: { children: JSX.Element }) {
  let surface: Surface | null = null;
  let canvas!: HTMLCanvasElement;
  let labelFont: Font | null = null;
  let labelPaint: Paint | null = null;
  let rafId: number | null = null;
  let dragging = false;
  let lastTs = 0;
  let dirty = true;
  let sourceDirty = false; // a control was edited but not yet written to source

  const observer = new ResizeObserver(() => resize());
  const params = useParams();
  const navigate = useNavigate();
  const { findScene } = useScenes();
  const [searchParams] = useSearchParams();
  const [playing, setPlaying] = createSignal(false);
  const [currentFrame, setCurrentFrame] = createSignal(0);
  const [canvasKit] = createResource(getCanvasKit);
  const [textOverrides, setTextOverrides] = createSignal<Record<string, string>>({});
  const currentScene = createMemo(() => {
    const { project, scene } = params;
    if (!project || !scene) return null;
    return findScene(project, scene) ?? null;
  });
  const [sceneData, { refetch: refetchScene }] = createResource(currentScene, loadScene);
  const sourceDoc = createMemo<LottieDoc | null>(() => {
    const json = sceneData()?.json;
    if (!json) return null;
    try {
      return JSON.parse(json) as LottieDoc;
    } catch {
      return null;
    }
  });

  onMount(() => {
    import.meta.hot?.on("scene:source", (data: { lottie: string }) => {
      if (currentScene()?.lottie === data.lottie) {
        refetchScene();
      }
    });
  });

  const [controls] = createResource(currentScene, loadControlsMeta);
  const [labelTypeface] = createResource(canvasKit, loadLabelTypeface);
  const [camera, setCamera] = createSignal({
    x: 0,
    y: 0,
    zoom: 1,
  });
  const zoom = () => camera().zoom;
  const animation = createMemo<ManagedSkottieAnimation | null>((prev) => {
    prev?.delete(); // dispose the previous scene's animation on swap
    const ck = canvasKit();
    const data = sceneData();
    if (!ck || !data) return null;
    return ck.MakeManagedAnimation(data.json, data.assets);
  });
  const animationName = createMemo(() => {
    const nm = sourceDoc()?.nm;
    if (typeof nm === "string" && nm.trim()) return nm.trim();
    return "Animation 1";
  });

  const fps = createMemo(() => {
    const anim = animation();
    if (!anim) return 0;
    return anim.fps() || 60;
  });

  const totalFrames = createMemo(() => {
    const anim = animation();
    if (!anim) return 0;
    return Math.max(1, Math.round(anim.duration() * fps()));
  });

  const slots = createMemo(() => {
    const anim = animation();
    return anim ? readSlots(anim, sourceDoc(), textOverrides()) : [];
  });

  createEffect(() => {
    sceneData()?.json;
    setTextOverrides({});
  });

  createEffect(() => {
    if (canvasKit()) resize();
  });

  createEffect(() => {
    const ck = canvasKit();
    const typeface = labelTypeface();
    if (!ck || !typeface || labelPaint) return;
    labelPaint = new ck.Paint();
    labelPaint.setColor(ck.Color4f(0.64, 0.64, 0.64, 1)); // matches muted-foreground
    labelPaint.setAntiAlias(true);
    labelFont = new ck.Font(typeface, LABEL_FONT_SIZE);
    dirty = true;
  });

  createEffect(() => {
    if (animation()) resetCamera();
  });

  createEffect(() => {
    if (playing()) { lastTs = 0; }
  });

  // Autoplay on the very first scene load; on later scene switches we restart
  // at frame 0 but keep whatever play/pause state the user was in.
  let autoplayPending = true;
  createEffect(() => {
    const raw = searchParams.frame;
    currentScene(); // restart playback whenever the scene changes
    totalFrames(); // re-run once the animation has loaded so seek() can clamp against a real length
    untrack(() => {
      const frame = raw != null ? Number(raw) : null;
      if (frame != null && Number.isFinite(frame)) {
        setPlaying(false);
        seek(frame);
      } else {
        if (autoplayPending) setPlaying(true);
        seek(0);
      }
      autoplayPending = false;
    });
  });

  let timer: number | undefined;
  createEffect(() => {
    const project = params.project ?? null;
    const scene = params.scene ?? null;
    const isPlaying = playing();
    const frame = isPlaying ? untrack(currentFrame) : currentFrame();
    const payload = {
      project,
      scene,
      playing: isPlaying,
      frame: Math.round(frame),
      totalFrames: untrack(totalFrames),
      fps: untrack(fps),
    };
    clearTimeout(timer); // coalesce rapid scrubs into one post
    timer = window.setTimeout(() => {
      void fetch("/__context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => { });
    }, 60);
  });

  onCleanup(() => clearTimeout(timer));

  const setScalarSlot = (id: string, value: number) => {
    animation()?.setScalarSlot(id, value);
    dirty = true;
    sourceDirty = true;
  }

  const setColorSlot = (id: string, rgba: [number, number, number, number]) => {
    const ck = canvasKit();
    if (!ck) return;
    animation()?.setColorSlot(id, ck.Color4f(rgba[0], rgba[1], rgba[2], rgba[3]));
    dirty = true;
    sourceDirty = true;
  }

  const setVec2Slot = (id: string, xy: [number, number]) => {
    animation()?.setVec2Slot(id, xy);
    dirty = true;
    sourceDirty = true;
  }

  // setText() targets a text layer by name, so map a slot id to its layer(s).
  const textLayersForSlot = (slotId: string): { key: string; size: number }[] => {
    const doc = sourceDoc();
    if (!doc) return [];
    const out: { key: string; size: number }[] = [];
    for (const layer of doc.layers ?? []) {
      if (layer.ty !== 5 || !layer.nm || layer.t?.d?.sid !== slotId) continue;
      const k = layer.t.d.k;
      const size = Array.isArray(k) ? k[0]?.s?.s : undefined;
      out.push({ key: layer.nm, size: typeof size === "number" ? size : 0 });
    }
    return out;
  };

  const setTextSlot = (id: string, text: string) => {
    setTextOverrides((value) => ({ ...value, [id]: text }));
    // Use setText, not setTextSlot: in canvaskit-wasm 0.41.1 setTextSlot doesn't
    // re-shape the layer and locks later setText calls. setText re-shapes each
    // edit; commit persists from source JSON plus the override above.
    const anim = animation();
    for (const { key, size } of textLayersForSlot(id)) {
      anim?.setText(key, text, size);
    }
    dirty = true;
    sourceDirty = true;
  }

  const commitSource = async () => {
    if (!sourceDirty) return;

    const scene = currentScene();
    const data = sceneData();
    const anim = animation();
    const project = params.project;
    const sceneSlug = params.scene;
    if (!scene || !data || !anim || !project || !sceneSlug) return;

    let doc: LottieDoc;
    try {
      doc = JSON.parse(data.json);
    } catch {
      return;
    }
    applySlotValues(doc, readSlots(anim, doc, textOverrides()));

    const res = await fetch("/__scenes/lottie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project, scene: sceneSlug, doc }),
    });
    if (!res.ok) {
      console.error(`Failed to save lottie source (HTTP ${res.status})`);
      return;
    }

    sourceDirty = false;
  };

  const togglePlayback = () => setPlaying((v) => !v);

  const seek = (frame: number) => {
    setCurrentFrame(Math.max(0, Math.min(frame, totalFrames())))
    dirty = true;
  };

  const resize = () => {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));

    if (canvas.width === width && canvas.height === height && surface) {
      return;
    }

    canvas.width = width;
    canvas.height = height;
    const ck = canvasKit();

    if (!ck) return;

    surface?.delete();
    surface = ck.MakeWebGLCanvasSurface(canvas);
    if (!surface) {
      throw new Error("Could not create a WebGL surface for CanvasKit.");
    }
    dirty = true;
  }

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const cx = (e.clientX - rect.left) * dpr;
      const cy = (e.clientY - rect.top) * dpr;
      const factor = Math.exp(-e.deltaY * ZOOM_SENSITIVITY);
      const next = clamp(zoom() * factor, MIN_ZOOM, MAX_ZOOM);
      const applied = next / zoom();
      setCamera(cam => ({
        ...cam,
        x: cx - (cx - cam.x) * applied,
        y: cy - (cy - cam.y) * applied,
        zoom: next,
      }));
    } else {
      const dpr = window.devicePixelRatio || 1;
      setCamera(cam => ({
        ...cam,
        x: cam.x - e.deltaX * dpr,
        y: cam.y - e.deltaY * dpr,
      }));
    }

    dirty = true;
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.button !== 1) return; // left or middle drag
    dragging = true;
    canvas.style.cursor = "grabbing";
    dirty = true;
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dpr = window.devicePixelRatio || 1;
    setCamera(cam => ({
      ...cam,
      x: cam.x + e.movementX * dpr,
      y: cam.y + e.movementY * dpr,
    }));
    dirty = true;
  };

  const onPointerUp = () => {
    if (!dragging) return;
    dragging = false;
    canvas.style.cursor = "grab";
    dirty = true;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    // don't hijack keys while typing in an input, textarea, or contenteditable
    if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) {
      return;
    }

    if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
      togglePlayback();
      return;
    }

    // Arrow keys step the playhead: left/right by one frame, up/down by one second.
    const step = ({
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowUp: fps(),
      ArrowDown: -fps(),
    } as Record<string, number>)[e.key];
    if (step === undefined) return;
    e.preventDefault();
    setPlaying(false);
    const last = Math.max(0, totalFrames() - 1);
    seek(Math.min(Math.round(currentFrame()) + step, last));
  };

  // Accept a Lottie file dragged onto the canvas, but only when files are being
  // dragged (ignore in-app drags) — preventDefault enables the drop.
  const onDragOver = (e: DragEvent) => {
    if (!e.dataTransfer || !Array.from(e.dataTransfer.items).some((i) => i.kind === "file")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  // Drop a .json/.lottie file to add it as a new scene (next index), then open it.
  const onDrop = async (e: DragEvent) => {
    const file = e.dataTransfer?.files?.[0];
    const name = file?.name.toLowerCase() ?? "";
    if (!file || (!name.endsWith(".json") && !name.endsWith(".lottie"))) return;
    e.preventDefault();

    const project = params.project;
    if (!project) return;
    try {
      const doc = await parseLottieFile(file);
      const { project: proj, scene } = await createSceneFromDoc(project, doc);
      navigate(`/${proj}/${scene}`);
    } catch (err) {
      console.error("Failed to import dropped Lottie file:", err);
    }
  };

  const resetCamera = () => {
    const anim = animation();
    if (!anim) return;
    const dpr = window.devicePixelRatio || 1;
    const [w, h] = anim.size();
    const cw = canvas.width;
    const ch = canvas.height;
    if (!cw || !ch || !w || !h) return;
    const dh = h * Math.min(cw / w, ch / h);
    const zoom = clamp((ch - 2 * INITIAL_MARGIN_Y * dpr) / dh, MIN_ZOOM, MAX_ZOOM);
    setCamera({
      x: (cw / 2) * (1 - zoom),
      y: (ch / 2) * (1 - zoom),
      zoom,
    });
    dirty = true;
  }

  const tick = (ts: number) => {
    const ck = canvasKit();
    const ctx = surface?.getCanvas();
    const anim = animation();

    if (playing() && totalFrames() > 0) {
      if (!lastTs) lastTs = ts; // first tick after play(): no elapsed time yet
      const dt = (ts - lastTs) / 1000;
      setCurrentFrame((currentFrame() + dt * fps()) % totalFrames());
      lastTs = ts;
      dirty = true;
    }

    if (dirty && ctx && ck && anim) {
      ctx.clear(ck.TRANSPARENT);

      const { x, y, zoom } = camera();
      const [w, h] = anim.size();
      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.min(cw / w, ch / h);
      const dw = w * scale;
      const dh = h * scale;
      const left = (cw - dw) / 2;
      const top = (ch - dh) / 2;

      ctx.save();
      ctx.translate(x, y);
      ctx.scale(zoom, zoom);
      anim.seekFrame(currentFrame());
      anim.render(ctx, ck.LTRBRect(left, top, left + dw, top + dh));
      ctx.restore();

      if (labelFont && labelPaint) {
        const dpr = window.devicePixelRatio || 1;
        labelFont.setSize(LABEL_FONT_SIZE * dpr);
        const maxWidth = Math.max(zoom * dw, LABEL_MIN_WIDTH * dpr);
        const text = fitLabel(labelFont, animationName(), maxWidth);
        if (text) {
          ctx.drawText(text, x + zoom * left, y + zoom * top - LABEL_GAP_Y * dpr, labelPaint, labelFont);
        }
      }

      surface?.flush();
      dirty = false;
    }

    rafId = requestAnimationFrame(tick);
  };

  const zoomByCentered = (factor: number) => {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const next = clamp(zoom() * factor, MIN_ZOOM, MAX_ZOOM);
    const applied = next / zoom();
    setCamera(cam => ({
      ...cam,
      x: cx - (cx - cam.x) * applied,
      y: cy - (cy - cam.y) * applied,
      zoom: next,
    }));
    dirty = true;
  };

  onMount(() => {
    observer.observe(canvas);
    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none";
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("dblclick", resetCamera);
    canvas.addEventListener("dragover", onDragOver);
    canvas.addEventListener("drop", onDrop);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("keydown", onKeyDown);

    if (!rafId) rafId = requestAnimationFrame(tick);
  });

  onCleanup(() => {
    surface?.delete();
    surface = null;
    labelFont?.delete();
    labelFont = null;
    labelPaint?.delete();
    labelPaint = null;
    labelTypeface()?.delete();
    animation()?.delete();

    canvas.removeEventListener("wheel", onWheel);
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("dblclick", resetCamera);
    canvas.removeEventListener("dragover", onDragOver);
    canvas.removeEventListener("drop", onDrop);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("keydown", onKeyDown);

    if (rafId) cancelAnimationFrame(rafId);
  });

  return (
    <CanvasContext.Provider
      value={{
        zoom,
        playing,
        currentFrame,
        totalFrames,
        fps,
        slots,
        controls,
        setScalarSlot,
        setColorSlot,
        setVec2Slot,
        setTextSlot,
        commitSource,
        togglePlayback,
        seek,
        zoomByCentered,
        resetCamera,
      }}>
      <div class="relative h-screen w-screen bg-canvas">
        <canvas ref={canvas} id="main-canvas" class="block h-full w-full" />
        {props.children}
      </div>
    </CanvasContext.Provider>
  );
}

export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
}

function readSlots(
  anim: ManagedSkottieAnimation,
  sourceDoc: LottieDoc | null | undefined,
  textOverrides: Record<string, string>,
): AnimationSlot[] {
  const info = anim.getSlotInfo();
  const slots: AnimationSlot[] = [];
  for (const id of info.scalarSlotIDs) {
    slots.push({ id, type: "scalar", value: anim.getScalarSlot(id) ?? 0 });
  }
  for (const id of info.colorSlotIDs) {
    const c = anim.getColorSlot(id);
    slots.push({
      id,
      type: "color",
      value: c ? [c[0], c[1], c[2], c[3]] : [0, 0, 0, 1],
    });
  }
  for (const id of info.vec2SlotIDs) {
    const v = anim.getVec2Slot(id);
    slots.push({ id, type: "vec2", value: v ? [v[0], v[1]] : [0, 0] });
  }
  for (const id of info.textSlotIDs) {
    slots.push({ id, type: "text", value: textOverrides[id] ?? readTextSlotValue(sourceDoc, id) ?? "" });
  }
  return slots;
}

async function loadLabelTypeface(ck: CanvasKit): Promise<Typeface | null> {
  try {
    const res = await fetch(LABEL_FONT_URL);
    if (!res.ok) return null;
    return ck.Typeface.MakeFreeTypeFaceFromData(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function loadControlsMeta(scene: Scene): Promise<Record<string, ControlMeta>> {
  if (!scene.controls) return {};
  try {
    const res = await fetch(scene.controls);
    if (!res.ok) return {};
    const data = (await res.json()) as { controls?: ControlMeta[] };
    return Object.fromEntries((data.controls ?? []).map((c) => [c.sid, c]));
  } catch {
    return {};
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function textWidth(font: Font, text: string): number {
  let width = 0;
  for (const advance of font.getGlyphWidths(font.getGlyphIDs(text))) {
    width += advance;
  }
  return width;
}

// Truncate the label with an ellipsis once it is wider than the frame, like Figma
function fitLabel(font: Font, text: string, maxWidth: number): string {
  if (textWidth(font, text) <= maxWidth) return text;
  const ellipsis = "…";
  const budget = maxWidth - textWidth(font, ellipsis);
  let width = 0;
  let out = "";
  for (const char of text) {
    width += textWidth(font, char);
    if (width > budget) break;
    out += char;
  }
  return out && out + ellipsis;
}
