import Link from "next/link";
import { SummaryCard } from "@/components/summary-card";
import {
  getAccounts,
  getBudgets,
  getDrafts,
  getPredictiveNudges,
  getSummary,
  getBudgetStatus,
  formatBudgetRange,
} from "@/server/queries";
import { formatCurrency } from "@/lib/fx";

export default async function DashboardPage() {
  const [summary, budgets, drafts, accounts] = await Promise.all([
    getSummary(),
    getBudgets(),
    getDrafts(),
    getAccounts(),
  ]);
  const nudges = getPredictiveNudges(budgets);
  const totals = summary.metrics;

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-ink">Unified dashboard</h1>
        <p className="text-ink-subtle max-w-2xl">
          Review balances, active budgets, ingestion drafts, and predictive nudges at a glance. Actions revalidate live pages and keep budgets in sync.
        </p>
      </header>

      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Net balance"
            value={formatCurrency(totals[0] ?? 0, "USD")}
            subtitle="Income minus outflow across all accounts"
          />
          <SummaryCard
            title="This month inflow"
            value={formatCurrency(totals[1] ?? 0, "USD")}
          />
          <SummaryCard
            title="This month outflow"
            value={formatCurrency(totals[2] ?? 0, "USD")}
          />
          <SummaryCard
            title="Draft queue"
            value={<span>{drafts.length} pending</span>}
            subtitle="Confirm drafts to sync budgets"
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Active budgets</h2>
            <Link className="text-sm font-medium text-accent" href="/budgets">
              Manage budgets
            </Link>
          </div>
          <ul className="space-y-3">
            {budgets.slice(0, 5).map((budget) => {
              const status = getBudgetStatus(budget);
              return (
                <li
                  key={budget.id}
                  className="rounded-xl border border-border/60 bg-panel p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {budget.category}
                      </p>
                      <p className="text-xs text-ink-subtle">
                        {budget.period.toUpperCase()} · {formatBudgetRange(budget)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-ink">
                        {formatCurrency(budget.spent, "USD")} / {formatCurrency(budget.limit, budget.currency)}
                      </p>
                      {status !== "on-track" ? (
                        <Link
                          href="/alerts"
                          className="mt-1 inline-flex items-center text-xs font-medium text-negative"
                        >
                          View alerts
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
            {budgets.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border/60 bg-panel-muted text-ink-subtle p-6 text-sm">
                No budgets yet. Create one to track progress.
              </li>
            ) : null}
          </ul>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">Draft queue</h3>
              <Link className="text-sm font-medium text-accent" href="/ingestion/queue">
                Review
              </Link>
            </div>
            <ul className="mt-4 space-y-3" aria-live="polite">
              {drafts.slice(0, 4).map((draft) => (
                <li key={draft.id} className="rounded-lg border border-border/60 bg-panel-muted p-3">
                  <p className="text-sm font-medium text-ink">{draft.detail}</p>
                  <p className="text-xs text-ink-subtle">Received {new Date(draft.receivedAt).toLocaleString()}</p>
                </li>
              ))}
              {drafts.length === 0 ? (
                <li className="text-sm text-ink-subtle">No drafts waiting.</li>
              ) : null}
            </ul>
          </div>

          <div className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm">
            <h3 className="text-base font-semibold text-ink mb-3">Accounts snapshot</h3>
            <ul className="space-y-2">
              {accounts.map((account) => (
                <li key={account.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink-subtle">{account.name}</span>
                  <span className="font-medium text-ink">
                    {formatCurrency(account.balance, account.currency)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm">
            <h3 className="text-base font-semibold text-ink mb-3">Predictive nudges</h3>
            <ul className="space-y-3">
              {nudges.map((item) => (
                <li key={item.budget.id} className="rounded-lg border border-border/50 bg-panel-muted p-3">
                  <p className="text-sm font-medium text-ink">
                    {item.budget.category} trending {Math.round(item.ratio * 100)}%
                  </p>
                  <p className="text-xs text-ink-subtle">
                    Projected monthly burn {formatCurrency(item.projectedMonthly, "USD")}
                  </p>
                </li>
              ))}
              {nudges.length === 0 ? (
                <li className="text-sm text-ink-subtle">All budgets on track.</li>
              ) : null}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
