import { getCoverageLabel, type CoverageMetrics as Metrics } from "../../lib/coverageMath";

interface CoverageScoreProps {
  metrics: Metrics;
}

export function CoverageScore({ metrics }: CoverageScoreProps) {
  const score = Math.max(0, Math.min(100, metrics.score));
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="grid grid-cols-[132px_minmax(0,1fr)] items-center gap-4">
      <div className="relative size-[132px]">
        <svg viewBox="0 0 128 128" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(148,163,184,0.09)" strokeWidth="4" />
          <circle cx="64" cy="64" r="47" fill="none" stroke="rgba(148,163,184,0.05)" strokeWidth="1" strokeDasharray="2 6" />
          <circle
            cx="64"
            cy="64"
            r="54"
            fill="none"
            stroke="#67d7e5"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-medium tracking-[-0.06em] text-slate-100">{Math.round(score)}</span>
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-slate-600">of 100</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-cyan-300/65">System assessment</p>
        <p className="mt-2 text-base font-semibold leading-tight text-slate-100">{getCoverageLabel(score)}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          {score <= 25
            ? "Expand the fleet or increase orbital diversity to reduce blind regions."
            : score <= 50
              ? "Useful regional service with significant uncovered corridors."
              : score <= 75
                ? "Operational geometry with room to improve polar and longitudinal balance."
                : score <= 90
                  ? "Strong multi-plane coverage with limited service gaps."
                  : "Broad, resilient coverage across the modeled surface."}
        </p>
      </div>
    </div>
  );
}
