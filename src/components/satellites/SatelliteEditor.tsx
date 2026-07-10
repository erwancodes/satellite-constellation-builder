import { Crosshair, Eye, Orbit, Radio, Satellite as SatelliteIcon } from "lucide-react";
import { toast } from "sonner";
import { CELESTIAL_BODIES } from "../../lib/celestialBodies";
import { useConstellationStore } from "../../store/constellationStore";
import { SATELLITE_TYPES, type Satellite } from "../../types/satellite";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Slider } from "../ui/slider";
import { Switch } from "../ui/switch";

interface ParameterControlProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  onChange: (value: number) => void;
}

function ParameterControl({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: ParameterControlProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="relative w-[92px]">
          <Input
            id={id}
            type="number"
            min={min}
            max={max}
            step={step}
            value={Number(value.toFixed(step < 1 ? 2 : 0))}
            onChange={(event) => {
              const next = event.currentTarget.valueAsNumber;
              if (Number.isFinite(next)) onChange(next);
            }}
            className="h-7 pr-8 text-right font-mono text-[10px]"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[8px] text-slate-600">
            {suffix}
          </span>
        </div>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(values) => {
          const next = values[0];
          if (typeof next === "number") onChange(next);
        }}
        aria-label={label}
      />
    </div>
  );
}

function ToggleRow({
  label,
  description,
  icon,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex min-w-0 items-start gap-2">
        <span className="mt-0.5 text-slate-500">{icon}</span>
        <div>
          <p className="text-xs text-slate-300">{label}</p>
          <p className="mt-0.5 text-[10px] text-slate-600">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

export function SatelliteEditor() {
  const selectedId = useConstellationStore((state) => state.selectedId);
  const satellites = useConstellationStore((state) => state.satellites);
  const bodyId = useConstellationStore((state) => state.bodyId);
  const updateSatellite = useConstellationStore((state) => state.updateSatellite);
  const selected = satellites.find((satellite) => satellite.id === selectedId);
  const body = CELESTIAL_BODIES[bodyId];

  if (!selected) {
    return (
      <div className="py-5 text-center">
        <Crosshair className="mx-auto mb-2 size-5 text-slate-600" strokeWidth={1.5} />
        <p className="text-xs text-slate-500">Select a satellite to inspect its orbit.</p>
      </div>
    );
  }

  const update = <K extends keyof Satellite>(key: K, value: Satellite[K]) =>
    updateSatellite(selected.id, { [key]: value });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-2">
        <div className="space-y-2">
          <Label htmlFor="satellite-name">Vehicle name</Label>
          <Input
            id="satellite-name"
            value={selected.name}
            onChange={(event) => update("name", event.currentTarget.value.slice(0, 36))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="satellite-color">Signal color</Label>
          <div className="relative">
            <Input
              id="satellite-color"
              type="color"
              value={selected.color}
              onChange={(event) => update("color", event.currentTarget.value)}
              className="cursor-pointer px-1.5"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Payload type</Label>
        <Select value={selected.type} onValueChange={(value) => update("type", value as Satellite["type"])}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {SATELLITE_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 border-y border-white/[0.07] py-4">
        <ParameterControl
          id="altitude"
          label="Altitude"
          value={selected.altitudeKm}
          min={body.altitudeRangeKm[0]}
          max={body.altitudeRangeKm[1]}
          step={bodyId === "earth" ? 10 : 5}
          suffix="KM"
          onChange={(value) => update("altitudeKm", value)}
        />
        <ParameterControl id="inclination" label="Inclination" value={selected.inclinationDeg} min={0} max={180} suffix="DEG" onChange={(value) => update("inclinationDeg", value)} />
        <ParameterControl id="raan" label="Ascending node" value={selected.ascendingNodeDeg} min={0} max={359} suffix="DEG" onChange={(value) => update("ascendingNodeDeg", value)} />
        <ParameterControl id="phase" label="Initial phase" value={selected.phaseDeg} min={0} max={359} suffix="DEG" onChange={(value) => update("phaseDeg", value)} />
        <ParameterControl id="velocity" label="Velocity factor" value={selected.speedMultiplier} min={0.1} max={4} step={0.05} suffix="X" onChange={(value) => update("speedMultiplier", value)} />
        <ParameterControl id="coverage" label="Coverage cone" value={selected.coverageAngleDeg} min={1} max={85} suffix="DEG" onChange={(value) => update("coverageAngleDeg", value)} />
      </div>

      <div className="space-y-2">
        <ToggleRow label="Vehicle active" description="Include in simulation and analytics" icon={<SatelliteIcon className="size-3.5" />} checked={selected.active} onCheckedChange={(value) => update("active", value)} />
        <ToggleRow label="Orbit trace" description="Render this vehicle's orbital plane" icon={<Orbit className="size-3.5" />} checked={selected.showOrbit} onCheckedChange={(value) => update("showOrbit", value)} />
        <ToggleRow label="Ground footprint" description="Project an approximate coverage zone" icon={<Eye className="size-3.5" />} checked={selected.showCoverage} onCheckedChange={(value) => update("showCoverage", value)} />
      </div>

      <Button
        variant="secondary"
        className="w-full"
        onClick={() => {
          window.dispatchEvent(new CustomEvent("scb:focus-satellite", { detail: selected.id }));
          toast.success(`Tracking ${selected.name}`);
        }}
      >
        <Radio /> Focus camera
      </Button>
    </div>
  );
}
