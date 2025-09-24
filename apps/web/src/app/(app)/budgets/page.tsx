import { endOfMonth, formatISO, startOfMonth } from "date-fns";
import {
  addTemplateAction,
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
import { formatCurrency } from "@/lib/fx";

const MONTHLY_FACTOR = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 4 / 12,
  yearly: 1 / 12,
};

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

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-ink">Budgets</h1>
        <p className="text-ink-subtle max-w-2xl">
          Guardrails track weekly to yearly periods with USD auto-recalculation. Apply templates, manage scenarios, and trigger predictive nudges.
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
            return (
              <div
                key={budget.id}
                className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{budget.category}</p>
                    <p className="text-xs text-ink-subtle">
                      {budget.period.toUpperCase()} · {formatBudgetRange(budget)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink">
                      {formatCurrency(budget.spent, "USD")} / {formatCurrency(budget.limit, budget.currency)}
                    </p>
                    <p className="text-xs text-ink-subtle">Status: {status}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
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
                  {budget.autoCalculated ? (
                    <span className="rounded-full bg-accent-muted px-3 py-1 text-xs font-medium text-accent">
                      Auto-calculated
                    </span>
                  ) : null}
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

      <section className="rounded-2xl border border-dashed border-border/60 bg-panel-muted p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-ink">Create or update budget</h3>
          <p className="text-sm text-ink-subtle">
            Weekly ranges align Monday–Sunday. Monthly scenarios multiply by 52/12 for weekly and 4/12 for quarterly budgets.
          </p>
        </div>
        <BudgetForm
          templates={templates}
          action={saveBudgetAction}
          defaultStart={defaultStart}
          defaultEnd={defaultEnd}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm space-y-4">
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

        <div className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink">Scenario planning</h3>
          </div>
          <ul className="space-y-3">
            {scenarioSummaries.map((scenario) => (
              <li
                key={scenario.id}
                className="rounded-xl border border-border/60 bg-panel-muted p-4"
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
                  <form action={deleteScenarioAction}>
                    <input type="hidden" name="id" value={scenario.id} />
                    <button className="rounded-lg border border-negative/50 px-3 py-1 text-xs font-semibold text-negative">
                      Delete
                    </button>
                  </form>
                </div>
                <p className="mt-3 text-xs text-ink-subtle">
                  Before {formatCurrency(scenario.before, "USD")} → After {formatCurrency(scenario.after, "USD")} (Δ {formatCurrency(scenario.delta, "USD")})
                </p>
              </li>
            ))}
            {scenarioSummaries.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border/60 bg-panel-muted p-4 text-sm text-ink-subtle">
                No scenarios created yet.
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

      <section className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm">
        <h3 className="text-base font-semibold text-ink">Predictive nudges</h3>
        <ul className="mt-4 space-y-3">
          {nudges.map((item) => (
            <li key={item.budget.id} className="rounded-xl border border-border/60 bg-panel-muted p-3">
              <p className="text-sm font-semibold text-ink">
                {item.budget.category} trending {Math.round(item.ratio * 100)}%
              </p>
              <p className="text-xs text-ink-subtle">
                Projected monthly burn {formatCurrency(item.projectedMonthly, "USD")} · Status {item.status}
              </p>
            </li>
          ))}
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
