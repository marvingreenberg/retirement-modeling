import { test, expect } from '@playwright/test';

async function skipSetup(page: import('@playwright/test').Page) {
	await page.goto('/');
	await page.getByRole('button', { name: 'Load Sample Data' }).click();
	for (let i = 0; i < 6; i++) {
		await page.mouse.click(10, 10);
		await page.waitForTimeout(200);
	}
}

test.describe('Spending Page', () => {
	test.beforeEach(async ({ page }) => {
		await skipSetup(page);
	});

	test('spending page loads with heading and base amount', async ({ page }) => {
		await page.getByRole('banner').getByRole('link', { name: /spending/i }).click();
		await expect(page).toHaveURL(/\/spending/);
		await expect(page.getByText('Spending Plan')).toBeVisible();
		// Base spending shows monthly primary with annual in parentheses
		await expect(page.getByText(/Base:.*\/mo/)).toBeVisible();
		await expect(page.getByText(/\/yr\)/)).toBeVisible();
	});

	test('spending editor shows monthly input label', async ({ page }) => {
		await page.getByRole('banner').getByRole('link', { name: /spending/i }).click();
		await expect(page.getByText('Monthly Spending')).toBeVisible();
	});
});
