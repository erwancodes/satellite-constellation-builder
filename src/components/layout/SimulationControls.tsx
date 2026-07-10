import { Gauge, Pause, Play, RotateCcw } from "lucide-react";
import { CELESTIAL_BODIES } from "../../lib/celestialBodies";
import { TIME_SCALES } from "../../lib/constants";
import { calculateOrbitalPeriodSeconds } from "../../lib/orbitalMath";
import { formatDuration } from "../../lib/utils";
import { useConstellationStore } from "../../store/constellationStore";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export function SimulationControls() {
  const isPlaying = useConstellationStore((state) => state.isPlaying);
  const timeScale = useConstellationStore((state) => state.timeScale);
  const elapsedSeconds = useConstellationStore((state) => state.elapsedSeconds);
  const satellites = useConstellationStore((state) => state.satellites);
  const bodyId = useConstellationStore((state) => state.bodyId);
  const togglePlaying = useConstellationStore((state) => state.togglePlaying);
  const setTimeScale = useConstellationStore((state) => state.setTimeScale);
  const resetTime = useConstellationStore((state) => state.resetTime);
  const body = CELESTIAL_BODIES[bodyId];

  const orbitCount = satellites.reduce((sum, satellite) => {
    if (!satellite.active) return sum;
    const period = calculateOrbitalPeriodSeconds(satellite.altitudeKm, body);
    return sum + elapsedSeconds / Math.max(period, 1);
  }, 0);
  const progress = ((elapsedSeconds % 86_400) / 86_400) * 100;

  return (
    <footer className="relative z-30 grid min-h-[74px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-white/[0.08] bg-[#050d17]/94 px-3 backdrop-blur-xl md:px-5">
      <div className="flex items-center gap-1.5">
        <Button
          size="icon"
          onClick={togglePlaying}
          aria-label={isPlaying ? "Pause simulation" : "Play simulation"}
          className="size-10 rounded-full"
        >
          {isPlaying ? <Pause className="fill-current" /> : <Play className="ml-0.5 fill-current" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={resetTime} aria-label="Reset simulation time">
          <RotateCcw />
        </Button>
      </div>

      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-slate-600">Mission elapsed time</p>
            <p className="mt-0.5 font-mono text-sm tabular-nums text-slate-200">T+ {formatDuration(elapsedSeconds)}</p>
          </div>
          <div className="hidden gap-8 md:flex">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-slate-600">Fleet revolutions</p>
              <p className="mt-0.5 font-mono text-xs text-slate-300">{orbitCount.toFixed(2)}</p>
            </div>
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-slate-600">Mission clock</p>
              <p className="mt-0.5 font-mono text-xs text-slate-300">
                {new Date(elapsedSeconds * 1_000).toISOString().slice(11, 19)} UTC
              </p>
            </div>
          </div>
        </div>
        <div className="relative h-px w-full overflow-visible bg-white/10">
          <div className="absolute inset-y-0 left-0 bg-cyan-300/80 transition-[width] duration-100" style={{ width: `${progress}%` }} />
          <div className="absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-100 bg-[#07111c]" style={{ left: `${progress}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Gauge className="hidden size-4 text-slate-500 sm:block" strokeWidth={1.6} />
        <Select value={String(timeScale)} onValueChange={(value) => setTimeScale(Number(value))}>
          <SelectTrigger className="w-[84px]" aria-label="Simulation speed"><SelectValue /></SelectTrigger>
          <SelectContent>
            {TIME_SCALES.map((speed) => <SelectItem key={speed} value={String(speed)}>x{speed}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </footer>
  );
}
