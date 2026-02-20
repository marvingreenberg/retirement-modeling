import { test, expect } from '@playwright/test';
import { requiresApi, loadSampleData } from './helpers';

test.describe('Simulation Flow', () => {
   test.beforeEach(async ({ page }) => {
      await loadSampleData(page);
   });

   test('run single simulation produces results', async ({ page }) => {
      await requiresApi();
      test.setTimeout(60000);
      await page.getByRole('button', { name: 'Simulate' }).click();

      await expect(page.getByText('Final Balance')).toBeVisible({
         timeout: 20000,
      });
      await expect(page.getByText('Total Taxes')).toBeVisible();
      await expect(page.getByText('Years')).toBeVisible();
      await expect(page.locator('canvas')).toBeVisible();
      await expect(page.getByRole('alert')).not.toBeVisible();
   });

   test('run Monte Carlo simulation shows success rate', async ({ page }) => {
      await requiresApi();
      test.setTimeout(180000);
      await page.getByRole('button', { name: 'Simulate' }).click();
      // Both simulations run; switch to Monte Carlo tab
      await page.getByRole('button', { name: 'Monte Carlo' }).click();

      await expect(page.getByText('Success Rate')).toBeVisible({
         timeout: 120000,
      });
      await expect(page.getByText('Median', { exact: true })).toBeVisible();
      await expect(page.getByText('5th', { exact: true })).toBeVisible();
      await expect(page.getByText('95th', { exact: true })).toBeVisible();
   });

   test('add to comparison shows feedback', async ({ page }) => {
      await requiresApi();
      test.setTimeout(60000);
      await page.getByRole('button', { name: 'Simulate' }).click();
      await expect(page.getByText('Final Balance')).toBeVisible({
         timeout: 20000,
      });

      await page.getByRole('button', { name: 'Add to Comparison' }).click();
      await expect(page.getByText('Added!')).toBeVisible();
   });

   test('settings collapse after simulation', async ({ page }) => {
      await requiresApi();
      test.setTimeout(60000);
      await expect(page.getByText('Inflation %')).toBeVisible();

      await page.getByRole('button', { name: 'Simulate' }).click();
      await expect(page.getByText('Final Balance')).toBeVisible({
         timeout: 20000,
      });

      // Settings collapsed — inputs hidden, summary bar with Simulate button shown
      await expect(page.getByText('Inflation %')).not.toBeVisible();
      await expect(
         page.getByRole('button', { name: 'Simulate', exact: true }),
      ).toBeVisible();
   });

   test('portfolio editor appears above simulate settings', async ({
      page,
   }) => {
      const accounts = page.getByRole('button', { name: /^Accounts/ });
      const simulate = page.getByRole('button', { name: 'Simulate' });
      const accountsBox = await accounts.boundingBox();
      const simulateBox = await simulate.boundingBox();
      expect(accountsBox!.y).toBeLessThan(simulateBox!.y);
   });
});
