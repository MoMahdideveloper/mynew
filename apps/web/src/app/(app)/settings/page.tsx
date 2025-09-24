export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-ink">Settings</h1>
        <p className="text-ink-subtle max-w-2xl">
          Preferences and data controls are read-only for the MVP while workflows are stubbed for future iterations.
        </p>
      </header>

      <section className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Preferences</h2>
        <ul className="mt-3 space-y-2 text-sm text-ink-subtle">
          <li>Primary currency: USD</li>
          <li>Theme: Light</li>
          <li>Accessibility: High contrast toggled</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Security badges</h2>
        <ul className="mt-3 space-y-2 text-sm text-ink-subtle">
          <li>Local data encrypted at rest</li>
          <li>Audit log retention: 30 days</li>
          <li>Last import: 2 days ago</li>
        </ul>
      </section>

      <section className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Data controls</h2>
        <ul className="mt-3 space-y-2 text-sm text-ink-subtle">
          <li>Export JSON snapshot</li>
          <li>Reset local database</li>
          <li>Import data (CSV/JSON)</li>
        </ul>
        <p className="mt-3 text-xs text-ink-muted">
          Actions will be wired once authentication and multi-tenant isolation land.
        </p>
      </section>
    </div>
  );
}
