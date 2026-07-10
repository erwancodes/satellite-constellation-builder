import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface PanelSectionProps {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function PanelSection({
  title,
  eyebrow,
  action,
  children,
  className,
}: PanelSectionProps) {
  return (
    <section className={cn("border-t border-white/[0.07] px-4 py-4 first:border-t-0", className)}>
      <header className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.19em] text-cyan-300/65">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-200">{title}</h2>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
