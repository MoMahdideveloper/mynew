import { ZodError } from "zod";

export type ActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const initialActionState: ActionState = { status: "idle" };

export function toErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return error.errors
      .map((issue) => issue.message || issue.path.join("."))
      .join(", ")
      .trim();
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export function success(message: string): ActionState {
  return { status: "success", message };
}

export function failure(error: unknown, fallback: string): ActionState {
  return { status: "error", message: toErrorMessage(error) || fallback };
}
