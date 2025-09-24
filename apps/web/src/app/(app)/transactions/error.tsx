"use client";

import { useEffect } from "react";

export default function TransactionsError({
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
      <h2 className="text-lg font-semibold">We ran into a problem loading transactions.</h2>
      <p className="mt-2 text-sm text-ink">
        {error.message || "Please retry in a moment or contact support if the issue persists."}
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow"
      >
        Try again
      </button>
    </div>
  );
}
