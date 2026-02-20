import { test, expect } from '@playwright/test';
import { loadSampleData } from './helpers';

test.describe('Spending in Budget section', () => {
   test.beforeEach(async ({ page }) => {
      await loadSampleData(page);
   });

   test('budget section is visible on overview page', async ({ page }) => {
      await expect(page.getByText('Budget')).toBeVisible();
   });

   test('budget section shows annual spending summary', async ({ page }) => {
      await expect(page.getByText(/\$120,000\/yr/)).toBeVisible();
   });
});
