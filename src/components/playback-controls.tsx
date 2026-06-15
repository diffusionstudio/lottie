import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useCanvas } from "@/context/canvas";

export function PlaybackControls() {
  const { playing, currentFrame, totalFrames, fps, togglePlayback, seek } = useCanvas();

  const max = () => Math.max(0, totalFrames() - 1);
  const frame = () => Math.min(Math.round(currentFrame()), max());
  const pad = () => String(max()).length;

  return (
    <div class="flex justify-center p-1.5 rounded-2xl w-full max-w-xl gap-3 bg-background border border-border items-center">
      <Button
        size="icon"
        variant="secondary"
        onClick={togglePlayback}
      >
        <Icon name={playing() ? "controls-pause" : "controls-play"} class="text-foreground" />
      </Button>

      <Slider
        class="flex-1"
        minValue={0}
        maxValue={max() || 1}
        step={1}
        value={[frame()]}
        onChange={([v]) => seek(v)}
      />

      <span class="shrink-0 text-right font-mono text-xxs tabular-nums text-muted-foreground font-normal">
        <span class="text-foreground">{String(frame()).padStart(pad(), "0")}</span>
        {" / "}
        {max()}
      </span>
      <div class="h-5 w-px bg-border" />
      <span class="text-muted-foreground text-xxs font-mono font-normal pr-2">{fps()}FPS</span>
    </div>
  );
}
