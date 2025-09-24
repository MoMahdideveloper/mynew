"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { createTransactionFormAction } from "@/server/actions";
import {
  ActionState,
  initialActionState,
} from "@/server/action-state";
import { FormSubmitButton } from "@/components/form-submit-button";
import { FormStatusMessage } from "@/components/form-status-message";

export function TransactionCreateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState<ActionState, FormData>(
    createTransactionFormAction,
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
      className="mt-4 grid gap-4 md:grid-cols-2"
    >
      <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
        Payee
        <input
          className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
          name="payee"
          required
        />
      </label>
      <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
        Account
        <input
          className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
          name="account"
          required
        />
      </label>
      <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
        Category
        <input
          className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
          name="category"
          required
        />
      </label>
      <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
        Type
        <select
          className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
          name="type"
        >
          <option value="Expense">Expense</option>
          <option value="Income">Income</option>
        </select>
      </label>
      <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
        Amount
        <input
          className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
          name="amount"
          placeholder="120.00"
          required
        />
      </label>
      <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
        Currency
        <select
          className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
          name="currency"
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="JPY">JPY</option>
        </select>
      </label>
      <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
        Date
        <input
          className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
          type="date"
          name="date"
          required
        />
      </label>
      <label className="text-xs uppercase tracking-[0.2em] text-ink-muted md:col-span-2">
        Notes
        <textarea
          className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
          name="notes"
          rows={2}
        />
      </label>
      <div className="md:col-span-2 flex flex-col items-end gap-2">
        <FormStatusMessage state={state} />
        <FormSubmitButton
          className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white shadow"
          pendingLabel="Saving..."
        >
          Add transaction
        </FormSubmitButton>
      </div>
    </form>
  );
}
