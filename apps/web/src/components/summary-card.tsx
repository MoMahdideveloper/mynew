import { ReactNode } from "react";

interface SummaryCardProps {
  title: string;
  value: ReactNode;
  subtitle?: string;
}

export function SummaryCard({ title, value, subtitle }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-panel shadow-sm p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-ink-muted mb-3">{title}</p>
      <div className="text-2xl font-semibold text-ink">{value}</div>
      {subtitle ? (
        <p className="mt-2 text-sm text-ink-subtle">{subtitle}</p>
      ) : null}
    </div>
  );
}
