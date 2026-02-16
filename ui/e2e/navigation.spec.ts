import { test, expect } from '@playwright/test';

async function skipSetup(page: import('@playwright/test').Page) {
	await page.goto('/');
	// First visit redirects to /settings; click Load Sample Data to complete setup
	await page.getByRole('button', { name: 'Load Sample Data' }).click();
}

test.describe('Navigation', () => {
	test.beforeEach(async ({ page }) => {
		await skipSetup(page);
	});

	test('AppBar shows all nav links', async ({ page }) => {
		const banner = page.getByRole('banner');
		await expect(banner.getByRole('link', { name: /overview/i })).toBeVisible();
		await expect(banner.getByRole('link', { name: /compare/i })).toBeVisible();
		await expect(banner.getByRole('link', { name: /details/i })).toBeVisible();
	});

	test('navigate to Compare page', async ({ page }) => {
		await page.getByRole('banner').getByRole('link', { name: /compare/i }).click();
		await expect(page).toHaveURL(/\/compare/);
	});

	test('navigate to Details page', async ({ page }) => {
		await page.getByRole('banner').getByRole('link', { name: /details/i }).click();
		await expect(page).toHaveURL(/\/details/);
		await expect(page.getByText('Run a simulation')).toBeVisible();
	});

	test('navigate back to Overview', async ({ page }) => {
		await page.getByRole('banner').getByRole('link', { name: /compare/i }).click();
		await expect(page).toHaveURL(/\/compare/);
		await page.getByRole('banner').getByRole('link', { name: /overview/i }).click();
		await expect(page).toHaveURL('/');
	});

	test('color bar is visible', async ({ page }) => {
		const colorBar = page.locator('.bg-gradient-to-r');
		await expect(colorBar).toBeVisible();
	});

	test('avatar opens dropdown with Settings link', async ({ page }) => {
		await page.getByLabel('Open profile').click();
		await expect(page.getByRole('link', { name: /settings/i })).toBeVisible();
	});

	test('Settings link navigates to settings page', async ({ page }) => {
		await page.getByLabel('Open profile').click();
		await page.getByRole('link', { name: /settings/i }).click();
		await expect(page).toHaveURL(/\/settings/);
		await expect(page.getByText('Basic Info')).toBeVisible();
	});
});
