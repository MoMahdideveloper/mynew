"use client";

import { useFormState } from "react-dom";
import { Transaction } from "@/types";
import { deleteTransactionAction, updateTransactionFormAction } from "@/server/actions";
import {
  ActionState,
  initialActionState,
} from "@/server/action-state";
import { FormSubmitButton } from "@/components/form-submit-button";
import { FormStatusMessage } from "@/components/form-status-message";

interface TransactionEditFormProps {
  transaction: Transaction;
  suggestions: string[];
}

export function TransactionEditForm({
  transaction,
  suggestions,
}: TransactionEditFormProps) {
  const [state, formAction] = useFormState<ActionState, FormData>(
    updateTransactionFormAction,
    initialActionState,
  );

  return (
    <div className="rounded-lg border border-border/60 bg-panel-muted p-3">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="id" value={transaction.id} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
            Payee
            <input
              className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
              name="payee"
              defaultValue={transaction.payee}
            />
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
            Account
            <input
              className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
              name="account"
              defaultValue={transaction.account}
            />
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
            Category
            <input
              className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
              name="category"
              defaultValue={transaction.category}
            />
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
            Type
            <select
              className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
              name="type"
              defaultValue={transaction.type}
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
              defaultValue={String(transaction.amount)}
            />
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
            Currency
            <select
              className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
              name="currency"
              defaultValue={transaction.currency}
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
              name="date"
              type="date"
              defaultValue={transaction.date.slice(0, 10)}
            />
          </label>
          <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
            Notes
            <textarea
              className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
              name="notes"
              defaultValue={transaction.notes ?? ""}
              rows={2}
            />
          </label>
        </div>
        {suggestions.length ? (
          <p className="text-xs text-ink-subtle">
            Category suggestions: {suggestions.join(", ")}
          </p>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <FormStatusMessage state={state} />
          <FormSubmitButton
            className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white"
            pendingLabel="Updating..."
          >
            Update transaction
          </FormSubmitButton>
        </div>
      </form>
      <form
        action={deleteTransactionAction}
        className="mt-2 flex justify-end"
      >
        <input type="hidden" name="id" value={transaction.id} />
        <FormSubmitButton
          className="rounded-lg border border-negative/50 px-3 py-2 text-xs font-semibold text-negative"
          pendingLabel="Deleting..."
        >
          Delete
        </FormSubmitButton>
      </form>
    </div>
  );
}
