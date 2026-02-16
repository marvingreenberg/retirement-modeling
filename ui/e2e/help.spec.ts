import { test, expect } from '@playwright/test';

async function skipSetup(page: import('@playwright/test').Page) {
	await page.goto('/');
	await page.getByRole('button', { name: 'Load Sample Data' }).click();
}

test.describe('Help Drawer', () => {
	test.beforeEach(async ({ page }) => {
		await skipSetup(page);
	});

	test('help button opens drawer with contextual topic', async ({ page }) => {
		await page.getByLabel('Open help').click();
		const drawer = page.getByRole('complementary', { name: 'Help' });
		await expect(drawer).toBeVisible();
		// Default topic for / route is Spending Strategies
		await expect(drawer.getByRole('heading', { name: 'Spending Strategies', level: 3 })).toBeVisible();
	});

	test('navigate between topics', async ({ page }) => {
		await page.getByLabel('Open help').click();
		const drawer = page.getByRole('complementary', { name: 'Help' });
		await drawer.getByRole('navigation', { name: 'Help topics' }).getByText('Income Stream COLA').click();
		await expect(drawer.getByRole('heading', { name: 'Income Stream COLA', level: 3 })).toBeVisible();
	});

	test('maximize and minimize toggle', async ({ page }) => {
		await page.getByLabel('Open help').click();
		await page.getByLabel('Maximize help').click();
		await expect(page.getByLabel('Minimize help')).toBeVisible();
		await page.getByLabel('Minimize help').click();
		await expect(page.getByLabel('Maximize help')).toBeVisible();
	});

	test('close drawer with close button', async ({ page }) => {
		await page.getByLabel('Open help').click();
		await expect(page.getByRole('complementary', { name: 'Help' })).toBeVisible();
		await page.getByLabel('Close help').click();
		await expect(page.getByRole('complementary', { name: 'Help' })).not.toBeVisible();
	});

	test('contextual topic for Details route', async ({ page }) => {
		await page.getByRole('banner').getByRole('link', { name: /details/i }).click();
		await page.getByLabel('Open help').click();
		const drawer = page.getByRole('complementary', { name: 'Help' });
		await expect(drawer.getByRole('heading', { name: 'Tax Bracket Inflation Indexing', level: 3 })).toBeVisible();
	});

	test('related topic links navigate within drawer', async ({ page }) => {
		await page.getByLabel('Open help').click();
		const drawer = page.getByRole('complementary', { name: 'Help' });
		// Spending Strategies has related topic: Tax Bracket Inflation Indexing
		await drawer.getByRole('button', { name: /Tax Bracket.*→/ }).click();
		await expect(drawer.getByRole('heading', { name: 'Tax Bracket Inflation Indexing', level: 3 })).toBeVisible();
	});
});
