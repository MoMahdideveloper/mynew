export default function BudgetsLoading() {
  return (
    <div className="space-y-10" aria-busy>
      <div className="space-y-2">
        <div className="h-8 w-40 animate-pulse rounded bg-panel-muted" />
        <div className="h-4 w-72 animate-pulse rounded bg-panel-muted" />
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-border/40 bg-panel p-4 shadow-sm"
          >
            <div className="h-6 w-32 animate-pulse rounded bg-panel-muted" />
            <div className="mt-4 h-2 w-full animate-pulse rounded bg-panel-muted" />
            <div className="mt-6 h-4 w-48 animate-pulse rounded bg-panel-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
