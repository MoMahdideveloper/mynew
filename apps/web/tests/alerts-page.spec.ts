import { test, expect } from "@playwright/test";

test.describe("Alerts center", () => {
  test("lists alert rules and communicates status", async ({ page }) => {
    await page.goto("/alerts");

    await expect(page.getByRole("heading", { name: "Alerts" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Budgets at risk" })).toBeVisible();
    await expect(page.getByText("All budgets are on track.")).toBeVisible();

    await expect(page.getByRole("heading", { name: "Alert rules" })).toBeVisible();
    const rules = page
      .getByRole("heading", { name: "Alert rules" })
      .locator("xpath=ancestor::section[1]")
      .getByRole("listitem");
    await expect(rules).toHaveCount(2);
    await expect(rules.first()).toContainText("Dining out over 80%");
    await expect(rules.nth(1)).toContainText("Budgets exceeded");

    await expect(page.getByRole("heading", { name: "Channels" })).toBeVisible();
    await expect(page.getByText("Slack #finance-updates")).toBeVisible();
  });
});
