import { Activity, BarChart3, BellRing, Network, Radio } from "lucide-react";
import {
  buildMissionAlerts,
  calculateCoverageMetrics,
  calculateNetworkMetrics,
} from "../../lib/coverageMath";
import { CELESTIAL_BODIES } from "../../lib/celestialBodies";
import { useConstellationStore } from "../../store/constellationStore";
import { AlertsPanel } from "../analytics/AlertsPanel";
import { CoverageMetrics } from "../analytics/CoverageMetrics";
import { CoverageProfile } from "../analytics/CoverageProfile";
import { CoverageScore } from "../analytics/CoverageScore";
import { NetworkMetrics } from "../analytics/NetworkMetrics";
import { SelectedTelemetry } from "../analytics/SelectedTelemetry";
import { PanelSection } from "../common/PanelSection";

export function RightPanel() {
  const satellites = useConstellationStore((state) => state.satellites);
  const selectedId = useConstellationStore((state) => state.selectedId);
  const elapsedSeconds = useConstellationStore((state) => state.elapsedSeconds);
  const bodyId = useConstellationStore((state) => state.bodyId);
  const body = CELESTIAL_BODIES[bodyId];
  const selected = satellites.find((satellite) => satellite.id === selectedId);
  const coverage = calculateCoverageMetrics(satellites, body);
  const network = calculateNetworkMetrics(satellites, body, elapsedSeconds);
  const alerts = buildMissionAlerts(satellites, body, coverage, network);

  return (
    <aside className="flex h-full min-h-0 flex-col bg-[#06101a]/88 text-slate-100 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-cyan-300/60">Mission intelligence</p>
          <p className="mt-1 text-sm font-medium text-slate-200">Coverage & network analysis</p>
        </div>
        <Activity className="size-4 text-cyan-300/60" strokeWidth={1.5} />
      </div>

      <div className="mission-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <PanelSection title="Global coverage score" eyebrow={`${body.name} surface model`}>
          <CoverageScore metrics={coverage} />
        </PanelSection>

        <PanelSection title="Coverage metrics" eyebrow="Approximate model" action={<BarChart3 className="size-3.5 text-slate-600" />}>
          <CoverageMetrics metrics={coverage} />
        </PanelSection>

        <PanelSection title="Orbital distribution" eyebrow="Fleet inclination" action={<Radio className="size-3.5 text-slate-600" />}>
          <CoverageProfile satellites={satellites} />
          <div className="mt-1 flex items-center justify-between font-mono text-[8px] uppercase tracking-wider text-slate-600">
            <span>Equatorial</span><span>Mid-latitude</span><span>Polar</span>
          </div>
        </PanelSection>

        <PanelSection title="Inter-satellite mesh" eyebrow="Dynamic links" action={<Network className="size-3.5 text-slate-600" />}>
          <NetworkMetrics metrics={network} />
        </PanelSection>

        <PanelSection title="Selected telemetry" eyebrow="Real-time state" action={<Activity className="size-3.5 text-slate-600" />}>
          <SelectedTelemetry satellite={selected} elapsedSeconds={elapsedSeconds} body={body} />
        </PanelSection>

        <PanelSection title="Mission advisories" eyebrow={`${alerts.length} active`} action={<BellRing className="size-3.5 text-slate-600" />}>
          <AlertsPanel alerts={alerts} />
        </PanelSection>
      </div>
    </aside>
  );
}
