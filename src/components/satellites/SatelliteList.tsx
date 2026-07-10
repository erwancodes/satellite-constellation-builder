import { Copy, Power, Satellite as SatelliteIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useConstellationStore } from "../../store/constellationStore";
import { cn } from "../../lib/utils";

export function SatelliteList() {
  const satellites = useConstellationStore((state) => state.satellites);
  const selectedId = useConstellationStore((state) => state.selectedId);
  const selectSatellite = useConstellationStore((state) => state.selectSatellite);
  const duplicateSatellite = useConstellationStore((state) => state.duplicateSatellite);
  const removeSatellite = useConstellationStore((state) => state.removeSatellite);

  if (satellites.length === 0) {
    return (
      <div className="border-y border-dashed border-white/10 py-6 text-center">
        <SatelliteIcon className="mx-auto mb-2 size-5 text-slate-600" strokeWidth={1.5} />
        <p className="text-sm text-slate-300">No vehicles in this mission</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Add one satellite or load a preset to begin coverage analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5" role="list" aria-label="Mission satellites">
      {satellites.map((satellite, index) => {
        const selected = satellite.id === selectedId;
        return (
          <div
            key={satellite.id}
            role="listitem"
            className={cn(
              "group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-md border px-2 py-2 transition-colors",
              selected
                ? "border-cyan-300/30 bg-cyan-300/[0.07]"
                : "border-transparent bg-white/[0.025] hover:border-white/8 hover:bg-white/[0.045]",
            )}
          >
            <button
              type="button"
              onClick={() => selectSatellite(satellite.id)}
              className="relative flex size-7 items-center justify-center rounded border border-white/8 bg-[#07101b]"
              aria-label={`Select ${satellite.name}`}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: satellite.active ? satellite.color : "#475569" }}
              />
              <span className="absolute -right-1 -top-1 font-mono text-[7px] text-slate-600">
                {String(index + 1).padStart(2, "0")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => selectSatellite(satellite.id)}
              className="min-w-0 text-left"
            >
              <span className="block truncate text-xs font-medium text-slate-200">{satellite.name}</span>
              <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-slate-500">
                {satellite.type}
                <span aria-hidden="true">/</span>
                {Math.round(satellite.altitudeKm).toLocaleString()} km
              </span>
            </button>

            <div className="flex items-center opacity-70 transition-opacity group-hover:opacity-100">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Duplicate ${satellite.name}`}
                    onClick={() => {
                      if (duplicateSatellite(satellite.id)) toast.success("Satellite duplicated");
                      else toast.error("Fleet limit reached");
                    }}
                  >
                    <Copy />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Duplicate vehicle</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${satellite.name}`}
                    onClick={() => {
                      removeSatellite(satellite.id);
                      toast.success("Satellite removed");
                    }}
                  >
                    <Trash2 />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove vehicle</TooltipContent>
              </Tooltip>
            </div>

            {!satellite.active ? (
              <span className="col-span-3 flex items-center gap-1 pl-9 text-[9px] uppercase tracking-wider text-slate-600">
                <Power className="size-2.5" /> Offline
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
