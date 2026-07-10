import { Link2, RadioTower } from "lucide-react";
import type { NetworkMetrics as Metrics } from "../../lib/coverageMath";
import { StatusDot } from "../common/StatusDot";

export function NetworkMetrics({ metrics }: { metrics: Metrics }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusDot active={metrics.qualityPercent > 20} tone={metrics.qualityPercent > 55 ? "cyan" : "amber"} />
          <span className="text-xs text-slate-300">{metrics.quality} mesh</span>
        </div>
        <span className="font-mono text-[10px] text-cyan-200">{metrics.qualityPercent.toFixed(0)}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/[0.07]">
        <div className="h-full bg-cyan-300/70 transition-[width] duration-500" style={{ width: `${metrics.qualityPercent}%` }} />
      </div>
      <div className="mt-3 grid grid-cols-3 divide-x divide-white/[0.07] text-center">
        <div><Link2 className="mx-auto mb-1 size-3 text-slate-600" /><p className="font-mono text-sm text-slate-200">{metrics.activeLinks}</p><p className="mt-1 text-[8px] uppercase tracking-wider text-slate-600">links</p></div>
        <div><RadioTower className="mx-auto mb-1 size-3 text-slate-600" /><p className="font-mono text-sm text-slate-200">{metrics.averageConnectivity.toFixed(1)}</p><p className="mt-1 text-[8px] uppercase tracking-wider text-slate-600">mean degree</p></div>
        <div><span className="mx-auto mb-1 block size-3 rounded-full border border-slate-600" /><p className="font-mono text-sm text-slate-200">{metrics.isolatedSatellites}</p><p className="mt-1 text-[8px] uppercase tracking-wider text-slate-600">isolated</p></div>
      </div>
    </div>
  );
}
