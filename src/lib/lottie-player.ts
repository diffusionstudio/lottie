import CanvasKitInit, {
  type CanvasKit,
  type Surface,
  type ManagedSkottieAnimation,
} from "canvaskit-wasm/full";

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

export interface LottiePlayerCallbacks {
  /** Fired every rendered frame with playhead position and total duration (seconds). */
  onFrame?: (currentTime: number, duration: number) => void;
  /** Fired whenever the play/pause state changes. */
  onPlayStateChange?: (playing: boolean) => void;
}

/**
 * Renders a Lottie animation onto a <canvas> using Skia's Skottie module via
 * CanvasKit. Owns its own requestAnimationFrame loop and a WebGL surface that
 * is recreated on resize. Drives the animation off wall-clock time so playback
 * speed is independent of the render frame rate.
 */
export class LottiePlayer {
  private surface: Surface | null = null;
  private rafId = 0;
  private playing = false;
  private currentTime = 0;
  private lastTs = 0;
  private readonly duration: number;

  constructor(
    private readonly ck: CanvasKit,
    private readonly canvas: HTMLCanvasElement,
    private readonly animation: ManagedSkottieAnimation,
    private readonly callbacks: LottiePlayerCallbacks = {}
  ) {
    this.duration = animation.duration();
    this.resize();
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

  getDuration(): number {
    return this.duration;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  play(): void {
    if (this.playing) return;
    this.playing = true;
    this.lastTs = 0; // reset so the first frame after resume has no jump
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

  /** Seeks to an absolute time in seconds. */
  seek(seconds: number): void {
    this.currentTime = Math.max(0, Math.min(seconds, this.duration));
    this.lastTs = 0;
    this.draw();
    this.callbacks.onFrame?.(this.currentTime, this.duration);
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
    this.draw();
  }

  dispose(): void {
    cancelAnimationFrame(this.rafId);
    this.surface?.delete();
    this.surface = null;
    this.animation.delete();
  }

  private tick = (ts: number): void => {
    if (this.playing) {
      if (this.lastTs !== 0) {
        const dt = (ts - this.lastTs) / 1000;
        this.currentTime += dt;
        if (this.currentTime >= this.duration) {
          this.currentTime %= this.duration; // loop
        }
      }
      this.lastTs = ts;
      this.draw();
      this.callbacks.onFrame?.(this.currentTime, this.duration);
    }
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

    this.animation.seek(this.duration > 0 ? this.currentTime / this.duration : 0);
    this.animation.render(canvas, this.ck.LTRBRect(left, top, left + dw, top + dh));
    this.surface.flush();
  }
}
