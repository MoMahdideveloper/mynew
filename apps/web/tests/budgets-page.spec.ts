import { test, expect } from "@playwright/test";

test.describe("Budgets workspace", () => {
  test("surfaces guardrails, templates, scenarios, and nudges", async ({ page }) => {
    await page.goto("/budgets");

    await expect(page.getByRole("heading", { name: "Budgets" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Recalculate all" })).toBeVisible();

    await expect(page.getByText("Dining Out")).toBeVisible();
    await expect(page.getByText("Groceries")).toBeVisible();
    await expect(page.getByText("Travel")).toBeVisible();
    await expect(page.getByText(/Auto-calculated/)).toBeVisible();

    const editLinks = page.getByRole("link", { name: "Edit in form" });
    await expect(editLinks).toHaveCount(3);

    await expect(page.getByRole("heading", { name: "Templates" })).toBeVisible();
    await expect(page.getByText("Baseline essentials")).toBeVisible();
    await expect(page.getByText("Commuter lunches")).toBeVisible();

    await expect(page.getByRole("heading", { name: "Scenario planning" })).toBeVisible();
    await expect(page.getByText("Summer travel plan")).toBeVisible();
    await expect(page.getByRole("button", { name: "Clone to draft" })).toBeVisible();

    await expect(page.getByRole("heading", { name: "Predictive nudges" })).toBeVisible();
    await expect(page.getByText("All budgets on track.")).toBeVisible();
  });
});
