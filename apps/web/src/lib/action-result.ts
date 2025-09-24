export type ActionResult = {
  status: "idle" | "success" | "error";
  message?: string;
};

export const idleActionResult: ActionResult = { status: "idle" };
