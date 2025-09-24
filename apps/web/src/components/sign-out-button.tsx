"use client";

import { useFormStatus } from "react-dom";

import { signOutAction } from "@/app/(public)/auth-actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="inline-flex items-center justify-center rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink hover:bg-panel transition"
      disabled={pending}
    >
      {pending ? "Signing out..." : label}
    </button>
  );
}

export function SignOutButton({ label = "Sign out" }: { label?: string }) {
  return (
    <form action={signOutAction}>
      <SubmitButton label={label} />
    </form>
  );
}
