import {
  Download,
  Menu,
  PanelRight,
  RotateCcw,
  Satellite,
  Upload,
} from "lucide-react";
import { calculateCoverageMetrics } from "../../lib/coverageMath";
import { CELESTIAL_BODIES } from "../../lib/celestialBodies";
import { useConstellationStore } from "../../store/constellationStore";
import type { CelestialBodyId } from "../../types/mission";
import { StatusDot } from "../common/StatusDot";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface TopBarProps {
  onOpenLeft: () => void;
  onOpenRight: () => void;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
}

function BrandMark() {
  return (
    <div className="relative flex size-9 shrink-0 items-center justify-center" aria-hidden="true">
      <span className="absolute inset-[3px] rotate-[28deg] rounded-[50%] border border-cyan-300/35" />
      <span className="absolute inset-[7px] -rotate-[28deg] rounded-[50%] border border-slate-400/20" />
      <Satellite className="relative size-4 text-cyan-200" strokeWidth={1.6} />
      <span className="absolute right-0 top-1 size-1 rounded-full bg-cyan-200" />
    </div>
  );
}

export function TopBar({ onOpenLeft, onOpenRight, onExport, onImport, onReset }: TopBarProps) {
  const bodyId = useConstellationStore((state) => state.bodyId);
  const setBodyId = useConstellationStore((state) => state.setBodyId);
  const satellites = useConstellationStore((state) => state.satellites);
  const isPlaying = useConstellationStore((state) => state.isPlaying);
  const body = CELESTIAL_BODIES[bodyId];
  const metrics = calculateCoverageMetrics(satellites, body);

  return (
    <header className="relative z-30 grid h-[66px] grid-cols-[minmax(0,1fr)_auto] items-center border-b border-white/[0.08] bg-[#050d17]/90 px-3 shadow-[0_14px_35px_rgba(1,7,14,0.16),inset_0_1px_0_rgba(255,255,255,0.035)] backdrop-blur-xl md:px-4 xl:grid-cols-[330px_minmax(0,1fr)_340px]">
      <div className="flex min-w-0 items-center gap-2.5">
        <Button variant="ghost" size="icon" className="xl:hidden" onClick={onOpenLeft} aria-label="Open mission controls">
          <Menu />
        </Button>
        <BrandMark />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-[-0.02em] text-slate-100">
            Satellite Constellation Builder
          </p>
          <p className="mt-0.5 hidden font-mono text-[8px] uppercase tracking-[0.2em] text-slate-600 sm:block">
            Orbital systems laboratory
          </p>
        </div>
      </div>

      <div className="hidden items-center justify-center gap-2 lg:flex">
        <div className="flex h-9 items-center gap-2 border-x border-white/[0.07] px-4">
          <StatusDot active={isPlaying} tone="cyan" />
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-slate-600">Simulation</p>
            <p className="text-[11px] font-medium text-slate-300">{isPlaying ? "Propagating" : "Paused"}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-white/[0.07]">
          <div className="px-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-slate-600">Active vehicles</p>
            <p className="mt-0.5 font-mono text-sm text-slate-200">
              {metrics.activeSatellites}<span className="text-slate-600">/{satellites.length}</span>
            </p>
          </div>
          <div className="px-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-slate-600">Coverage score</p>
            <p className="mt-0.5 font-mono text-sm text-cyan-200">
              {Math.round(metrics.score)}<span className="text-slate-600">/100</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5">
        <Select value={bodyId} onValueChange={(value) => setBodyId(value as CelestialBodyId)}>
          <SelectTrigger className="hidden w-[154px] border-white/8 bg-white/[0.035] sm:flex" aria-label="Celestial body mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(CELESTIAL_BODIES).map((celestialBody) => (
              <SelectItem key={celestialBody.id} value={celestialBody.id}>{celestialBody.modeName}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onImport} aria-label="Import constellation JSON"><Upload /></Button>
          </TooltipTrigger>
          <TooltipContent>Import mission JSON</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onExport} aria-label="Export constellation JSON"><Download /></Button>
          </TooltipTrigger>
          <TooltipContent>Export mission JSON</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onReset} aria-label="Reset mission"><RotateCcw /></Button>
          </TooltipTrigger>
          <TooltipContent>Reset mission</TooltipContent>
        </Tooltip>
        <Button variant="ghost" size="icon" className="xl:hidden" onClick={onOpenRight} aria-label="Open analytics">
          <PanelRight />
        </Button>
      </div>
    </header>
  );
}
