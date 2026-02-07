import { test, expect } from '@playwright/test';

test('simulate flow produces results', async ({ page }) => {
	await page.goto('/');

	// Switch to the Simulate tab
	await page.getByRole('tab', { name: 'Simulate' }).click();

	// Click the Simulate button (uses default portfolio)
	await page.getByRole('button', { name: 'Simulate' }).click();

	// Wait for results — summary stats should appear
	await expect(page.getByText('Final Balance')).toBeVisible({ timeout: 15000 });
	await expect(page.getByText('Total Taxes')).toBeVisible();
	await expect(page.getByText('Years')).toBeVisible();

	// A chart canvas should render
	await expect(page.locator('canvas')).toBeVisible();

	// No error messages
	await expect(page.getByRole('alert')).not.toBeVisible();
});
