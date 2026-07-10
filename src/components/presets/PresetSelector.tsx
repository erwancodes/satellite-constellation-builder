import { Layers3 } from "lucide-react";
import { toast } from "sonner";
import { PRESETS } from "../../data/presets";
import { CELESTIAL_BODIES } from "../../lib/celestialBodies";
import { useConstellationStore } from "../../store/constellationStore";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export function PresetSelector() {
  const activePreset = useConstellationStore((state) => state.activePreset);
  const bodyId = useConstellationStore((state) => state.bodyId);
  const replaceSatellites = useConstellationStore((state) => state.replaceSatellites);
  const current = PRESETS.find((preset) => preset.id === activePreset) ?? PRESETS[0];

  const loadPreset = (presetId: string) => {
    const preset = PRESETS.find((candidate) => candidate.id === presetId);
    if (!preset) return;
    const body = CELESTIAL_BODIES[bodyId];
    const satellites = preset.satellites.map((satellite) => ({
      ...satellite,
      id: `${bodyId}-${satellite.id}`,
      altitudeKm:
        bodyId === "earth"
          ? satellite.altitudeKm
          : Math.min(
              body.altitudeRangeKm[1],
              Math.max(body.altitudeRangeKm[0], (satellite.altitudeKm / 6_371) * body.radiusKm),
            ),
    }));
    replaceSatellites(satellites, preset.id);
    toast.success(`${preset.name} loaded for ${body.name}`);
  };

  return (
    <div className="space-y-2.5">
      <Select value={current?.id ?? "basic-equatorial"} onValueChange={loadPreset}>
        <SelectTrigger aria-label="Constellation preset"><SelectValue /></SelectTrigger>
        <SelectContent>
          {PRESETS.map((preset) => <SelectItem key={preset.id} value={preset.id}>{preset.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <div className="flex items-start gap-2 text-[10px] leading-relaxed text-slate-500">
        <Layers3 className="mt-0.5 size-3 shrink-0 text-slate-600" />
        <p>{current?.description ?? "Select a mission profile."}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.slice(0, 4).map((preset) => (
          <Button
            key={preset.id}
            variant={activePreset === preset.id ? "secondary" : "ghost"}
            size="sm"
            className="justify-start truncate font-mono text-[9px] uppercase tracking-wider"
            onClick={() => loadPreset(preset.id)}
          >
            <span className="size-1 rounded-full bg-current opacity-50" />
            {{
              "basic-equatorial": "Basic EQ",
              "polar-observation": "Polar OBS",
              "global-internet": "Global NET",
              "geostationary-relay": "Geo Relay",
            }[preset.id] ?? preset.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
