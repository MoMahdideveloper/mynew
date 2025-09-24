import { test, expect } from "@playwright/test";

test.describe("transactions filters", () => {
  test("allows filtering by type and date", async ({ page }) => {
    await page.goto("/transactions");

    const typeSelect = page.getByLabel(/type/i);
    await expect(typeSelect).toBeVisible();
    await typeSelect.selectOption("Expense");

    const searchInput = page.getByLabel(/search/i);
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Coffee");

    const fromInput = page.getByLabel(/^from$/i);
    const toInput = page.getByLabel(/^to$/i);
    await fromInput.fill("2025-01-01");
    await toInput.fill("2025-01-31");

    await page.getByRole("button", { name: /apply filters/i }).click();

    await expect(page).toHaveURL(/transactions/);
  });
});
