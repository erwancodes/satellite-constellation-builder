import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  generateConstellation,
  MISSION_GOALS,
  type MissionGoal,
} from "../../lib/constellationGenerator";
import { CELESTIAL_BODIES } from "../../lib/celestialBodies";
import { useConstellationStore } from "../../store/constellationStore";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface FormState {
  count: number;
  altitudeKm: number;
  orbitalPlanes: number;
  inclinationDeg: number;
  missionGoal: MissionGoal;
}

export function ConstellationGenerator() {
  const bodyId = useConstellationStore((state) => state.bodyId);
  const replaceSatellites = useConstellationStore((state) => state.replaceSatellites);
  const body = CELESTIAL_BODIES[bodyId];
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    count: 18,
    altitudeKm: bodyId === "earth" ? 1_200 : Math.round(body.radiusKm * 0.12),
    orbitalPlanes: 3,
    inclinationDeg: 53,
    missionGoal: "maximum-global-coverage",
  });

  useEffect(() => {
    setForm((current) => ({
      ...current,
      altitudeKm: Math.min(body.altitudeRangeKm[1], Math.max(body.altitudeRangeKm[0], current.altitudeKm)),
    }));
  }, [body]);

  const updateNumber = (key: keyof Omit<FormState, "missionGoal">, value: number) => {
    if (Number.isFinite(value)) setForm((current) => ({ ...current, [key]: value }));
  };

  const handleGenerate = () => {
    try {
      const satellites = generateConstellation({ ...form, bodyId });
      replaceSatellites(satellites, null);
      setError(null);
      setOpen(false);
      toast.success(`${satellites.length} satellites generated across ${form.orbitalPlanes} planes`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to generate constellation.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full"><Sparkles /> Generate constellation</Button>
      </DialogTrigger>
      <DialogContent>
        <div>
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-300/70">Walker-style distribution</p>
          <DialogTitle className="text-xl font-semibold tracking-tight">Generate a coherent orbital fleet</DialogTitle>
          <DialogDescription className="mt-2 max-w-[55ch] text-sm leading-relaxed text-slate-500">
            Satellites are distributed evenly across orbital planes with staggered phases for the selected mission objective.
          </DialogDescription>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><Label htmlFor="generator-count">Satellites</Label><Input id="generator-count" type="number" min={1} max={120} value={form.count} onChange={(event) => updateNumber("count", event.currentTarget.valueAsNumber)} /></div>
          <div className="space-y-2"><Label htmlFor="generator-planes">Orbital planes</Label><Input id="generator-planes" type="number" min={1} max={form.count} value={form.orbitalPlanes} onChange={(event) => updateNumber("orbitalPlanes", event.currentTarget.valueAsNumber)} /></div>
          <div className="space-y-2"><Label htmlFor="generator-altitude">Altitude / km</Label><Input id="generator-altitude" type="number" min={body.altitudeRangeKm[0]} max={body.altitudeRangeKm[1]} value={form.altitudeKm} onChange={(event) => updateNumber("altitudeKm", event.currentTarget.valueAsNumber)} /></div>
          <div className="space-y-2"><Label htmlFor="generator-inclination">Inclination / deg</Label><Input id="generator-inclination" type="number" min={0} max={180} value={form.inclinationDeg} onChange={(event) => updateNumber("inclinationDeg", event.currentTarget.valueAsNumber)} /></div>
        </div>

        <div className="space-y-2">
          <Label>Mission objective</Label>
          <Select value={form.missionGoal} onValueChange={(missionGoal) => setForm((current) => ({ ...current, missionGoal: missionGoal as MissionGoal }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{MISSION_GOALS.map((goal) => <SelectItem key={goal.id} value={goal.id}>{goal.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {error ? <p role="alert" className="rounded-md border border-red-400/25 bg-red-400/8 px-3 py-2 text-xs text-red-200">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleGenerate}><Sparkles /> Generate fleet</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
