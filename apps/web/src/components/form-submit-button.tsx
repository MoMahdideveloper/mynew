"use client";

import { PropsWithChildren } from "react";
import { useFormStatus } from "react-dom";

interface FormSubmitButtonProps extends PropsWithChildren {
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}

export function FormSubmitButton({
  children,
  pendingLabel,
  className,
  disabled,
}: FormSubmitButtonProps) {
  const status = useFormStatus();
  const isPending = status.pending;
  return (
    <button
      type="submit"
      className={className}
      disabled={disabled || isPending}
      aria-busy={isPending}
    >
      {isPending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
