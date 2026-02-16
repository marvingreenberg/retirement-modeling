import { test, expect } from '@playwright/test';

async function skipSetup(page: import('@playwright/test').Page) {
	await page.goto('/');
	await page.getByRole('button', { name: 'Load Sample Data' }).click();
	for (let i = 0; i < 6; i++) {
		await page.mouse.click(10, 10);
		await page.waitForTimeout(200);
	}
}

test.describe('Compare Page', () => {
	test.beforeEach(async ({ page }) => {
		await skipSetup(page);
	});

	test('shows empty state with no comparisons', async ({ page }) => {
		await page.getByRole('banner').getByRole('link', { name: /compare/i }).click();
		await expect(page).toHaveURL(/\/compare/);
		await expect(page.getByText('No comparisons yet')).toBeVisible();
	});

	test('shows snapshot after simulation and add-to-comparison', async ({ page }) => {
		test.setTimeout(60000);
		await page.getByRole('button', { name: 'Simulate' }).click();
		await expect(page.getByText('Final Balance')).toBeVisible({ timeout: 20000 });

		await page.getByRole('button', { name: 'Add to Comparison' }).click();
		await expect(page.getByText('Added!')).toBeVisible();

		await page.getByRole('banner').getByRole('link', { name: /compare/i }).click();
		await expect(page).toHaveURL(/\/compare/);

		await expect(page.getByText('No comparisons yet')).not.toBeVisible();
		await expect(page.getByText('Final Balance')).toBeVisible();
	});
});
