"use client";

import { ActionState } from "@/server/action-state";

interface FormStatusMessageProps {
  state: ActionState;
}

export function FormStatusMessage({ state }: FormStatusMessageProps) {
  if (state.status === "idle") {
    return null;
  }
  const isError = state.status === "error";
  return (
    <p
      role="status"
      aria-live="polite"
      className={`text-sm ${
        isError ? "text-negative" : "text-positive"
      }`}
    >
      {state.message}
    </p>
  );
}
