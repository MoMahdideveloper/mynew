export default function DashboardLoading() {
  return (
    <div className="space-y-10" aria-busy>
      <div className="space-y-2">
        <div className="h-8 w-56 animate-pulse rounded bg-panel-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-panel-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 rounded-2xl border border-border/40 bg-panel shadow-sm"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="h-64 rounded-2xl border border-border/40 bg-panel shadow-sm"
          />
        ))}
      </div>
    </div>
  );
}
