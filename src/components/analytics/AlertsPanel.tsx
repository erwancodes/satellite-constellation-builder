import { CircleAlert, Info, ShieldAlert, TriangleAlert } from "lucide-react";
import type { MissionAlert } from "../../types/mission";
import { cn } from "../../lib/utils";

const alertStyles = {
  info: { icon: Info, className: "border-cyan-300/15 bg-cyan-300/[0.035] text-cyan-200" },
  warning: { icon: TriangleAlert, className: "border-amber-300/18 bg-amber-300/[0.045] text-amber-200" },
  critical: { icon: ShieldAlert, className: "border-red-400/20 bg-red-400/[0.05] text-red-200" },
};

export function AlertsPanel({ alerts }: { alerts: MissionAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 border-y border-white/[0.06] py-3 text-xs text-slate-500">
        <CircleAlert className="size-3.5 text-cyan-300/60" /> No active mission advisories
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.slice(0, 6).map((alert) => {
        const style = alertStyles[alert.level];
        const Icon = style.icon;
        return (
          <div key={alert.id} className={cn("grid grid-cols-[auto_minmax(0,1fr)] gap-2.5 rounded-md border px-3 py-2.5", style.className)}>
            <Icon className="mt-0.5 size-3.5" strokeWidth={1.7} />
            <div>
              <p className="text-[11px] font-medium">{alert.title}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{alert.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
