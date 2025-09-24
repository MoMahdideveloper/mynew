"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { addTemplateFormAction } from "@/server/actions";
import {
  ActionState,
  initialActionState,
} from "@/server/action-state";
import { FormSubmitButton } from "@/components/form-submit-button";
import { FormStatusMessage } from "@/components/form-status-message";

export function TemplateCreateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState<ActionState, FormData>(
    addTemplateFormAction,
    initialActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 text-xs uppercase tracking-[0.2em] text-ink-muted"
    >
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
      <div className="flex flex-col items-end gap-2">
        <FormStatusMessage state={state} />
        <FormSubmitButton
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow"
          pendingLabel="Saving..."
        >
          Save template
        </FormSubmitButton>
      </div>
    </form>
  );
}
