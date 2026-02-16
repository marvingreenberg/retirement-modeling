import { test, expect } from '@playwright/test';

async function skipSetup(page: import('@playwright/test').Page) {
	await page.goto('/');
	// First visit redirects to /settings; click Load Sample Data to complete setup
	await page.getByRole('button', { name: 'Load Sample Data' }).click();
}

test.describe('Spending in Budget section', () => {
	test.beforeEach(async ({ page }) => {
		await skipSetup(page);
	});

	test('budget section is visible on overview page', async ({ page }) => {
		await expect(page.getByText('Budget')).toBeVisible();
	});

	test('budget section shows annual spending summary', async ({ page }) => {
		await expect(page.getByText(/\$120,000\/yr/)).toBeVisible();
	});
});
