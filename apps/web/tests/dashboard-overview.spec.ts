import { test, expect } from "@playwright/test";

test.describe("Dashboard overview", () => {
  test("shows summary metrics, budgets, and supporting panels", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(
      page.getByRole("heading", { name: "Unified dashboard" }),
    ).toBeVisible();

    for (const label of [
      "Net balance",
      "This month inflow",
      "This month outflow",
      "Draft queue",
    ]) {
      await expect(page.getByText(label, { exact: false })).toBeVisible();
    }

    await expect(page.getByRole("heading", { name: "Active budgets" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Manage budgets" })).toBeVisible();

    const budgetsList = page
      .getByRole("heading", { name: "Active budgets" })
      .locator("xpath=ancestor::section[1]")
      .getByRole("listitem");
    await expect(budgetsList).toHaveCount(3);
    await expect(budgetsList.first()).toContainText("Dining Out");

    await expect(page.getByRole("heading", { name: "Draft queue" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Review" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Accounts snapshot" })).toBeVisible();
    await expect(page.getByText("HSBC Checking")).toBeVisible();

    await expect(page.getByRole("heading", { name: "Predictive nudges" })).toBeVisible();
    await expect(page.getByText("All budgets on track.")).toBeVisible();
  });
});
