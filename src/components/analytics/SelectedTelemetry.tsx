import { Activity, Crosshair } from "lucide-react";
import { calculateSatelliteTelemetry } from "../../lib/orbitalMath";
import { formatDuration } from "../../lib/utils";
import type { CelestialBody } from "../../types/mission";
import type { Satellite } from "../../types/satellite";

export function SelectedTelemetry({ satellite, elapsedSeconds, body }: { satellite: Satellite | undefined; elapsedSeconds: number; body: CelestialBody }) {
  if (!satellite) {
    return (
      <div className="flex items-center gap-2 py-4 text-xs text-slate-600">
        <Crosshair className="size-4" /> No vehicle selected
      </div>
    );
  }

  const telemetry = calculateSatelliteTelemetry(satellite, elapsedSeconds, body);
  const values = [
    ["Latitude", `${telemetry.latitudeDeg.toFixed(2)} deg`],
    ["Longitude", `${telemetry.longitudeDeg.toFixed(2)} deg`],
    ["Altitude", `${Math.round(telemetry.altitudeKm).toLocaleString()} km`],
    ["Velocity", `${telemetry.velocityKmPerSecond.toFixed(2)} km/s`],
    ["Period", formatDuration(telemetry.periodSeconds)],
    ["Orbit progress", `${(telemetry.progress * 100).toFixed(1)}%`],
    ["Coverage", `${telemetry.coveragePercent.toFixed(2)}%`],
    ["Comms", telemetry.communication],
  ];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Activity className="size-3.5 shrink-0 text-cyan-300" />
          <span className="truncate text-xs font-medium text-slate-200">{satellite.name}</span>
        </div>
        <span className="rounded border border-cyan-300/20 bg-cyan-300/[0.06] px-2 py-1 font-mono text-[8px] uppercase tracking-wider text-cyan-200">Live</span>
      </div>
      <dl className="grid grid-cols-2 divide-x divide-y divide-white/[0.06] border-y border-white/[0.06]">
        {values.map(([label, value], index) => (
          <div key={label} className={`py-2 ${index % 2 === 0 ? "pr-2" : "pl-3"}`}>
            <dt className="font-mono text-[8px] uppercase tracking-wider text-slate-600">{label}</dt>
            <dd className="mt-1 font-mono text-[10px] text-slate-300">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
