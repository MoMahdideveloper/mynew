"use client";

import { useEffect } from "react";

export default function BudgetsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-2xl border border-negative/40 bg-panel p-6 text-negative shadow-sm">
      <h2 className="text-lg font-semibold">Budgets failed to load.</h2>
      <p className="mt-2 text-sm text-ink">
        {error.message || "We couldn’t load guardrails. Try again or refresh the page."}
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow"
      >
        Retry
      </button>
    </div>
  );
}
