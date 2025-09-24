import { endOfMonth, formatISO, startOfMonth } from "date-fns";
import {
  deleteBudgetAction,
  deleteScenarioAction,
  deleteTemplateAction,
  recalcAllBudgetsAction,
  recalcBudgetAction,
  saveBudgetFormAction,
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
import { TemplateCreateForm } from "@/components/template-create-form";
import { ScenarioCreateForm } from "@/components/scenario-create-form";
import { ScenarioRenameForm } from "@/components/scenario-rename-form";
import { formatCurrency } from "@/lib/fx";
import { FormSubmitButton } from "@/components/form-submit-button";

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
    const maxValue = Math.max(baseMonthlyBurn, after, 1);
    return {
      ...scenario,
      before: baseMonthlyBurn,
      after,
      delta: after - baseMonthlyBurn,
      chart: {
        before: Math.min((baseMonthlyBurn / maxValue) * 100, 100),
        after: Math.min((after / maxValue) * 100, 100),
      },
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
            <FormSubmitButton
              className="rounded-lg border border-border/60 px-3 py-2 text-sm font-semibold text-ink"
              pendingLabel="Recalculating..."
            >
              Recalculate all
            </FormSubmitButton>
          </form>
        </div>
        <div className="grid gap-4">
          {budgets.map((budget) => {
            const status = getBudgetStatus(budget);
            const ratio = budget.limit === 0 ? 0 : budget.spent / budget.limit;
            const clampedRatio = Math.min(Math.max(ratio, 0), 1);
            const statusChip = {
              "on-track": "bg-positive/10 text-positive border border-positive/30",
              "at-risk": "bg-accent/10 text-accent border border-accent/30",
              exceeded: "bg-negative/10 text-negative border border-negative/30",
            }[status];
            const barFillClass =
              status === "exceeded"
                ? "bg-negative"
                : status === "at-risk"
                  ? "bg-accent"
                  : "bg-positive";
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
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-sm font-semibold text-ink">
                      {formatCurrency(budget.spent, "USD")} / {formatCurrency(budget.limit, budget.currency)}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${statusChip}`}
                    >
                      {status.replace("-", " ")}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-ink-subtle">
                    <span>Progress</span>
                    <span>{Math.round(ratio * 100)}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-panel-muted">
                    <div
                      className={`h-full rounded-full transition-all ${barFillClass}`}
                      style={{ width: `${clampedRatio * 100}%` }}
                      aria-hidden
                    />
                  </div>
                  {ratio > 1 ? (
                    <p className="mt-2 text-xs text-negative">
                      Over by {formatCurrency((ratio - 1) * budget.limit, budget.currency)}
                    </p>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <form action={recalcBudgetAction}>
                    <input type="hidden" name="id" value={budget.id} />
                    <FormSubmitButton
                      className="rounded-lg border border-border/60 px-3 py-1 text-xs font-semibold text-ink"
                      pendingLabel="Recalculating..."
                    >
                      Recalculate
                    </FormSubmitButton>
                  </form>
                  <form action={deleteBudgetAction}>
                    <input type="hidden" name="id" value={budget.id} />
                    <FormSubmitButton
                      className="rounded-lg border border-negative/50 px-3 py-1 text-xs font-semibold text-negative"
                      pendingLabel="Deleting..."
                    >
                      Delete
                    </FormSubmitButton>
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
          action={saveBudgetFormAction}
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
                  <FormSubmitButton
                    className="rounded-lg border border-negative/50 px-3 py-1 text-xs font-semibold text-negative"
                    pendingLabel="Deleting..."
                  >
                    Delete
                  </FormSubmitButton>
                </form>
              </li>
            ))}
            {templates.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border/60 bg-panel-muted p-4 text-sm text-ink-subtle">
                No templates saved yet.
              </li>
            ) : null}
          </ul>
          <TemplateCreateForm />
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
                  <ScenarioRenameForm id={scenario.id} defaultName={scenario.name} />
                  <form action={deleteScenarioAction}>
                    <input type="hidden" name="id" value={scenario.id} />
                    <FormSubmitButton
                      className="rounded-lg border border-negative/50 px-3 py-1 text-xs font-semibold text-negative"
                      pendingLabel="Deleting..."
                    >
                      Delete
                    </FormSubmitButton>
                  </form>
                </div>
                <p className="mt-3 text-xs text-ink-subtle">
                  Before {formatCurrency(scenario.before, "USD")} → After {formatCurrency(scenario.after, "USD")} (Δ {formatCurrency(scenario.delta, "USD")})
                </p>
                <div className="mt-3 space-y-2 text-xs text-ink-muted">
                  <div>
                    <span className="mr-2 font-medium text-ink">Before</span>
                    <div className="mt-1 h-2 w-full rounded-full bg-panel">
                      <div
                        className="h-full rounded-full bg-positive"
                        style={{ width: `${scenario.chart.before}%` }}
                        aria-hidden
                      />
                    </div>
                  </div>
                  <div>
                    <span className="mr-2 font-medium text-ink">After</span>
                    <div className="mt-1 h-2 w-full rounded-full bg-panel">
                      <div
                        className={`h-full rounded-full ${
                          scenario.delta > 0 ? "bg-negative" : "bg-accent"
                        }`}
                        style={{ width: `${scenario.chart.after}%` }}
                        aria-hidden
                      />
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {scenarioSummaries.length === 0 ? (
              <li className="rounded-xl border border-dashed border-border/60 bg-panel-muted p-4 text-sm text-ink-subtle">
                No scenarios created yet.
              </li>
            ) : null}
          </ul>
          <ScenarioCreateForm />
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
