"use client";

import { useEffect, useState } from "react";
import { Budget, BudgetTemplate } from "@/types";

interface BudgetFormProps {
  templates: BudgetTemplate[];
  action: (formData: FormData) => Promise<void>;
  defaultStart: string;
  defaultEnd: string;
  initialBudget?: Budget | null;
  resetHref?: string;
}

const periodOptions = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

const currencyOptions = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "JPY", label: "JPY" },
];

export function BudgetForm({
  templates,
  action,
  defaultStart,
  defaultEnd,
  initialBudget,
  resetHref,
}: BudgetFormProps) {
  const [budgetId, setBudgetId] = useState<string | undefined>(
    initialBudget?.id,
  );
  const [category, setCategory] = useState(initialBudget?.category ?? "");
  const [period, setPeriod] = useState<string>(initialBudget?.period ?? "monthly");
  const [limit, setLimit] = useState(
    initialBudget ? String(initialBudget.limit) : "",
  );
  const [currency, setCurrency] = useState<string>(
    initialBudget?.currency ?? "USD",
  );
  const [startDate, setStartDate] = useState(
    initialBudget ? initialBudget.startDate.slice(0, 10) : defaultStart,
  );
  const [endDate, setEndDate] = useState(
    initialBudget ? initialBudget.endDate.slice(0, 10) : defaultEnd,
  );
  const [autoCalculated, setAutoCalculated] = useState(
    initialBudget
      ? initialBudget.autoCalculated ?? initialBudget.currency === "USD"
      : true,
  );

  useEffect(() => {
    if (initialBudget) {
      setBudgetId(initialBudget.id);
      setCategory(initialBudget.category);
      setPeriod(initialBudget.period);
      setLimit(String(initialBudget.limit));
      setCurrency(initialBudget.currency);
      setStartDate(initialBudget.startDate.slice(0, 10));
      setEndDate(initialBudget.endDate.slice(0, 10));
      setAutoCalculated(
        initialBudget.autoCalculated ?? initialBudget.currency === "USD",
      );
    } else {
      setBudgetId(undefined);
      setCategory("");
      setPeriod("monthly");
      setLimit("");
      setCurrency("USD");
      setStartDate(defaultStart);
      setEndDate(defaultEnd);
      setAutoCalculated(true);
    }
  }, [initialBudget, defaultStart, defaultEnd]);

  const isEditing = Boolean(budgetId);

  function resetForm() {
    setBudgetId(undefined);
    setCategory("");
    setPeriod("monthly");
    setLimit("");
    setCurrency("USD");
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setAutoCalculated(true);
  }

  function applyTemplate(template: BudgetTemplate) {
    setCategory(template.category);
    setPeriod(template.period);
    setLimit(String(template.limit));
    setCurrency(template.currency);
    setAutoCalculated(template.currency === "USD");
    if (!initialBudget) {
      setBudgetId(undefined);
    }
  }

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      {isEditing ? (
        <input type="hidden" name="id" value={budgetId} />
      ) : null}
      <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
        Category
        <input
          className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
          name="category"
          required
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
      </label>
      <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
        Period
        <select
          className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
          name="period"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
        Limit
        <input
          className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
          name="limit"
          value={limit}
          onChange={(event) => setLimit(event.target.value)}
          required
        />
      </label>
      <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
        Currency
        <select
          className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
          name="currency"
          value={currency}
          onChange={(event) => {
            const next = event.target.value;
            setCurrency(next);
            if (next === "USD") {
              setAutoCalculated(true);
            } else {
              setAutoCalculated(false);
            }
          }}
        >
          {currencyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
        Start date
        <input
          className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
          type="date"
          name="startDate"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
          required
        />
      </label>
      <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
        End date
        <input
          className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
          type="date"
          name="endDate"
          value={endDate}
          onChange={(event) => setEndDate(event.target.value)}
          required
        />
      </label>
      <label className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-ink-muted md:col-span-2">
        <input
          type="checkbox"
          name="autoCalculated"
          checked={autoCalculated}
          onChange={(event) => setAutoCalculated(event.target.checked)}
        />
        Enable auto recalculation (USD only)
      </label>
      <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {templates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => applyTemplate(template)}
              className="rounded-full border border-border/60 px-3 py-1 text-xs font-medium text-ink"
            >
              Apply {template.name}
            </button>
          ))}
        </div>
        <button
          type="submit"
          className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white shadow"
        >
          {isEditing ? "Update budget" : "Save budget"}
        </button>
      </div>
      <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-subtle">
        <p>{isEditing ? "Editing existing budget" : "Creating new budget"}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full border border-border/60 px-3 py-1 text-[0.75rem] font-medium text-ink"
          >
            Start new
          </button>
          {resetHref ? (
            <a
              href={resetHref}
              className="rounded-full border border-border/60 px-3 py-1 text-[0.75rem] font-medium text-ink"
            >
              Clear selection
            </a>
          ) : null}
        </div>
      </div>
    </form>
  );
}
