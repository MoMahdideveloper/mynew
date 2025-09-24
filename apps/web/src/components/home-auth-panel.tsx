"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import {
  AuthActionState,
  continueAsGuestAction,
  signInAction,
  signUpAction,
} from "@/app/(public)/auth-actions";
import { SignOutButton } from "@/components/sign-out-button";
import { SessionUser } from "@/server/session";

const initialState: AuthActionState = {};

type Mode = "signin" | "signup";

function SubmitButton({ idleLabel, disabled }: { idleLabel: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="w-full rounded-md bg-ink text-surface py-2 text-sm font-semibold shadow-sm hover:bg-ink/90 disabled:opacity-70 disabled:cursor-not-allowed"
      disabled={pending || disabled}
    >
      {pending ? "Working..." : idleLabel}
    </button>
  );
}

export function HomeAuthPanel({ user, strapiAvailable }: { user: SessionUser; strapiAvailable: boolean }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [signInState, signInFormAction] = useFormState(signInAction, initialState);
  const [signUpState, signUpFormAction] = useFormState(signUpAction, initialState);

  if (user.role && user.role !== "guest") {
    return (
      <div className="rounded-xl border border-border bg-panel p-6 shadow-sm">
        <p className="text-sm font-semibold text-ink">You are signed in as {user.username}.</p>
        <p className="text-sm text-ink-muted mt-2">Role: {user.role}</p>
        <p className="text-sm text-ink-muted mt-4">
          Jump into the dashboard or browse the latest content—everything in Zenith Finance remains available even when you stay signed in.
        </p>
        <div className="mt-4">
          <SignOutButton />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-panel p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-ink">Get started for free</h3>
        <div className="inline-flex rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.2em] text-ink-muted">
          Always free
        </div>
      </div>
      <p className="text-sm text-ink-muted mt-2">
        Sign up to publish content, log in to manage your workspace, or jump in as a guest—financial tools stay fully accessible.
      </p>
      <div className="mt-4 flex rounded-lg bg-surface overflow-hidden border border-border">
        <button
          type="button"
          className={`flex-1 px-3 py-2 text-sm font-medium transition ${mode === "signin" ? "bg-ink text-surface" : "text-ink"}`}
          onClick={() => setMode("signin")}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`flex-1 px-3 py-2 text-sm font-medium transition ${mode === "signup" ? "bg-ink text-surface" : "text-ink"}`}
          onClick={() => setMode("signup")}
        >
          Sign up
        </button>
      </div>
      {!strapiAvailable && (
        <div className="mt-3 rounded-md border border-dashed border-negative/60 bg-negative/10 px-3 py-2 text-xs text-negative">
          Connect a Strapi project via <code>STRAPI_URL</code> to enable account creation and sign-in. Guest access remains available.
        </div>
      )}
      {mode === "signin" ? (
        <form action={signInFormAction} className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-ink">
            Email
            <input
              type="email"
              name="identifier"
              required
              placeholder="you@example.com"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/40"
              disabled={!strapiAvailable}
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Password
            <input
              type="password"
              name="password"
              required
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/40"
              disabled={!strapiAvailable}
            />
          </label>
          {signInState.error && <p className="text-xs text-negative">{signInState.error}</p>}
          {signInState.success && signInState.message && (
            <p className="text-xs text-positive">{signInState.message}</p>
          )}
          <SubmitButton idleLabel="Sign in" disabled={!strapiAvailable} />
        </form>
      ) : (
        <form action={signUpFormAction} className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-ink">
            Name
            <input
              type="text"
              name="username"
              required
              placeholder="Your name"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/40"
              disabled={!strapiAvailable}
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Email
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/40"
              disabled={!strapiAvailable}
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Password
            <input
              type="password"
              name="password"
              required
              className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink/40"
              disabled={!strapiAvailable}
            />
          </label>
          {signUpState.error && <p className="text-xs text-negative">{signUpState.error}</p>}
          {signUpState.success && signUpState.message && (
            <p className="text-xs text-positive">{signUpState.message}</p>
          )}
          <SubmitButton idleLabel="Create account" disabled={!strapiAvailable} />
        </form>
      )}
      <div className="mt-6 border-t border-border pt-4">
        <form action={continueAsGuestAction}>
          <button
            type="submit"
            className="w-full rounded-md border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-surface/60"
          >
            Continue as guest
          </button>
        </form>
        <p className="mt-2 text-xs text-ink-muted">
          Guest mode keeps every budgeting and transaction feature unlocked so you can evaluate the workspace without commitments.
        </p>
      </div>
    </div>
  );
}
