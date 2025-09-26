"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { guestSessionAction, signInAccountAction, signUpAccountAction } from "@/server/actions";
import { ActionResult, idleActionResult } from "@/lib/action-result";

const MODES = [
  { key: "signin", label: "Sign in" },
  { key: "signup", label: "Sign up" },
  { key: "guest", label: "Continue as guest" },
] as const;

type Mode = (typeof MODES)[number]["key"];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="w-full rounded-lg bg-ink text-surface px-4 py-2 text-sm font-semibold transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-border"
      disabled={pending}
    >
      {pending ? "Working..." : label}
    </button>
  );
}

function MessageBanner({ state }: { state: ActionResult }) {
  if (state.status === "idle") return null;
  const tone = state.status === "error" ? "bg-negative/10 text-negative" : "bg-positive/10 text-positive";
  return (
    <p className={`mt-3 rounded-md px-3 py-2 text-sm font-medium ${tone}`}>{state.message}</p>
  );
}

export function AuthGateway({
  redirectTo = "/dashboard",
  initialMode = "signin",
}: {
  redirectTo?: string;
  initialMode?: Mode;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [signInState, signInDispatch] = useFormState(signInAccountAction, idleActionResult);
  const [signUpState, signUpDispatch] = useFormState(signUpAccountAction, idleActionResult);
  const [guestState, guestDispatch] = useFormState(guestSessionAction, idleActionResult);

  const activeState = useMemo(() => {
    switch (mode) {
      case "signup":
        return signUpState;
      case "guest":
        return guestState;
      case "signin":
      default:
        return signInState;
    }
  }, [mode, guestState, signInState, signUpState]);

  useEffect(() => {
    if (
      signInState.status === "success" ||
      signUpState.status === "success" ||
      guestState.status === "success"
    ) {
      router.push(redirectTo);
    }
  }, [guestState.status, redirectTo, router, signInState.status, signUpState.status]);

  return (
    <div className="rounded-3xl border border-border/60 bg-panel p-6 shadow-sm">
      <div className="flex gap-2">
        {MODES.map((item) => {
          const isActive = mode === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setMode(item.key)}
              className={`flex-1 rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-ink text-surface shadow"
                  : "bg-surface text-ink hover:bg-surface/80"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="mt-6">
        {mode === "signin" && (
          <form action={signInDispatch} method="post" className="space-y-4">
            <div>
              <label htmlFor="signin-email" className="text-sm font-medium text-ink">
                Email
              </label>
              <input
                id="signin-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1 w-full rounded-lg border border-border/60 bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="signin-password" className="text-sm font-medium text-ink">
                Password
              </label>
              <input
                id="signin-password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1 w-full rounded-lg border border-border/60 bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <SubmitButton label="Sign in" />
          </form>
        )}
        {mode === "signup" && (
          <form action={signUpDispatch} method="post" className="space-y-4">
            <div>
              <label htmlFor="signup-name" className="text-sm font-medium text-ink">
                Name
              </label>
              <input
                id="signup-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                className="mt-1 w-full rounded-lg border border-border/60 bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="signup-email" className="text-sm font-medium text-ink">
                Email
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1 w-full rounded-lg border border-border/60 bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="text-sm font-medium text-ink">
                Password
              </label>
              <input
                id="signup-password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-border/60 bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <SubmitButton label="Create account" />
          </form>
        )}
        {mode === "guest" && (
          <form action={guestDispatch} method="post" className="space-y-4">
            <div>
              <label htmlFor="guest-name" className="text-sm font-medium text-ink">
                Display name (optional)
              </label>
              <input
                id="guest-name"
                name="name"
                type="text"
                placeholder="Guest"
                className="mt-1 w-full rounded-lg border border-border/60 bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <SubmitButton label="Explore as guest" />
          </form>
        )}
        <MessageBanner state={activeState} />
      </div>
      <p className="mt-6 text-xs text-ink-muted">
        All budgeting and transaction tools remain free forever. Upgrade later if you want automated bank sync or collaboration.
      </p>
    </div>
  );
}
