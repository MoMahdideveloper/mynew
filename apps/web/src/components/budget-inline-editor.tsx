"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Budget } from "@/types";

interface InlineBudgetEditorProps {
  budget: Budget;
  action: (formData: FormData) => Promise<void>;
}

function PendingIndicator() {
  const { pending } = useFormStatus();
  return (
    <span
      aria-live="polite"
      className="text-[0.7rem] uppercase tracking-[0.2em] text-ink-muted"
    >
      {pending ? "Saving..." : "Auto-saved"}
    </span>
  );
}

export function InlineBudgetEditor({ budget, action }: InlineBudgetEditorProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [limit, setLimit] = useState(String(budget.limit));
  const [autoCalculated, setAutoCalculated] = useState(
    budget.autoCalculated ?? budget.currency === "USD",
  );

  useEffect(() => {
    setLimit(String(budget.limit));
    setAutoCalculated(budget.autoCalculated ?? budget.currency === "USD");
  }, [budget]);

  const submitForm = useCallback(() => {
    const form = formRef.current;
    if (form) {
      form.requestSubmit();
    }
  }, []);

  return (
    <form
      ref={formRef}
      action={action}
      className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-panel-muted/60 p-3"
    >
      <input type="hidden" name="id" value={budget.id} />
      <input type="hidden" name="category" value={budget.category} />
      <input type="hidden" name="period" value={budget.period} />
      <input type="hidden" name="currency" value={budget.currency} />
      <input type="hidden" name="startDate" value={budget.startDate.slice(0, 10)} />
      <input type="hidden" name="endDate" value={budget.endDate.slice(0, 10)} />
      <input
        type="hidden"
        name="autoCalculated"
        value={autoCalculated ? "true" : "false"}
      />
      <label className="flex flex-col text-[0.7rem] uppercase tracking-[0.2em] text-ink-muted">
        Limit ({budget.currency})
        <input
          className="mt-1 w-28 rounded-lg border border-border/60 bg-white px-2 py-1 text-sm"
          inputMode="decimal"
          name="limit"
          value={limit}
          onChange={(event) => setLimit(event.target.value)}
          onBlur={submitForm}
        />
      </label>
      <label className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.2em] text-ink-muted">
        <input
          type="checkbox"
          checked={autoCalculated}
          onChange={(event) => {
            setAutoCalculated(event.target.checked);
            submitForm();
          }}
        />
        Auto calc
      </label>
      <button
        type="button"
        onClick={submitForm}
        className="rounded-full border border-border/60 px-3 py-1 text-[0.7rem] font-medium text-ink"
      >
        Save now
      </button>
      <PendingIndicator />
      <p className="ml-auto text-[0.65rem] uppercase tracking-[0.2em] text-ink-subtle">
        Auto-saves on blur
      </p>
    </form>
  );
}
