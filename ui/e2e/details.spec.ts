import { test, expect } from '@playwright/test';
import { requiresApi, loadSampleData } from './helpers';

test.describe('Details Page', () => {
   test.beforeEach(async ({ page }) => {
      await loadSampleData(page);
   });

   test('shows prompt when no simulation has run', async ({ page }) => {
      await page
         .getByRole('banner')
         .getByRole('link', { name: /details/i })
         .click();
      await expect(page).toHaveURL(/\/details/);
      await expect(page.getByText('Run a simulation')).toBeVisible();
   });

   test('shows year-by-year table after simulation', async ({ page }) => {
      await requiresApi();
      test.setTimeout(60000);
      await page.getByRole('button', { name: 'Simulate' }).click();
      await expect(page.getByText('Final Balance')).toBeVisible({
         timeout: 20000,
      });

      await page
         .getByRole('banner')
         .getByRole('link', { name: /details/i })
         .click();
      await expect(page).toHaveURL(/\/details/);

      await expect(page.getByText('Year-by-Year Detail')).toBeVisible();
      await expect(
         page.getByRole('columnheader', { name: 'Year', exact: true }),
      ).toBeVisible();
      await expect(
         page.getByRole('columnheader', { name: 'Age', exact: true }),
      ).toBeVisible();
      await expect(
         page.getByRole('columnheader', { name: 'AGI', exact: true }),
      ).toBeVisible();
      await expect(
         page.getByRole('columnheader', { name: 'Total Balance', exact: true }),
      ).toBeVisible();
   });
});
