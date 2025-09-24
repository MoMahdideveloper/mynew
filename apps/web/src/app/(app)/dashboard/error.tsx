"use client";

import { useEffect } from "react";

export default function DashboardError({
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
      <h2 className="text-lg font-semibold">Dashboard data failed to load.</h2>
      <p className="mt-2 text-sm text-ink">
        {error.message || "Refresh the page or try again to resume."}
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow"
      >
        Reload dashboard
      </button>
    </div>
  );
}
