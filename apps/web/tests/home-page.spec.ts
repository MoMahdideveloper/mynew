import { test, expect } from "@playwright/test";

test.describe("Marketing homepage", () => {
  test("renders hero content and blog teasers", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        name: /Take control of spending, budgets, and drafts/i,
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: "Browse the latest posts" }),
    ).toBeVisible();

    await expect(
      page.getByRole("link", { name: "View all posts" }),
    ).toBeVisible();

    const featureList = page
      .getByText("What you get")
      .locator("xpath=following-sibling::ul[1]");
    await expect(featureList.getByText("Unlimited transactions")).toBeVisible();
    await expect(featureList.getByText("Predictive nudges")).toBeVisible();

    const posts = page.getByRole("article");
    await expect(posts).toHaveCount(3);
    await expect(posts.nth(0)).toContainText("mindful spending routine", {
      useInnerText: true,
    });
    await expect(posts.nth(1)).toContainText("Template library", {
      useInnerText: true,
    });
    await expect(posts.nth(2)).toContainText("Playbook", { useInnerText: true });

    await expect(posts.first().getByRole("link", { name: "Read post" })).toBeVisible();
  });
});
