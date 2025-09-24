"use client";

import { useFormState, useFormStatus } from "react-dom";
import { User } from "@/types";
import { updateUserRoleAction } from "@/server/actions";
import { ActionResult, idleActionResult } from "@/lib/action-result";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded-md border border-border/60 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-border/10 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Saving..." : "Update"}
    </button>
  );
}

function Message({ state }: { state: ActionResult }) {
  if (state.status === "idle") return null;
  const tone = state.status === "error" ? "text-negative" : "text-positive";
  return <p className={`text-xs font-medium ${tone}`}>{state.message}</p>;
}

export function UserRoleForm({ user }: { user: User }) {
  const [state, dispatch] = useFormState(updateUserRoleAction, idleActionResult);
  return (
    <form action={dispatch} className="flex items-center gap-3">
      <input type="hidden" name="id" value={user.id} />
      <select
        name="role"
        defaultValue={user.role}
        className="rounded-md border border-border/60 bg-panel px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="member">Member</option>
        <option value="admin">Admin</option>
      </select>
      <SubmitButton />
      <Message state={state} />
    </form>
  );
}
