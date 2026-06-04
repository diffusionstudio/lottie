import { useEffect, useRef, useState } from "react";

import { PlaybackControls } from "@/components/PlaybackControls";
import { PropertiesPanel, type ControlMeta } from "@/components/PropertiesPanel";
import { ZoomControls } from "@/components/ZoomControls";
import { LottiePlayer, type AnimationSlot } from "@/lib/lottie-player";

// The Lottie file lives in /public and is fetched at startup.
const LOTTIE_URL = "/lottie.json";
// Optional sidecar describing how to present the animation's slottable
// properties (labels, slider ranges). Missing file = no properties panel.
const CONTROLS_URL = "/controls.json";

async function loadControlsMeta(): Promise<Record<string, ControlMeta>> {
  try {
    const res = await fetch(CONTROLS_URL);
    if (!res.ok) return {};
    const data = (await res.json()) as { controls?: ControlMeta[] };
    return Object.fromEntries((data.controls ?? []).map((c) => [c.sid, c]));
  } catch {
    return {};
  }
}

/**
 * Writes the panel's current slot values into a copy of the original Lottie
 * JSON and triggers a download. Slot definitions live under the top-level
 * `slots` map keyed by sid; scalar/color/vec2 values sit at `p.k`, text at
 * `p.p.t` (see the write-lottie skill).
 */
function downloadConfiguredLottie(
  lottieJson: string,
  slots: AnimationSlot[],
  values: Record<string, AnimationSlot["value"]>
) {
  const doc = JSON.parse(lottieJson) as {
    slots?: Record<string, { p?: { k?: unknown; p?: { t?: string } } }>;
  };

  for (const slot of slots) {
    const def = doc.slots?.[slot.id]?.p;
    if (!def) continue;
    const value = values[slot.id] ?? slot.value;
    if (slot.type === "text") {
      if (def.p) def.p.t = value as string;
    } else {
      def.k = value;
    }
  }

  const blob = new Blob([JSON.stringify(doc)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lottie.json";
  a.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<LottiePlayer | null>(null);
  const lottieJsonRef = useRef<string>("");

  const [playing, setPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [fps, setFps] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [slots, setSlots] = useState<AnimationSlot[]>([]);
  const [controlsMeta, setControlsMeta] = useState<Record<string, ControlMeta>>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;

    (async () => {
      try {
        const res = await fetch(LOTTIE_URL);
        if (!res.ok) {
          throw new Error(`Failed to load ${LOTTIE_URL} (HTTP ${res.status})`);
        }
        const [json, meta] = await Promise.all([res.text(), loadControlsMeta()]);
        if (disposed) return;
        lottieJsonRef.current = json;

        const player = await LottiePlayer.create(canvas, json, {
          onFrame: (frame, total) => {
            setCurrentFrame(frame);
            setTotalFrames(total);
          },
          onPlayStateChange: setPlaying,
          onCameraChange: setZoom,
        });
        if (disposed) {
          player.dispose();
          return;
        }
        playerRef.current = player;
        setTotalFrames(player.getTotalFrames());
        setFps(player.getFps());
        setSlots(player.getSlots());
        setControlsMeta(meta);
        player.play();
      } catch (e) {
        if (!disposed) setError(e instanceof Error ? e.message : String(e));
      }
    })();

    const observer = new ResizeObserver(() => playerRef.current?.resize());
    observer.observe(canvas);

    return () => {
      disposed = true;
      observer.disconnect();
      playerRef.current?.dispose();
      playerRef.current = null;
    };
  }, []);

  return (
    <div className="dark relative h-full w-full overflow-hidden bg-neutral-950">
      <canvas ref={canvasRef} className="block h-full w-full" />

      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="pointer-events-none absolute left-0 top-0 flex justify-end p-4 sm:p-6">
        <ZoomControls
          zoom={zoom}
          onZoomIn={() => playerRef.current?.zoomByCentered(1.2)}
          onZoomOut={() => playerRef.current?.zoomByCentered(1 / 1.2)}
          onReset={() => playerRef.current?.resetCamera()}
        />
      </div>

      <div className="pointer-events-none absolute right-0 top-0 flex max-h-full flex-col p-4 sm:p-6">
        <div className="overflow-y-auto">
          <PropertiesPanel
            slots={slots}
            meta={controlsMeta}
            onScalar={(id, v) => playerRef.current?.setScalarSlot(id, v)}
            onColor={(id, rgba) => playerRef.current?.setColorSlot(id, rgba)}
            onVec2={(id, xy) => playerRef.current?.setVec2Slot(id, xy)}
            onText={(id, v) => playerRef.current?.setTextSlot(id, v)}
            onExport={(values) =>
              downloadConfiguredLottie(lottieJsonRef.current, slots, values)
            }
          />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4 sm:p-6">
        <PlaybackControls
          playing={playing}
          currentFrame={currentFrame}
          totalFrames={totalFrames}
          fps={fps}
          onToggle={() => playerRef.current?.toggle()}
          onSeek={(frame) => playerRef.current?.seek(frame)}
        />
      </div>
    </div>
  );
}
