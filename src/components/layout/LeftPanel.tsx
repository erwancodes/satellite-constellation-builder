import { Eye, Link2, Plus, RotateCw, Satellite, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PanelSection } from "../common/PanelSection";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { ConstellationGenerator } from "../satellites/ConstellationGenerator";
import { SatelliteEditor } from "../satellites/SatelliteEditor";
import { SatelliteList } from "../satellites/SatelliteList";
import { PresetSelector } from "../presets/PresetSelector";
import { useConstellationStore } from "../../store/constellationStore";
import type { CoverageMode } from "../../types/mission";
import { MAX_SATELLITES } from "../../lib/constants";
import { CELESTIAL_BODIES } from "../../lib/celestialBodies";
import type { CelestialBodyId } from "../../types/mission";

interface ToggleOptionProps {
  label: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleOption({ label, icon, checked, onChange }: ToggleOptionProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="text-slate-600">{icon}</span>{label}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

export function LeftPanel() {
  const missionName = useConstellationStore((state) => state.missionName);
  const setMissionName = useConstellationStore((state) => state.setMissionName);
  const bodyId = useConstellationStore((state) => state.bodyId);
  const setBodyId = useConstellationStore((state) => state.setBodyId);
  const satellites = useConstellationStore((state) => state.satellites);
  const addSatellite = useConstellationStore((state) => state.addSatellite);
  const replaceSatellites = useConstellationStore((state) => state.replaceSatellites);
  const display = useConstellationStore((state) => state.display);
  const setDisplay = useConstellationStore((state) => state.setDisplay);

  return (
    <aside className="flex h-full min-h-0 flex-col bg-[#06101a]/88 text-slate-100 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-cyan-300/60">Mission designer</p>
          <p className="mt-1 text-sm font-medium text-slate-200">Constellation parameters</p>
        </div>
        <span className="font-mono text-[9px] text-slate-600">CFG / 01</span>
      </div>

      <div className="mission-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <PanelSection title="Mission profile" eyebrow="Workspace">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="mission-name">Mission name</Label>
              <Input id="mission-name" value={missionName} onChange={(event) => setMissionName(event.currentTarget.value.slice(0, 48))} />
            </div>
            <div className="space-y-2">
              <Label>Celestial network</Label>
              <Select value={bodyId} onValueChange={(value) => setBodyId(value as CelestialBodyId)}>
                <SelectTrigger aria-label="Mission celestial body"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(CELESTIAL_BODIES).map((body) => <SelectItem key={body.id} value={body.id}>{body.modeName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PanelSection>

        <PanelSection title="Preset architectures" eyebrow="Quick start">
          <PresetSelector />
        </PanelSection>

        <PanelSection
          title="Orbital fleet"
          eyebrow={`${satellites.length} / ${MAX_SATELLITES} vehicles`}
          action={
            <Button
              size="sm"
              onClick={() => {
                if (addSatellite()) toast.success("Satellite added");
                else toast.error("Fleet limit reached");
              }}
            >
              <Plus /> Add
            </Button>
          }
        >
          <div className="space-y-3">
            <SatelliteList />
            <ConstellationGenerator />
            {satellites.length > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-slate-500 hover:text-red-200"
                onClick={() => {
                  if (window.confirm("Delete every satellite in this mission?")) {
                    replaceSatellites([], "empty-mission");
                    toast.success("Constellation cleared");
                  }
                }}
              >
                <Trash2 /> Clear fleet
              </Button>
            ) : null}
          </div>
        </PanelSection>

        <PanelSection title="Selected vehicle" eyebrow="Live editing">
          <SatelliteEditor />
        </PanelSection>

        <PanelSection title="Display layers" eyebrow="Scene visibility">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Ground coverage</Label>
              <Select value={display.coverageMode} onValueChange={(value) => setDisplay({ coverageMode: value as CoverageMode })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All footprints</SelectItem>
                  <SelectItem value="selected">Selected only</SelectItem>
                  <SelectItem value="none">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="divide-y divide-white/[0.06]">
              <ToggleOption label="Orbit traces" icon={<Satellite className="size-3.5" />} checked={display.showAllOrbits} onChange={(checked) => setDisplay({ showAllOrbits: checked })} />
              <ToggleOption label="Inter-satellite links" icon={<Link2 className="size-3.5" />} checked={display.showLinks} onChange={(checked) => setDisplay({ showLinks: checked })} />
              <ToggleOption label="Auto-rotate body" icon={<RotateCw className="size-3.5" />} checked={display.autoRotate} onChange={(checked) => setDisplay({ autoRotate: checked })} />
              <ToggleOption label="Coverage projection" icon={<Eye className="size-3.5" />} checked={display.coverageMode !== "none"} onChange={(checked) => setDisplay({ coverageMode: checked ? "all" : "none" })} />
            </div>
          </div>
        </PanelSection>
      </div>
    </aside>
  );
}
