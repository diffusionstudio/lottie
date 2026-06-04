import CanvasKitInit, {
  type CanvasKit,
  type Surface,
  type ManagedSkottieAnimation,
} from "canvaskit-wasm/full";

import { Camera } from "@/lib/camera";

let canvasKitPromise: Promise<CanvasKit> | null = null;

/** Loads (and caches) the CanvasKit WASM module. */
export function loadCanvasKit(): Promise<CanvasKit> {
  if (!canvasKitPromise) {
    canvasKitPromise = CanvasKitInit({
      // The wasm binary is copied into /public by scripts/copy-canvaskit.mjs.
      locateFile: () => "/canvaskit.wasm",
    });
  }
  return canvasKitPromise;
}

// How aggressively a wheel/pinch gesture changes zoom.
const ZOOM_SENSITIVITY = 0.003;

/** A property the animation has marked as slottable, with its current value. */
export type AnimationSlot =
  | { id: string; type: "scalar"; value: number }
  | { id: string; type: "color"; value: [number, number, number, number] }
  | { id: string; type: "vec2"; value: [number, number] }
  | { id: string; type: "text"; value: string };

export interface LottiePlayerCallbacks {
  /** Fired every rendered frame with the playhead frame and total frame count. */
  onFrame?: (currentFrame: number, totalFrames: number) => void;
  /** Fired whenever the play/pause state changes. */
  onPlayStateChange?: (playing: boolean) => void;
  /** Fired whenever the camera (pan/zoom) changes, with the current zoom factor. */
  onCameraChange?: (zoom: number) => void;
}

/**
 * Renders a Lottie animation onto a <canvas> using Skia's Skottie module via
 * CanvasKit. Owns its own requestAnimationFrame loop and a WebGL surface that
 * is recreated on resize. The playhead is tracked in frames; playback advances
 * it off wall-clock time scaled by the animation's fps, so it plays at native
 * speed regardless of the render frame rate.
 *
 * A {@link Camera} provides Figma-style pan/zoom over the whole scene: scroll
 * to pan, ⌘/ctrl+scroll or pinch to zoom (anchored on the cursor), drag to pan,
 * and double-click to reset.
 */
export class LottiePlayer {
  private surface: Surface | null = null;
  private rafId = 0;
  private playing = false;
  private currentFrame = 0;
  private lastTs = 0;
  private dirty = true;
  private readonly fps: number;
  private readonly totalFrames: number;

  private readonly camera = new Camera();
  private dragging = false;

  constructor(
    private readonly ck: CanvasKit,
    private readonly canvas: HTMLCanvasElement,
    private readonly animation: ManagedSkottieAnimation,
    private readonly callbacks: LottiePlayerCallbacks = {}
  ) {
    this.fps = animation.fps() || 60;
    this.totalFrames = Math.max(1, Math.round(animation.duration() * this.fps));
    this.resize();
    this.attachInput();
    this.rafId = requestAnimationFrame(this.tick);
  }

  /** Builds a player from a Lottie JSON string, loading CanvasKit if needed. */
  static async create(
    canvas: HTMLCanvasElement,
    lottieJson: string,
    callbacks?: LottiePlayerCallbacks
  ): Promise<LottiePlayer> {
    const ck = await loadCanvasKit();
    const animation = ck.MakeManagedAnimation(lottieJson);
    if (!animation) {
      throw new Error("CanvasKit could not parse the Lottie file.");
    }
    return new LottiePlayer(ck, canvas, animation, callbacks);
  }

  getFps(): number {
    return this.fps;
  }

  getTotalFrames(): number {
    return this.totalFrames;
  }

  getZoom(): number {
    return this.camera.zoom;
  }

  // --- Slots (live property overrides) ------------------------------------
  //
  // Skottie exposes properties the animation author marked as "slottable" (see
  // the `slots`/`sid` convention in the write-lottie skill). They can be read
  // and overwritten live without re-parsing — overriding one just shows on the
  // next rendered frame. `getSlotInfo()` reports the IDs grouped by type.

  /** Lists every slottable property with its current value. */
  getSlots(): AnimationSlot[] {
    const info = this.animation.getSlotInfo();
    const slots: AnimationSlot[] = [];
    for (const id of info.scalarSlotIDs) {
      slots.push({ id, type: "scalar", value: this.animation.getScalarSlot(id) ?? 0 });
    }
    for (const id of info.colorSlotIDs) {
      const c = this.animation.getColorSlot(id);
      slots.push({
        id,
        type: "color",
        value: c ? [c[0], c[1], c[2], c[3]] : [0, 0, 0, 1],
      });
    }
    for (const id of info.vec2SlotIDs) {
      const v = this.animation.getVec2Slot(id);
      slots.push({ id, type: "vec2", value: v ? [v[0], v[1]] : [0, 0] });
    }
    for (const id of info.textSlotIDs) {
      slots.push({ id, type: "text", value: this.animation.getTextSlot(id)?.text ?? "" });
    }
    return slots;
  }

  /** Overrides a scalar slot. Color/vec2 components are 0..1 / animation units. */
  setScalarSlot(id: string, value: number): void {
    this.animation.setScalarSlot(id, value);
    this.dirty = true;
  }

  /** Overrides a color slot. Components are 0..1, RGBA. */
  setColorSlot(id: string, rgba: [number, number, number, number]): void {
    this.animation.setColorSlot(id, this.ck.Color4f(rgba[0], rgba[1], rgba[2], rgba[3]));
    this.dirty = true;
  }

  /** Overrides a 2D vector slot (e.g. a position), in animation coordinates. */
  setVec2Slot(id: string, xy: [number, number]): void {
    this.animation.setVec2Slot(id, xy);
    this.dirty = true;
  }

  /** Overrides a text slot's string, preserving the slot's existing styling. */
  setTextSlot(id: string, text: string): void {
    const current = this.animation.getTextSlot(id);
    if (!current) return;
    current.text = text;
    // The constructor fills out any fields the bindings require as defaults.
    this.animation.setTextSlot(id, new this.ck.SlottableTextProperty(current));
    this.dirty = true;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  play(): void {
    if (this.playing) return;
    this.playing = true;
    this.lastTs = 0; // reset so the first tick after resume has no jump
    this.callbacks.onPlayStateChange?.(true);
  }

  pause(): void {
    if (!this.playing) return;
    this.playing = false;
    this.callbacks.onPlayStateChange?.(false);
  }

  toggle(): void {
    this.playing ? this.pause() : this.play();
  }

  /** Seeks to an absolute frame. */
  seek(frame: number): void {
    this.currentFrame = Math.max(0, Math.min(frame, this.totalFrames));
    this.dirty = true;
    this.callbacks.onFrame?.(this.currentFrame, this.totalFrames);
  }

  /** Zooms by `factor` around the canvas center (for on-screen +/- controls). */
  zoomByCentered(factor: number): void {
    this.camera.zoomAt(factor, this.canvas.width / 2, this.canvas.height / 2);
    this.onCameraChanged();
  }

  /** Resets pan/zoom back to the fitted view. */
  resetCamera(): void {
    this.camera.reset();
    this.onCameraChanged();
  }

  /** Syncs the backing store to the element's CSS size and recreates the surface. */
  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
    if (this.canvas.width === width && this.canvas.height === height && this.surface) {
      return;
    }
    this.canvas.width = width;
    this.canvas.height = height;

    this.surface?.delete();
    const surface = this.ck.MakeWebGLCanvasSurface(this.canvas);
    if (!surface) {
      throw new Error("Could not create a WebGL surface for CanvasKit.");
    }
    this.surface = surface;
    this.dirty = true;
  }

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    this.detachInput();
    this.surface?.delete();
    this.surface = null;
    this.animation.delete();
  }

  // --- Camera input -------------------------------------------------------

  private attachInput(): void {
    this.canvas.style.cursor = "grab";
    this.canvas.style.touchAction = "none";
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("dblclick", this.onDoubleClick);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
  }

  private detachInput(): void {
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("dblclick", this.onDoubleClick);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
  }

  /** Converts viewport coordinates to the canvas's device-pixel space. */
  private toDevice(clientX: number, clientY: number): { x: number; y: number } {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    return { x: (clientX - rect.left) * dpr, y: (clientY - rect.top) * dpr };
  }

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    // Trackpad pinch arrives as a wheel event with ctrlKey set; ⌘/ctrl+scroll
    // zooms too. A plain scroll pans.
    if (e.ctrlKey || e.metaKey) {
      const { x, y } = this.toDevice(e.clientX, e.clientY);
      this.camera.zoomAt(Math.exp(-e.deltaY * ZOOM_SENSITIVITY), x, y);
    } else {
      const dpr = window.devicePixelRatio || 1;
      this.camera.panBy(-e.deltaX * dpr, -e.deltaY * dpr);
    }
    this.onCameraChanged();
  };

  private onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0 && e.button !== 1) return; // left or middle drag
    this.dragging = true;
    this.canvas.style.cursor = "grabbing";
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.dragging) return;
    const dpr = window.devicePixelRatio || 1;
    this.camera.panBy(e.movementX * dpr, e.movementY * dpr);
    this.onCameraChanged();
  };

  private onPointerUp = (): void => {
    if (!this.dragging) return;
    this.dragging = false;
    this.canvas.style.cursor = "grab";
  };

  private onDoubleClick = (): void => {
    this.camera.reset();
    this.onCameraChanged();
  };

  private onCameraChanged(): void {
    this.dirty = true;
    this.callbacks.onCameraChange?.(this.camera.zoom);
  }

  // --- Rendering ----------------------------------------------------------

  private tick = (ts: number): void => {
    if (this.playing) {
      if (this.lastTs !== 0) {
        const dt = (ts - this.lastTs) / 1000;
        this.currentFrame += dt * this.fps;
        if (this.currentFrame >= this.totalFrames) {
          this.currentFrame %= this.totalFrames; // loop
        }
      }
      this.lastTs = ts;
      this.draw();
      this.callbacks.onFrame?.(this.currentFrame, this.totalFrames);
    } else if (this.dirty) {
      this.draw();
    }
    this.dirty = false;
    this.rafId = requestAnimationFrame(this.tick);
  };

  private draw(): void {
    if (!this.surface) return;
    const canvas = this.surface.getCanvas();
    canvas.clear(this.ck.TRANSPARENT);

    const [w, h] = this.animation.size();
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const scale = Math.min(cw / w, ch / h);
    const dw = w * scale;
    const dh = h * scale;
    const left = (cw - dw) / 2;
    const top = (ch - dh) / 2;

    canvas.save();
    this.camera.apply(canvas);
    this.animation.seekFrame(this.currentFrame);
    this.animation.render(canvas, this.ck.LTRBRect(left, top, left + dw, top + dh));
    canvas.restore();

    this.surface.flush();
  }
}
