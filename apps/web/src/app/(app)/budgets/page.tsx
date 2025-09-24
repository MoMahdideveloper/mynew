import Link from "next/link";
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  formatISO,
  parseISO,
  startOfMonth,
} from "date-fns";
import {
  addTemplateAction,
  adjustBudgetLimitAction,
  createScenarioAction,
  deleteBudgetAction,
  deleteScenarioAction,
  deleteTemplateAction,
  cloneScenarioAction,
  promoteScenarioAction,
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
import { InlineBudgetEditor } from "@/components/budget-inline-editor";
import { formatCurrency } from "@/lib/fx";
import type { Budget } from "@/types";

const statusStyles: Record<string, string> = {
  "on-track": "border border-accent/20 bg-accent/10 text-accent",
  "at-risk":
    "border border-[color:rgba(251,191,36,0.4)] bg-[color:rgba(253,230,138,0.35)] text-[color:rgb(180,83,9)]",
  exceeded: "border border-negative/20 bg-negative/10 text-negative",
};

function getProgressRatio(budget: Budget) {
  if (budget.limit === 0) return 0;
  return budget.spent / budget.limit;
}

function getProgressColor(ratio: number) {
  if (ratio > 1) return "bg-negative";
  if (ratio >= 0.8) return "bg-[color:rgb(217,119,6)]";
  return "bg-accent";
}

function forecastOverspendDate(budget: Budget) {
  if (budget.limit <= 0) return null;
  const start = parseISO(budget.startDate);
  const end = parseISO(budget.endDate);
  const now = new Date();
  if (now < start) {
    return start;
  }
  const elapsed = Math.max(differenceInCalendarDays(now, start), 1);
  const dailyRate = budget.spent / elapsed;
  if (dailyRate <= 0) return null;
  const remaining = budget.limit - budget.spent;
  const daysToLimit = remaining <= 0 ? 0 : Math.ceil(remaining / dailyRate);
  const projected = addDays(now, daysToLimit);
  if (projected > end) return end;
  return projected;
}

const MONTHLY_FACTOR = {
  weekly: 52 / 12,
  monthly: 1,
  quarterly: 4 / 12,
  yearly: 1 / 12,
};

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const editParam =
    typeof resolvedParams?.edit === "string" ? resolvedParams.edit : undefined;

  const [budgets, templates, scenarios] = await Promise.all([
    getBudgets().then(sortBudgets),
    getTemplates(),
    getScenarios(),
  ]);
  const nudges = getPredictiveNudges(budgets);
  const editingBudget = editParam
    ? budgets.find((budget) => budget.id === editParam)
    : undefined;

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
  const scenarioCards = scenarioSummaries.map((scenario) => {
    const chartMax = Math.max(scenario.before, scenario.after, 1);
    const beforePercent = Math.max((scenario.before / chartMax) * 100, 6);
    const afterPercent = Math.max((scenario.after / chartMax) * 100, 6);
    return (
      <li key={scenario.id} className="rounded-xl border border-border/60 bg-panel-muted p-4">
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
          <div className="flex flex-wrap items-center gap-2">
            {scenario.isDraft ? (
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                Draft
              </span>
            ) : null}
            <form action={cloneScenarioAction}>
              <input type="hidden" name="id" value={scenario.id} />
              <button className="rounded-lg border border-border/60 px-3 py-1 text-xs font-semibold text-ink">
                Clone to draft
              </button>
            </form>
            {scenario.isDraft ? (
              <form action={promoteScenarioAction}>
                <input type="hidden" name="id" value={scenario.id} />
                <button className="rounded-lg border border-accent/60 px-3 py-1 text-xs font-semibold text-accent">
                  Finalize
                </button>
              </form>
            ) : null}
            <form action={deleteScenarioAction}>
              <input type="hidden" name="id" value={scenario.id} />
              <button className="rounded-lg border border-negative/50 px-3 py-1 text-xs font-semibold text-negative">
                Delete
              </button>
            </form>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-subtle">
          <span>
            Before {formatCurrency(scenario.before, "USD")} → After {formatCurrency(scenario.after, "USD")}
          </span>
          <span className={scenario.delta >= 0 ? "text-negative" : "text-positive"}>
            Δ {formatCurrency(scenario.delta, "USD")}
          </span>
        </div>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[0.7rem] uppercase tracking-[0.2em] text-ink-subtle">Before</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-border/60">
              <div className="h-full rounded-full bg-border/90" style={{ width: `${beforePercent}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[0.7rem] uppercase tracking-[0.2em] text-ink-subtle">After</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-border/60">
              <div className="h-full rounded-full bg-accent" style={{ width: `${afterPercent}%` }} />
            </div>
          </div>
        </div>
      </li>
    );
  });
  const rankedBudgets = [...budgets].sort((a, b) => getProgressRatio(b) - getProgressRatio(a));
  const driverBudgets = rankedBudgets.slice(0, 3);

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
          <div>
            <h2 className="text-lg font-semibold text-ink">Active budgets</h2>
            <p className="text-xs uppercase tracking-[0.2em] text-ink-subtle">
              Inline edits auto-save your limit and auto-calc preferences
            </p>
          </div>
          <div className="flex items-center gap-2">
            <form action={recalcAllBudgetsAction}>
              <button className="rounded-lg border border-border/60 px-3 py-2 text-sm font-semibold text-ink">
                Recalculate all
              </button>
            </form>
            <Link
              href="/budgets"
              className="rounded-lg border border-border/60 px-3 py-2 text-sm font-semibold text-ink"
            >
              Clear selection
            </Link>
          </div>
        </div>
        <div className="grid gap-4">
          {budgets.map((budget) => {
            const status = getBudgetStatus(budget);
            const ratio = getProgressRatio(budget);
            const percent = Math.min(Math.max(ratio * 100, 0), 130);
            const chipStyles = statusStyles[status] ?? statusStyles["on-track"];
            const progressColor = getProgressColor(ratio);
            return (
              <div
                key={budget.id}
                className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">{budget.category}</p>
                    <p className="text-xs text-ink-subtle">
                      {budget.period.toUpperCase()} · {formatBudgetRange(budget)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                    {formatCurrency(budget.spent, "USD")} / {formatCurrency(budget.limit, budget.currency)}
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${chipStyles}`}>
                      {status.replace("-", " ")}
                    </span>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-ink-subtle">
                    <span>Spent {Math.round(ratio * 100)}%</span>
                    <Link
                      href={`/budgets?edit=${budget.id}`}
                      className="text-xs font-semibold text-accent underline-offset-2 hover:underline"
                    >
                      Edit in form
                    </Link>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-border/60">
                    <div
                      className={`${progressColor} h-full rounded-full transition-all`}
                      style={{ width: `${percent}%` }}
                    />
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
                  <p className="text-[0.7rem] uppercase tracking-[0.2em] text-ink-subtle">
                    Last recalculated {new Date(budget.lastRecalculated ?? budget.startDate).toLocaleDateString()}
                  </p>
                </div>
                <InlineBudgetEditor budget={budget} action={saveBudgetAction} />
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

      <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="rounded-2xl border border-dashed border-border/60 bg-panel-muted p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-ink">Create or update budget</h3>
            <p className="text-sm text-ink-subtle">
              Weekly ranges align Monday–Sunday. Monthly scenarios multiply by 52/12 for weekly and 4/12 for quarterly budgets.
            </p>
            {editingBudget ? (
              <p className="text-xs uppercase tracking-[0.2em] text-accent">
                Editing {editingBudget.category} · {editingBudget.period.toUpperCase()}
              </p>
            ) : null}
          </div>
          <BudgetForm
            templates={templates}
            action={saveBudgetAction}
            defaultStart={defaultStart}
            defaultEnd={defaultEnd}
            initialBudget={editingBudget ?? null}
            resetHref="/budgets"
          />
        </div>

        <div className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-ink">Templates</h3>
            <p className="text-xs text-ink-subtle">
              Apply a template from within the form or duplicate below to experiment.
            </p>
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
                <div className="flex items-center gap-2">
                  <form action={deleteTemplateAction}>
                    <input type="hidden" name="id" value={template.id} />
                    <button className="rounded-lg border border-negative/50 px-3 py-1 text-xs font-semibold text-negative">
                      Delete
                    </button>
                  </form>
                </div>
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
      </section>

      <section className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-ink">Scenario planning</h3>
          </div>
          <ul className="space-y-3">
            {scenarioCards.length > 0 ? (
              scenarioCards
            ) : (
              <li className="rounded-xl border border-dashed border-border/60 bg-panel-muted p-4 text-sm text-ink-subtle">
                No scenarios created yet.
              </li>
            )}
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
      </section>

      <section className="rounded-2xl border border-border/60 bg-panel p-4 shadow-sm">
        <h3 className="text-base font-semibold text-ink">Predictive nudges</h3>
        <ul className="mt-4 space-y-3">
          {nudges.map((item) => {
            const overspendDate = forecastOverspendDate(item.budget);
            const overspendLabel = overspendDate
              ? format(overspendDate, "MMM d")
              : "end of period";
            const statusClass = statusStyles[item.status] ?? statusStyles["on-track"];
            const driverList = [
              item.budget,
              ...driverBudgets.filter((budget) => budget.id !== item.budget.id),
            ]
              .slice(0, 3)
              .map((budget) =>
                `${budget.category} (${Math.round(getProgressRatio(budget) * 100)}%)`,
              )
              .join(", ");
            return (
              <li
                key={item.budget.id}
                className="rounded-xl border border-border/60 bg-panel-muted p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {item.budget.category} trending {Math.round(item.ratio * 100)}%
                    </p>
                    <p className="text-xs text-ink-subtle">
                      Projected monthly burn {formatCurrency(item.projectedMonthly, "USD")}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}>
                    {item.status.replace("-", " ")}
                  </span>
                </div>
                <p className="mt-2 text-xs text-ink-subtle">
                  Forecast overspend by <span className="font-semibold text-ink">{overspendLabel}</span>. Drivers: {driverList}.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <form action={adjustBudgetLimitAction}>
                    <input type="hidden" name="id" value={item.budget.id} />
                    <input type="hidden" name="delta" value="50" />
                    <button className="rounded-full border border-accent/40 px-3 py-1 text-xs font-semibold text-accent">
                      Increase limit $50
                    </button>
                  </form>
                  <form action={adjustBudgetLimitAction}>
                    <input type="hidden" name="id" value={item.budget.id} />
                    <input type="hidden" name="delta" value="-25" />
                    <button className="rounded-full border border-border/60 px-3 py-1 text-xs font-semibold text-ink">
                      Tighten by $25
                    </button>
                  </form>
                  <Link
                    href={`/budgets?edit=${item.budget.id}`}
                    className="rounded-full border border-border/60 px-3 py-1 text-xs font-semibold text-ink"
                  >
                    Tune details
                  </Link>
                  <Link
                    href="/settings#alerts"
                    className="rounded-full border border-border/60 px-3 py-1 text-xs font-semibold text-ink"
                  >
                    Set reminder
                  </Link>
                </div>
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
