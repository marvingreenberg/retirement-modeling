import { test, expect } from '@playwright/test';
import { requiresApi, loadSampleData } from './helpers';

test.describe('Compare Page', () => {
   test.beforeEach(async ({ page }) => {
      await loadSampleData(page);
   });

   test('shows empty state with no comparisons', async ({ page }) => {
      await page
         .getByRole('banner')
         .getByRole('link', { name: /compare/i })
         .click();
      await expect(page).toHaveURL(/\/compare/);
      await expect(page.getByText('No comparisons yet')).toBeVisible();
   });

   test('shows snapshot after simulation and add-to-comparison', async ({
      page,
   }) => {
      await requiresApi();
      test.setTimeout(60000);
      await page.getByRole('button', { name: 'Simulate' }).click();
      await expect(page.getByText('Final Balance')).toBeVisible({
         timeout: 20000,
      });

      await page.getByRole('button', { name: 'Add to Comparison' }).click();
      await expect(page.getByText('Added!')).toBeVisible();

      await page
         .getByRole('banner')
         .getByRole('link', { name: /compare/i })
         .click();
      await expect(page).toHaveURL(/\/compare/);

      await expect(page.getByText('No comparisons yet')).not.toBeVisible();
      await expect(page.getByText('Final Balance')).toBeVisible();
   });
});
