"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { BudgetTemplate } from "@/types";
import { ActionState, initialActionState } from "@/server/action-state";
import { FormSubmitButton } from "@/components/form-submit-button";
import { FormStatusMessage } from "@/components/form-status-message";

interface BudgetFormProps {
  templates: BudgetTemplate[];
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultStart: string;
  defaultEnd: string;
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

export function BudgetForm({ templates, action, defaultStart, defaultEnd }: BudgetFormProps) {
  const [category, setCategory] = useState("");
  const [period, setPeriod] = useState<string>("monthly");
  const [limit, setLimit] = useState("");
  const [currency, setCurrency] = useState<string>("USD");
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [autoCalculated, setAutoCalculated] = useState(true);
  const [state, formAction] = useFormState<ActionState, FormData>(
    action,
    initialActionState,
  );

  function applyTemplate(template: BudgetTemplate) {
    setCategory(template.category);
    setPeriod(template.period);
    setLimit(String(template.limit));
    setCurrency(template.currency);
    setAutoCalculated(template.currency === "USD");
  }

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
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
        <div className="flex flex-col items-end gap-2">
          <FormStatusMessage state={state} />
          <FormSubmitButton
            pendingLabel="Saving..."
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white shadow"
          >
            Save budget
          </FormSubmitButton>
        </div>
      </div>
    </form>
  );
}
