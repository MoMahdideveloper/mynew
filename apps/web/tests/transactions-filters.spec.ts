import { test, expect } from "@playwright/test";

test.describe("Transactions filters", () => {
  test("search filter narrows results and reset clears query", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.getByRole("heading", { name: "Transactions" })).toBeVisible();

    const searchField = page.getByLabel("Search");
    await searchField.fill("Pret");
    await page.getByRole("button", { name: "Apply filters" }).click();

    await expect(page).toHaveURL(/q=Pret/);
    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(1);
    await expect(rows.first().getByRole("cell", { name: "Pret A Manger" })).toBeVisible();

    await page.getByRole("link", { name: "Reset" }).click();
    await expect(page).not.toHaveURL(/q=/);
    await expect(page.getByRole("cell", { name: "Spotify" })).toBeVisible();
  });

  test("type filter isolates income transactions", async ({ page }) => {
    await page.goto("/transactions");

    const typeSelect = page.getByLabel("Type");
    await typeSelect.selectOption("Income");
    await page.getByRole("button", { name: "Apply filters" }).click();

    await expect(page).toHaveURL(/type=Income/);
    const rows = page.locator("tbody tr");
    await expect(rows).toHaveCount(1);
    await expect(rows.first().getByRole("cell", { name: "Payroll" })).toBeVisible();
  });
});
