import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Satellite } from "../../types/satellite";

export function CoverageProfile({ satellites }: { satellites: Satellite[] }) {
  const active = satellites.filter((satellite) => satellite.active);
  const total = Math.max(active.length, 1);
  const data = [
    { zone: "EQU", value: (active.filter((satellite) => satellite.inclinationDeg < 25 || satellite.inclinationDeg > 155).length / total) * 100 },
    { zone: "MID", value: (active.filter((satellite) => satellite.inclinationDeg >= 25 && satellite.inclinationDeg <= 70).length / total) * 100 },
    { zone: "POL", value: (active.filter((satellite) => satellite.inclinationDeg > 70 && satellite.inclinationDeg <= 110).length / total) * 100 },
  ];

  return (
    <div className="h-[112px] w-full" aria-label="Orbital inclination distribution chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: -26 }}>
          <XAxis dataKey="zone" tick={{ fill: "#64748b", fontSize: 9, fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "rgba(148,163,184,0.1)" }} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 8, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(103,215,229,0.04)" }}
            contentStyle={{ background: "#091522", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#cbd5e1", fontSize: 11 }}
            formatter={(value) => [`${Number(value).toFixed(1)}%`, "Fleet share"]}
          />
          <Bar dataKey="value" fill="#67d7e5" fillOpacity={0.62} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
