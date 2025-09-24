import { getAlertRules, getBudgets, getBudgetStatus } from "@/server/queries";
import { formatCurrency } from "@/lib/fx";

export default async function AlertsPage() {
  const [rules, budgets] = await Promise.all([getAlertRules(), getBudgets()]);
  const flaggedBudgets = budgets.filter((budget) => {
    const status = getBudgetStatus(budget);
    return status === "at-risk" || status === "exceeded";
  });

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-ink">Alerts</h1>
        <p className="text-ink-subtle max-w-2xl">
          View budget guardrails at risk, configured alert rules, and delivery channels. Rules are read-only for MVP.
        </p>
      </header>

      <section className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Budgets at risk</h2>
        <ul className="mt-4 space-y-3">
          {flaggedBudgets.map((budget) => {
            const status = getBudgetStatus(budget);
            return (
              <li
                key={budget.id}
                className="rounded-xl border border-border/60 bg-panel-muted p-3"
              >
                <p className="text-sm font-semibold text-ink">
                  {budget.category} ({status})
                </p>
                <p className="text-xs text-ink-subtle">
                  {formatCurrency(budget.spent, "USD")} of {formatCurrency(budget.limit, budget.currency)} used · {budget.period.toUpperCase()}
                </p>
              </li>
            );
          })}
          {flaggedBudgets.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border/60 bg-panel-muted p-4 text-sm text-ink-subtle">
              All budgets are on track.
            </li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Alert rules</h2>
        <ul className="mt-4 space-y-3">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className="rounded-xl border border-border/60 bg-panel-muted p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{rule.name}</p>
                  <p className="text-xs text-ink-subtle">
                    {rule.type === "at-risk" ? "At 80% threshold" : "Exceeded guardrail"}
                  </p>
                </div>
                <span className="rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-ink">
                  {rule.channel}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Channels</h2>
        <ul className="mt-3 space-y-2 text-sm text-ink-subtle">
          <li>Email digest (daily)</li>
          <li>Slack #finance-updates</li>
          <li>SMS fallback (manual)</li>
        </ul>
      </section>
    </div>
  );
}
