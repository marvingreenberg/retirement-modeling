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
		// Base spending amount shown in the header summary
		await expect(page.getByText(/Base:.*\/yr/)).toBeVisible();
	});
});
