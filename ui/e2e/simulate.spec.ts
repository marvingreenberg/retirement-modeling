import { test, expect } from '@playwright/test';

async function skipSetup(page: import('@playwright/test').Page) {
	await page.goto('/');
	await page.getByRole('button', { name: 'Load Sample Data' }).click();
	for (let i = 0; i < 6; i++) {
		await page.mouse.click(10, 10);
		await page.waitForTimeout(200);
	}
}

test.describe('Simulation Flow', () => {
	test.beforeEach(async ({ page }) => {
		await skipSetup(page);
	});

	test('run single simulation produces results', async ({ page }) => {
		test.setTimeout(60000);
		await page.getByRole('button', { name: 'Simulate' }).click();

		await expect(page.getByText('Final Balance')).toBeVisible({ timeout: 20000 });
		await expect(page.getByText('Total Taxes')).toBeVisible();
		await expect(page.getByText('Years')).toBeVisible();
		await expect(page.locator('canvas')).toBeVisible();
		await expect(page.getByRole('alert')).not.toBeVisible();
	});

	test('run Monte Carlo simulation shows success rate', async ({ page }) => {
		test.setTimeout(90000);
		await page.getByLabel('Monte Carlo').check();
		await page.getByRole('button', { name: 'Simulate' }).click();

		await expect(page.getByText('Success Rate')).toBeVisible({ timeout: 60000 });
		await expect(page.getByText('Median', { exact: true })).toBeVisible();
		await expect(page.getByText('5th', { exact: true })).toBeVisible();
		await expect(page.getByText('95th', { exact: true })).toBeVisible();
	});

	test('add to comparison shows feedback', async ({ page }) => {
		test.setTimeout(60000);
		await page.getByRole('button', { name: 'Simulate' }).click();
		await expect(page.getByText('Final Balance')).toBeVisible({ timeout: 20000 });

		await page.getByRole('button', { name: 'Add to Comparison' }).click();
		await expect(page.getByText('Added!')).toBeVisible();
	});

	test('settings collapse after simulation', async ({ page }) => {
		test.setTimeout(60000);
		await expect(page.getByLabel('Single run')).toBeVisible();

		await page.getByRole('button', { name: 'Simulate' }).click();
		await expect(page.getByText('Final Balance')).toBeVisible({ timeout: 20000 });

		// Settings collapsed — radio buttons hidden
		await expect(page.getByLabel('Single run')).not.toBeVisible();
		// Collapsed summary bar has a Simulate button (use exact match to avoid the wrapper)
		await expect(page.getByRole('button', { name: 'Simulate', exact: true })).toBeVisible();
	});

	test('portfolio summary bar shows monthly spending', async ({ page }) => {
		// The summary bar at the bottom should show monthly spending with annual note
		const summaryBar = page.locator('.bg-surface-100, .dark\\:bg-surface-800').filter({ hasText: 'Spending' });
		await expect(summaryBar.getByText(/\/mo/)).toBeVisible();
		await expect(summaryBar.getByText(/\/yr\)/)).toBeVisible();
	});
});
