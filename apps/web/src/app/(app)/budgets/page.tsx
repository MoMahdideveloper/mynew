import { endOfMonth, formatISO, startOfMonth } from "date-fns";
import {
  addTemplateAction,
  cloneScenarioAction,
  createScenarioAction,
  deleteBudgetAction,
  deleteScenarioAction,
  deleteTemplateAction,
  recalcAllBudgetsAction,
  recalcBudgetAction,
  renameScenarioAction,
  saveBudgetAction,
} from "@/server/actions";
import {
  getBudgets,
  getPredictiveNudges,
  getScenarios,
  getTemplates,
  sortBudgets,
  getBudgetStatus,
  formatBudgetRange,
} from "@/server/queries";
import { BudgetForm } from "@/components/budget-form";
import { BudgetLimitEditor } from "@/components/budget-limit-editor";
import { DraftScenarioCard } from "@/components/draft-scenario-card";
import { formatCurrency } from "@/lib/fx";

const MONTHLY_FACTOR = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 4 / 12,
  yearly: 1 / 12,
} as const;

const STATUS_LABELS = {
  "on-track": "On track",
  "at-risk": "At risk",
  exceeded: "Exceeded",
} as const;

const STATUS_STYLES = {
  "on-track": "bg-positive/10 text-positive border border-positive/30",
  "at-risk": "bg-amber-100 text-amber-800 border border-amber-200",
  exceeded: "bg-negative/10 text-negative border border-negative/30",
} as const;

const PROGRESS_STYLES = {
  "on-track": "bg-emerald-500",
  "at-risk": "bg-amber-500",
  exceeded: "bg-negative",
} as const;

export default async function BudgetsPage() {
  const [budgets, templates, scenarios] = await Promise.all([
    getBudgets().then(sortBudgets),
    getTemplates(),
    getScenarios(),
  ]);
  const nudges = getPredictiveNudges(budgets);

  const now = new Date();
  const defaultStart = formatISO(startOfMonth(now), { representation: "date" });
  const defaultEnd = formatISO(endOfMonth(now), { representation: "date" });

  const baseMonthlyBurn = budgets
    .filter((budget) => budget.currency === "USD")
    .reduce((acc, budget) => acc + budget.spent * (MONTHLY_FACTOR[budget.period] ?? 1), 0);

  const scenarioSummaries = scenarios.map((scenario) => {
    const adjustmentTotal = scenario.adjustments.reduce((acc, adjustment) => {
      const target = budgets.find((budget) => budget.id === adjustment.budgetId);
      if (!target) return acc;
      return acc + adjustment.delta * (MONTHLY_FACTOR[target.period] ?? 1);
    }, 0);
    const after = baseMonthlyBurn + adjustmentTotal;
    return {
      ...scenario,
      before: baseMonthlyBurn,
      after,
      delta: after - baseMonthlyBurn,
    };
  });

  const activeScenarios = scenarioSummaries.filter((scenario) => scenario.status !== "draft");
  const draftScenarios = scenarioSummaries.filter((scenario) => scenario.status === "draft");

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-ink">Budgets</h1>
        <p className="text-ink-subtle max-w-2xl">
          Guardrails track weekly to yearly periods with USD auto-recalculation. Apply templates, manage scenarios, and trigger
          predictive nudges.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">Active budgets</h2>
          <form action={recalcAllBudgetsAction}>
            <button className="rounded-lg border border-border/60 px-3 py-2 text-sm font-semibold text-ink">
              Recalculate all
            </button>
          </form>
        </div>
        <div className="grid gap-4">
          {budgets.map((budget) => {
            const status = getBudgetStatus(budget);
            const ratio = budget.limit === 0 ? 0 : budget.spent / budget.limit;
            const bounded = Math.max(0, Math.min(1, ratio));
            const statusClasses = STATUS_STYLES[status];
            const progressClass = PROGRESS_STYLES[status];
            return (
              <div
                key={budget.id}
                id={`budget-${budget.id}`}
                className="space-y-4 rounded-2xl border border-border/60 bg-panel p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{budget.category}</p>
                    <p className="text-xs text-ink-subtle">
                      {budget.period.toUpperCase()} · {formatBudgetRange(budget)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`rounded-full px-3 py-1 text-xs font-medium ${statusClasses}`}>
                      {STATUS_LABELS[status]}
                    </div>
                    {budget.autoCalculated ? (
                      <span className="rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent">
                        Auto-calculated
                      </span>
                    ) : null}
                    <div className="text-right text-sm text-ink">
                      {formatCurrency(budget.spent, "USD")} / {formatCurrency(budget.limit, budget.currency)}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full rounded-full bg-border/40">
                    <div
                      className={`h-full rounded-full ${progressClass}`}
                      style={{ width: `${Math.min(100, Math.round(bounded * 100))}%` }}
                    />
                  </div>
                  <p className="text-xs text-ink-subtle">
                    Last recalculated {budget.lastRecalculated ? new Date(budget.lastRecalculated).toLocaleString() : "—"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <BudgetLimitEditor budget={budget} />
                  <div className="flex flex-wrap gap-2">
                    <form action={recalcBudgetAction}>
                      <input type="hidden" name="id" value={budget.id} />
                      <button className="rounded-lg border border-border/60 px-3 py-1 text-xs font-semibold text-ink">
                        Recalculate
                      </button>
                    </form>
                    <form action={deleteBudgetAction}>
                      <input type="hidden" name="id" value={budget.id} />
                      <button className="rounded-lg border border-negative/50 px-3 py-1 text-xs font-semibold text-negative">
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
          {budgets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-panel-muted p-6 text-sm text-ink-subtle">
              No budgets yet. Use the form below to create guardrails.
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-dashed border-border/60 bg-panel-muted p-6">
        <div>
          <h3 className="text-lg font-semibold text-ink">Create or update budget</h3>
          <p className="text-sm text-ink-subtle">
            Weekly ranges align Monday–Sunday. Monthly scenarios multiply by 52/12 for weekly and 4/12 for quarterly budgets.
          </p>
        </div>
        <BudgetForm templates={templates} action={saveBudgetAction} defaultStart={defaultStart} defaultEnd={defaultEnd} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-border/60 bg-panel p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink">Templates</h3>
          </div>
          <ul className="space-y-3">
            {templates.map((template) => (
              <li
                key={template.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-panel-muted p-3"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{template.name}</p>
                  <p className="text-xs text-ink-subtle">
                    {template.category} · {template.period.toUpperCase()} · {formatCurrency(template.limit, template.currency)}
                  </p>
                </div>
                <form action={deleteTemplateAction}>
                  <input type="hidden" name="id" value={template.id} />
                  <button className="rounded-lg border border-negative/50 px-3 py-1 text-xs font-semibold text-negative">
                    Delete
                  </button>
                </form>
              </li>
            ))}
            {templates.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border/60 bg-panel-muted p-4 text-sm text-ink-subtle">
                No templates saved yet.
              </li>
            ) : null}
          </ul>
          <form action={addTemplateAction} className="grid gap-3 text-xs uppercase tracking-[0.2em] text-ink-muted">
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                Name
                <input
                  className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm normal-case"
                  name="name"
                  required
                />
              </label>
              <label>
                Category
                <input
                  className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm normal-case"
                  name="category"
                  required
                />
              </label>
              <label>
                Period
                <select
                  className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm normal-case"
                  name="period"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </label>
              <label>
                Limit
                <input
                  className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm normal-case"
                  name="limit"
                  required
                />
              </label>
              <label>
                Currency
                <select
                  className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm normal-case"
                  name="currency"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                </select>
              </label>
            </div>
            <div className="flex justify-end">
              <button className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow">
                Save template
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4 rounded-2xl border border-border/60 bg-panel p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink">Scenario planning</h3>
          </div>
          <ul className="space-y-3">
            {activeScenarios.map((scenario) => {
              const maxValue = Math.max(scenario.before, scenario.after, 1);
              const beforeWidth = Math.min(100, Math.round((scenario.before / maxValue) * 100));
              const afterWidth = Math.min(100, Math.round((scenario.after / maxValue) * 100));
              return (
                <li
                  key={scenario.id}
                  className="space-y-3 rounded-xl border border-border/60 bg-panel-muted p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <form action={renameScenarioAction} className="flex items-center gap-2 text-sm">
                      <input type="hidden" name="id" value={scenario.id} />
                      <input
                        className="rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
                        name="name"
                        defaultValue={scenario.name}
                      />
                      <button className="rounded-lg border border-border/60 px-3 py-1 text-xs font-semibold text-ink">
                        Rename
                      </button>
                    </form>
                    <div className="flex items-center gap-2">
                      <form action={cloneScenarioAction}>
                        <input type="hidden" name="id" value={scenario.id} />
                        <button className="rounded-lg border border-border/60 px-3 py-1 text-xs font-semibold text-ink">
                          Clone to draft
                        </button>
                      </form>
                      <form action={deleteScenarioAction}>
                        <input type="hidden" name="id" value={scenario.id} />
                        <button className="rounded-lg border border-negative/50 px-3 py-1 text-xs font-semibold text-negative">
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-ink-subtle">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="uppercase tracking-[0.2em]">Before</p>
                        <div className="mt-1 h-2 w-full rounded-full bg-border/50">
                          <div className="h-full rounded-full bg-ink/40" style={{ width: `${beforeWidth}%` }} />
                        </div>
                        <p className="mt-1 font-medium text-ink">{formatCurrency(scenario.before, "USD")}</p>
                      </div>
                      <div>
                        <p className="uppercase tracking-[0.2em]">After</p>
                        <div className="mt-1 h-2 w-full rounded-full bg-border/50">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${afterWidth}%` }} />
                        </div>
                        <p className="mt-1 font-medium text-ink">{formatCurrency(scenario.after, "USD")}</p>
                      </div>
                    </div>
                    <p>
                      Monthly delta {formatCurrency(scenario.delta, "USD")} with {scenario.adjustments.length} adjustment
                      {scenario.adjustments.length === 1 ? "" : "s"}.
                    </p>
                  </div>
                </li>
              );
            })}
            {activeScenarios.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border/60 bg-panel-muted p-4 text-sm text-ink-subtle">
                No active scenarios yet.
              </li>
            ) : null}
          </ul>
          <form action={createScenarioAction} className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-ink-muted">
            <label className="flex-1">
              Name
              <input
                className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm normal-case"
                name="name"
                required
              />
            </label>
            <button className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow">
              Create scenario
            </button>
          </form>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border/60 bg-panel p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-ink">Draft workspace</h3>
          <span className="text-xs uppercase tracking-[0.2em] text-ink-muted">
            Tune adjustments before promoting
          </span>
        </div>
        <div className="space-y-3">
          {draftScenarios.map((scenario) => (
            <DraftScenarioCard key={scenario.id} scenario={scenario} budgets={budgets} />
          ))}
          {draftScenarios.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-panel-muted p-4 text-sm text-ink-subtle">
              Clone an active scenario or create a new one to start experimenting.
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border/60 bg-panel p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-ink">Predictive nudges</h3>
          <span className="text-xs uppercase tracking-[0.2em] text-ink-muted">
            Forecasted pressure points
          </span>
        </div>
        <ul className="space-y-3">
          {nudges.map((item) => {
            const percentage = Math.round(item.ratio * 100);
            const progressWidth = Math.min(100, Math.max(0, percentage));
            const projectedDate = item.forecastDate ? new Date(item.forecastDate).toLocaleDateString() : "Now";
            const daysUntil =
              item.projectedDaysToLimit === Number.POSITIVE_INFINITY
                ? null
                : Math.max(0, Math.ceil(item.projectedDaysToLimit));
            return (
              <li key={item.budget.id} className="space-y-3 rounded-xl border border-border/60 bg-panel-muted p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{item.budget.category}</p>
                    <p className="text-xs text-ink-subtle">
                      {percentage}% of limit · {STATUS_LABELS[item.status]}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      className="rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-white shadow"
                      href={`#budget-${item.budget.id}`}
                    >
                      Adjust limit
                    </a>
                    <a
                      className="rounded-lg border border-border/60 px-3 py-1 text-xs font-semibold text-ink"
                      href="/alerts"
                    >
                      Review alerts
                    </a>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-border/40">
                  <div
                    className="h-full rounded-full bg-negative"
                    style={{ width: `${progressWidth}%` }}
                  />
                </div>
                <p className="text-xs text-ink-subtle">
                  Forecasted overspend {projectedDate}
                  {daysUntil !== null ? ` (${daysUntil} day${daysUntil === 1 ? "" : "s"})` : ""}. {item.daysRemaining} day
                  {item.daysRemaining === 1 ? "" : "s"} left in period.
                </p>
                <p className="text-xs text-ink-subtle">
                  Projected monthly burn {formatCurrency(item.projectedMonthly, "USD")}.
                </p>
              </li>
            );
          })}
          {nudges.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border/60 bg-panel-muted p-4 text-sm text-ink-subtle">
              All budgets on track.
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
