import { Pause, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

function formatTime(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  const cs = Math.floor((safe * 100) % 100);
  return `${m}:${s.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

interface PlaybackControlsProps {
  playing: boolean;
  currentTime: number;
  duration: number;
  onToggle: () => void;
  onSeek: (seconds: number) => void;
}

export function PlaybackControls({
  playing,
  currentTime,
  duration,
  onToggle,
  onSeek,
}: PlaybackControlsProps) {
  return (
    <Card className="pointer-events-auto w-full max-w-xl gap-0 py-3 backdrop-blur-md bg-card/80 border-border/60 shadow-lg">
      <CardContent className="flex items-center gap-4">
        <Button
          variant="secondary"
          size="icon"
          onClick={onToggle}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause /> : <Play />}
        </Button>

        <Slider
          className="flex-1"
          min={0}
          max={duration || 1}
          step={0.001}
          value={[Math.min(currentTime, duration || 1)]}
          onValueChange={([v]) => onSeek(v)}
          aria-label="Seek"
        />

        <div className="w-28 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </CardContent>
    </Card>
  );
}
