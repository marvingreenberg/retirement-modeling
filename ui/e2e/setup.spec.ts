import { test, expect } from '@playwright/test';

test.describe('First-use setup flow', () => {
   test.beforeEach(async ({ page }) => {
      await page.goto('/');
   });

   test('redirects to settings on first visit', async ({ page }) => {
      await expect(page).toHaveURL(/\/settings/);
      await expect(
         page.getByRole('heading', { name: 'Basic Info' }),
      ).toBeVisible();
      await expect(page.getByText('Your Name')).toBeVisible();
      await expect(page.getByText('Your Age')).toBeVisible();
   });

   test('shows context banner when needs setup', async ({ page }) => {
      await expect(
         page.getByText(/enter your info to get started/i),
      ).toBeVisible();
   });

   test('shows Get Started and Load Sample Data buttons', async ({ page }) => {
      await expect(
         page.getByRole('button', { name: 'Get Started' }),
      ).toBeVisible();
      await expect(
         page.getByRole('button', { name: 'Load Sample Data' }),
      ).toBeVisible();
   });

   test('validates empty name', async ({ page }) => {
      await page.getByPlaceholder('e.g. 55').fill('60');
      await page.getByRole('button', { name: 'Get Started' }).click();
      await expect(page.getByText('Please enter your name')).toBeVisible();
   });

   test('validates invalid age', async ({ page }) => {
      await page.getByPlaceholder('e.g. Mike').fill('Alice');
      await page.getByPlaceholder('e.g. 55').fill('15');
      await page.getByRole('button', { name: 'Get Started' }).click();
      await expect(page.getByText('valid age')).toBeVisible();
   });

   test('completes setup and navigates to overview', async ({ page }) => {
      await page.getByPlaceholder('e.g. Mike').fill('Alice');
      await page.getByPlaceholder('e.g. 55').fill('60');
      await page.getByRole('button', { name: 'Get Started' }).click();
      await expect(page).toHaveURL('/');
      await expect(
         page.getByRole('banner').getByRole('link', { name: /overview/i }),
      ).toBeVisible();
   });

   test('spouse fields appear when checkbox toggled', async ({ page }) => {
      await expect(page.getByText('Spouse Name')).not.toBeVisible();
      await page.getByLabel('I have a spouse/partner').check();
      await expect(page.getByText('Spouse Name')).toBeVisible();
      await expect(page.getByText('Spouse Age')).toBeVisible();
   });

   test('load sample data navigates to overview', async ({ page }) => {
      await page.getByRole('button', { name: 'Load Sample Data' }).click();
      await expect(page).toHaveURL('/');
      await expect(
         page.getByRole('banner').getByRole('link', { name: /overview/i }),
      ).toBeVisible();
   });
});
