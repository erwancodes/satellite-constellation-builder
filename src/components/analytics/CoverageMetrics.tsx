import type { CoverageMetrics as Metrics } from "../../lib/coverageMath";
import { formatDuration } from "../../lib/utils";

function Metric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "cyan" | "amber" }) {
  return (
    <div className="py-2.5">
      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-slate-600">{label}</p>
      <p className={`mt-1 font-mono text-sm tabular-nums ${tone === "cyan" ? "text-cyan-200" : tone === "amber" ? "text-amber-200" : "text-slate-200"}`}>{value}</p>
    </div>
  );
}

export function CoverageMetrics({ metrics }: { metrics: Metrics }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-white/[0.07] border-y border-white/[0.07] [&>*:nth-child(odd)]:pr-3 [&>*:nth-child(even)]:pl-3">
      <Metric label="Surface estimate" value={`${metrics.surfaceCoveragePercent.toFixed(1)}%`} tone="cyan" />
      <Metric label="Overlap" value={`${metrics.overlapPercent.toFixed(1)}%`} tone={metrics.overlapPercent > 60 ? "amber" : "default"} />
      <Metric label="Active fleet" value={String(metrics.activeSatellites).padStart(2, "0")} />
      <Metric label="Mean altitude" value={`${Math.round(metrics.averageAltitudeKm).toLocaleString()} km`} />
      <Metric label="Mean inclination" value={`${metrics.averageInclinationDeg.toFixed(1)} deg`} />
      <Metric label="Mean period" value={formatDuration(metrics.averagePeriodSeconds)} />
      <Metric label="Efficiency" value={`${metrics.efficiencyPercent.toFixed(1)}%`} tone="cyan" />
      <Metric label="Uncovered" value={`${Math.max(0, 100 - metrics.surfaceCoveragePercent).toFixed(1)}%`} />
    </div>
  );
}
