import { cn } from "../../lib/utils";

interface StatusDotProps {
  active?: boolean;
  tone?: "cyan" | "amber" | "red";
  className?: string;
}

export function StatusDot({ active = true, tone = "cyan", className }: StatusDotProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex size-1.5 rounded-full",
        active && tone === "cyan" && "bg-cyan-300",
        active && tone === "amber" && "bg-amber-300",
        active && tone === "red" && "bg-red-400",
        !active && "bg-slate-600",
        className,
      )}
    >
      {active ? (
        <span
          className={cn(
            "absolute inset-0 animate-status-pulse rounded-full",
            tone === "cyan" && "bg-cyan-300",
            tone === "amber" && "bg-amber-300",
            tone === "red" && "bg-red-400",
          )}
        />
      ) : null}
    </span>
  );
}
