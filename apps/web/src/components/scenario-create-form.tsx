"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { createScenarioFormAction } from "@/server/actions";
import {
  ActionState,
  initialActionState,
} from "@/server/action-state";
import { FormSubmitButton } from "@/components/form-submit-button";
import { FormStatusMessage } from "@/components/form-status-message";

export function ScenarioCreateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useFormState<ActionState, FormData>(
    createScenarioFormAction,
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
      className="flex flex-col gap-2 text-xs uppercase tracking-[0.2em] text-ink-muted sm:flex-row sm:items-end"
    >
      <label className="flex-1">
        Name
        <input
          className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm normal-case"
          name="name"
          required
        />
      </label>
      <div className="flex flex-col items-end gap-2 sm:w-auto">
        <FormStatusMessage state={state} />
        <FormSubmitButton
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow"
          pendingLabel="Creating..."
        >
          Create scenario
        </FormSubmitButton>
      </div>
    </form>
  );
}
