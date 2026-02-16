import { test, expect } from '@playwright/test';

// Helper: skip setup by loading sample data and dismissing tour via clicks
async function skipSetup(page: import('@playwright/test').Page) {
	await page.goto('/');
	await page.getByRole('button', { name: 'Load Sample Data' }).click();
	// Dismiss guided tour — each click on the overlay advances one step (5 steps)
	for (let i = 0; i < 6; i++) {
		await page.mouse.click(10, 10);
		await page.waitForTimeout(200);
	}
}

test.describe('Navigation', () => {
	test.beforeEach(async ({ page }) => {
		await skipSetup(page);
	});

	test('AppBar shows all nav links', async ({ page }) => {
		const banner = page.getByRole('banner');
		await expect(banner.getByRole('link', { name: /overview/i })).toBeVisible();
		await expect(banner.getByRole('link', { name: /spending/i })).toBeVisible();
		await expect(banner.getByRole('link', { name: /compare/i })).toBeVisible();
		await expect(banner.getByRole('link', { name: /details/i })).toBeVisible();
	});

	test('navigate to Spending page', async ({ page }) => {
		await page.getByRole('banner').getByRole('link', { name: /spending/i }).click();
		await expect(page).toHaveURL(/\/spending/);
		await expect(page.getByText('Spending Plan')).toBeVisible();
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
		await page.getByRole('banner').getByRole('link', { name: /spending/i }).click();
		await expect(page).toHaveURL(/\/spending/);
		await page.getByRole('banner').getByRole('link', { name: /overview/i }).click();
		await expect(page).toHaveURL('/');
	});

	test('color bar is visible', async ({ page }) => {
		const colorBar = page.locator('.bg-gradient-to-r');
		await expect(colorBar).toBeVisible();
	});

	test('profile avatar opens drawer', async ({ page }) => {
		await page.getByLabel('Open profile').click();
		await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
		await expect(page.getByLabel('Your Name')).toBeVisible();
	});
});
