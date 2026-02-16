import { test, expect } from '@playwright/test';

test.describe('First-use setup flow', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
	});

	test('shows setup view on first visit', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'Retirement Simulator' })).toBeVisible();
		await expect(page.getByPlaceholder('e.g. Mike')).toBeVisible();
		await expect(page.getByPlaceholder('e.g. 55')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Load Sample Data' })).toBeVisible();
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

	test('completes setup and shows main UI', async ({ page }) => {
		await page.getByPlaceholder('e.g. Mike').fill('Alice');
		await page.getByPlaceholder('e.g. 55').fill('60');
		await page.getByRole('button', { name: 'Get Started' }).click();

		// Setup view disappears, main UI appears
		await expect(page.getByPlaceholder('e.g. Mike')).not.toBeVisible();
		// AppBar navigation visible
		await expect(page.getByRole('banner').getByRole('link', { name: /overview/i })).toBeVisible();
	});

	test('spouse fields appear when checkbox toggled', async ({ page }) => {
		await expect(page.getByPlaceholder('e.g. Karen')).not.toBeVisible();
		await page.getByLabel('I have a spouse/partner').check();
		await expect(page.getByPlaceholder('e.g. Karen')).toBeVisible();
		await expect(page.getByPlaceholder('e.g. 52')).toBeVisible();
	});

	test('load sample data skips setup', async ({ page }) => {
		await page.getByRole('button', { name: 'Load Sample Data' }).click();
		// Setup disappears, main UI with AppBar nav appears
		await expect(page.getByRole('heading', { name: 'Retirement Simulator' })).not.toBeVisible();
		await expect(page.getByRole('banner').getByRole('link', { name: /overview/i })).toBeVisible();
	});
});
