"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { updateBudgetLimitAction } from "@/server/actions";
import { Budget } from "@/types";

interface BudgetLimitEditorProps {
  budget: Budget;
}

export function BudgetLimitEditor({ budget }: BudgetLimitEditorProps) {
  const [value, setValue] = useState(() => budget.limit.toString());
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [isPending, startTransition] = useTransition();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(budget.limit.toString());
  }, [budget.limit]);

  useEffect(() => {
    if (isPending) {
      setStatus("idle");
    }
  }, [isPending]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function handleSubmit(nextValue: string) {
    if (!nextValue.trim()) return;
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("id", budget.id);
        formData.append("limit", nextValue);
        await updateBudgetLimitAction(formData);
        setStatus("saved");
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => setStatus("idle"), 2000);
      } catch (error) {
        console.error(error);
        setStatus("error");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink-muted">
      <span>Limit</span>
      <div className="flex items-center gap-2 text-sm normal-case">
        <input
          className="w-24 rounded-md border border-border/60 bg-panel-muted px-2 py-1 text-sm text-ink"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => handleSubmit(value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSubmit(value);
            }
          }}
          disabled={isPending}
        />
        <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
          {status === "saved" ? "Saved" : status === "error" ? "Error" : isPending ? "Saving" : null}
        </span>
      </div>
    </div>
  );
}
