"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  deleteScenarioAction,
  promoteScenarioAction,
  saveScenarioAdjustmentsAction,
} from "@/server/actions";
import { formatCurrency } from "@/lib/fx";
import { Budget, BudgetScenario } from "@/types";

interface DraftScenarioCardProps {
  scenario: BudgetScenario & { before: number; after: number; delta: number };
  budgets: Budget[];
}

interface EditableAdjustment {
  budgetId: string;
  delta: number;
}

export function DraftScenarioCard({ scenario, budgets }: DraftScenarioCardProps) {
  const [adjustments, setAdjustments] = useState<EditableAdjustment[]>(() =>
    scenario.adjustments.map((item) => ({ budgetId: item.budgetId, delta: item.delta })),
  );
  const [feedback, setFeedback] = useState<"idle" | "saved" | "error">("idle");
  const [isSaving, startSaving] = useTransition();
  const [isPromoting, startPromoting] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setAdjustments(scenario.adjustments.map((item) => ({ budgetId: item.budgetId, delta: item.delta })));
  }, [scenario.adjustments]);

  useEffect(() => {
    if (isSaving) {
      setFeedback("idle");
    }
  }, [isSaving]);

  useEffect(() => {
    return () => {
      if (feedbackTimeout.current) {
        clearTimeout(feedbackTimeout.current);
      }
    };
  }, []);

  const availableBudgets = useMemo(() => budgets.map((budget) => ({ id: budget.id, name: budget.category })), [
    budgets,
  ]);

  function updateAdjustment(index: number, patch: Partial<EditableAdjustment>) {
    setAdjustments((current) =>
      current.map((item, idx) => (idx === index ? { ...item, ...patch } : item)),
    );
  }

  function addAdjustment() {
    const defaultBudget = availableBudgets[0]?.id ?? "";
    setAdjustments((current) => [...current, { budgetId: defaultBudget, delta: 0 }]);
  }

  function removeAdjustment(index: number) {
    setAdjustments((current) => current.filter((_, idx) => idx !== index));
  }

  function handleSave() {
    startSaving(async () => {
      try {
        const formData = new FormData();
        formData.append("id", scenario.id);
        formData.append("adjustments", JSON.stringify(adjustments));
        await saveScenarioAdjustmentsAction(formData);
        setFeedback("saved");
        if (feedbackTimeout.current) {
          clearTimeout(feedbackTimeout.current);
        }
        feedbackTimeout.current = setTimeout(() => setFeedback("idle"), 2000);
      } catch (error) {
        console.error(error);
        setFeedback("error");
      }
    });
  }

  function handlePromote() {
    startPromoting(async () => {
      const formData = new FormData();
      formData.append("id", scenario.id);
      await promoteScenarioAction(formData);
    });
  }

  function handleDelete() {
    startDeleting(async () => {
      const formData = new FormData();
      formData.append("id", scenario.id);
      await deleteScenarioAction(formData);
    });
  }

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-panel p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{scenario.name}</p>
          <p className="text-xs text-ink-subtle">
            Before vs. after: {formatCurrency(scenario.before, "USD")} → {formatCurrency(scenario.after, "USD")} (Δ {formatCurrency(scenario.delta, "USD")})
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink-muted">
          {feedback === "saved" ? "Saved" : feedback === "error" ? "Error" : isSaving ? "Saving" : "Draft"}
        </div>
      </div>
      <div className="space-y-2">
        {adjustments.map((adjustment, index) => (
          <div key={`${adjustment.budgetId}-${index}`} className="flex flex-wrap items-center gap-3 rounded-lg bg-panel-muted p-3">
            <select
              className="w-48 rounded-lg border border-border/60 bg-white px-3 py-2 text-sm"
              value={adjustment.budgetId}
              onChange={(event) => updateAdjustment(index, { budgetId: event.target.value })}
              disabled={isSaving || isPromoting || isDeleting}
            >
              {availableBudgets.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <label className="text-xs uppercase tracking-[0.2em] text-ink-muted">
              Delta (USD)
              <input
                className="mt-1 w-28 rounded-lg border border-border/60 bg-white px-3 py-2 text-sm normal-case"
                type="number"
                value={adjustment.delta}
                onChange={(event) => {
                  const parsed = Number(event.target.value);
                  updateAdjustment(index, { delta: Number.isNaN(parsed) ? 0 : parsed });
                }}
                disabled={isSaving || isPromoting || isDeleting}
              />
            </label>
            <button
              type="button"
              className="rounded-lg border border-border/60 px-3 py-1 text-xs font-semibold text-ink"
              onClick={() => removeAdjustment(index)}
              disabled={isSaving || isPromoting || isDeleting}
            >
              Remove
            </button>
          </div>
        ))}
        {adjustments.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/60 bg-panel-muted p-3 text-xs text-ink-subtle">
            No adjustments yet. Add a budget below to start experimenting.
          </p>
        ) : null}
        <button
          type="button"
          className="rounded-lg border border-border/60 px-3 py-2 text-xs font-semibold text-ink"
          onClick={addAdjustment}
          disabled={isSaving || isPromoting || isDeleting || availableBudgets.length === 0}
        >
          Add adjustment
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          className="rounded-lg border border-border/60 px-4 py-2 text-sm font-semibold text-ink"
          onClick={handleSave}
          disabled={isSaving || isPromoting || isDeleting}
        >
          Save draft
        </button>
        <button
          type="button"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow"
          onClick={handlePromote}
          disabled={isPromoting || isSaving}
        >
          {isPromoting ? "Promoting" : "Promote to active"}
        </button>
        <button
          type="button"
          className="rounded-lg border border-negative/50 px-4 py-2 text-sm font-semibold text-negative"
          onClick={handleDelete}
          disabled={isDeleting || isSaving || isPromoting}
        >
          Delete draft
        </button>
      </div>
    </div>
  );
}
