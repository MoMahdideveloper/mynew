import { test, expect } from '@playwright/test';

// Skeleton suite documenting the desired coverage for the transactions filters.
test.describe('Transactions filters', () => {
  test.skip(true, 'Implement transactions filter coverage once the UI workflow is automated.');

  test('filters by transaction type', async ({ page }) => {
    await page.goto('/transactions');
    await expect(page).toHaveTitle(/Transactions/i);

    // TODO: select "Expense" and assert that only expense rows remain visible.
  });

  test('applies text search across payee and category', async ({ page }) => {
    await page.goto('/transactions');

    // TODO: populate the search input and assert table rows reduce accordingly.
  });

  test('filters transactions within an inclusive date range', async ({ page }) => {
    await page.goto('/transactions');

    // TODO: set date pickers and validate the metrics + table reflect the range.
  });
});
