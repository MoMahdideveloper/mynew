"use client";

import { useFormState } from "react-dom";
import { renameScenarioFormAction } from "@/server/actions";
import {
  ActionState,
  initialActionState,
} from "@/server/action-state";
import { FormSubmitButton } from "@/components/form-submit-button";
import { FormStatusMessage } from "@/components/form-status-message";

interface ScenarioRenameFormProps {
  id: string;
  defaultName: string;
}

export function ScenarioRenameForm({
  id,
  defaultName,
}: ScenarioRenameFormProps) {
  const [state, formAction] = useFormState<ActionState, FormData>(
    renameScenarioFormAction,
    initialActionState,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      <input type="hidden" name="id" value={id} />
      <label className="flex-1 text-xs uppercase tracking-[0.2em] text-ink-muted">
        Name
        <input
          className="mt-1 w-full rounded-lg border border-border/60 bg-white px-3 py-2 text-sm normal-case"
          name="name"
          defaultValue={defaultName}
          required
        />
      </label>
      <div className="flex flex-col items-end gap-2 sm:w-auto">
        <FormStatusMessage state={state} />
        <FormSubmitButton
          className="rounded-lg border border-border/60 px-3 py-1 text-xs font-semibold text-ink"
          pendingLabel="Renaming..."
        >
          Rename
        </FormSubmitButton>
      </div>
    </form>
  );
}
