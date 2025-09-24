export default function TransactionsLoading() {
  return (
    <div className="space-y-10" aria-busy>
      <div className="space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-panel-muted" />
        <div className="h-4 w-80 animate-pulse rounded bg-panel-muted" />
      </div>
      <div className="grid gap-6">
        <div className="rounded-2xl border border-border/40 bg-panel p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-3 w-20 rounded bg-panel-muted" />
                <div className="h-10 rounded bg-panel-muted" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border/40 bg-panel p-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-3 w-24 rounded bg-panel-muted" />
                <div className="h-6 rounded bg-panel-muted" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border/40 bg-panel p-4 shadow-sm">
          <div className="h-64 animate-pulse rounded bg-panel-muted" />
        </div>
      </div>
    </div>
  );
}
