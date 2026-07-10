import { Crosshair, LocateFixed, Maximize2, RotateCcw, Satellite, ScanLine } from "lucide-react";
import { CELESTIAL_BODIES } from "../../lib/celestialBodies";
import { calculateOrbitalPeriodSeconds, calculateOrbitalVelocityKmPerSecond } from "../../lib/orbitalMath";
import { useConstellationStore } from "../../store/constellationStore";
import { Button } from "../ui/button";
import { StatusDot } from "../common/StatusDot";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export function SceneHUD() {
  const bodyId = useConstellationStore((state) => state.bodyId);
  const satellites = useConstellationStore((state) => state.satellites);
  const selectedId = useConstellationStore((state) => state.selectedId);
  const body = CELESTIAL_BODIES[bodyId];
  const selected = satellites.find((satellite) => satellite.id === selectedId);

  const dispatch = (event: string, detail?: string) =>
    window.dispatchEvent(new CustomEvent(event, detail ? { detail } : undefined));

  return (
    <div className="pointer-events-none absolute inset-0 z-20 p-3 md:p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="mission-glass pointer-events-auto min-w-[170px] rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-2">
            <StatusDot />
            <span className="font-mono text-[9px] uppercase tracking-[0.17em] text-slate-400">{body.name} orbital frame</span>
          </div>
          <div className="mt-2 flex gap-4 font-mono text-[8px] text-slate-600">
            <span>R {body.radiusKm.toLocaleString()} KM</span>
            <span>MU {Math.round(body.gravitationalParameter).toLocaleString()}</span>
          </div>
        </div>

        <div className="mission-glass pointer-events-auto flex items-center gap-1 rounded-lg p-1.5">
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon-sm" onClick={() => dispatch("scb:recenter")} aria-label="Recenter body"><RotateCcw /></Button></TooltipTrigger><TooltipContent>Recenter view (R)</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon-sm" onClick={() => selectedId && dispatch("scb:focus-satellite", selectedId)} disabled={!selectedId} aria-label="Focus selected satellite"><LocateFixed /></Button></TooltipTrigger><TooltipContent>Focus selected vehicle</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon-sm" onClick={() => document.documentElement.requestFullscreen?.()} aria-label="Enter fullscreen"><Maximize2 /></Button></TooltipTrigger><TooltipContent>Fullscreen view</TooltipContent></Tooltip>
        </div>
      </div>

      <div className="absolute bottom-4 left-3 md:left-4">
        {selected ? (
          <div className="mission-glass pointer-events-auto w-[min(300px,calc(100vw-2rem))] rounded-lg p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded border border-white/10 bg-white/[0.04]">
                  <Satellite className="size-3.5" style={{ color: selected.color }} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-200">{selected.name}</p>
                  <p className="mt-0.5 font-mono text-[8px] uppercase tracking-wider text-slate-600">{selected.type} / {selected.active ? "Nominal" : "Offline"}</p>
                </div>
              </div>
              <Crosshair className="size-3.5 text-cyan-300/65" />
            </div>
            <div className="mt-3 grid grid-cols-3 divide-x divide-white/[0.07] border-t border-white/[0.07] pt-2">
              <div><p className="font-mono text-[7px] uppercase tracking-wider text-slate-600">Altitude</p><p className="mt-1 font-mono text-[10px] text-slate-300">{Math.round(selected.altitudeKm).toLocaleString()} km</p></div>
              <div className="pl-3"><p className="font-mono text-[7px] uppercase tracking-wider text-slate-600">Velocity</p><p className="mt-1 font-mono text-[10px] text-slate-300">{calculateOrbitalVelocityKmPerSecond(selected.altitudeKm, body).toFixed(2)} km/s</p></div>
              <div className="pl-3"><p className="font-mono text-[7px] uppercase tracking-wider text-slate-600">Period</p><p className="mt-1 font-mono text-[10px] text-slate-300">{(calculateOrbitalPeriodSeconds(selected.altitudeKm, body) / 60).toFixed(1)} min</p></div>
            </div>
          </div>
        ) : (
          <div className="mission-glass flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-500"><ScanLine className="size-3.5" /> Select a vehicle in the scene</div>
        )}
      </div>
    </div>
  );
}
