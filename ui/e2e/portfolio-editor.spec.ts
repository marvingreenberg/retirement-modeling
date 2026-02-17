import { test, expect } from '@playwright/test';
import { loadSampleData } from './helpers';

test.describe('Portfolio Editor UX', () => {
	test.beforeEach(async ({ page }) => {
		await loadSampleData(page);
	});

	test('expense type change immediately switches When field', async ({ page }) => {
		// Expand Budget section
		await page.getByRole('button', { name: /Budget/ }).click();
		await expect(page.getByText('Annual Spending ($/yr)')).toBeVisible();

		// Sample data has 1 one-time (Kitchen remodel) + 1 recurring (Travel)
		const yearCountBefore = await page.getByLabel('Year', { exact: true }).count();
		const startYearCountBefore = await page.getByLabel('Start Year').count();

		// Add a new one-time expense
		await page.getByRole('button', { name: '+ Add Expense' }).click();
		await expect(page.getByLabel('Year', { exact: true })).toHaveCount(yearCountBefore + 1);

		// Change the new expense to Recurring — should immediately show Start Year / End Year
		const typeSelect = page.getByLabel('Type').last();
		await typeSelect.selectOption('recurring');
		await expect(page.getByLabel('Start Year')).toHaveCount(startYearCountBefore + 1);
		await expect(page.getByLabel('Year', { exact: true })).toHaveCount(yearCountBefore);

		// Change back to One-time — should immediately show Year again
		await typeSelect.selectOption('one_time');
		await expect(page.getByLabel('Year', { exact: true })).toHaveCount(yearCountBefore + 1);
		await expect(page.getByLabel('Start Year')).toHaveCount(startYearCountBefore);
	});

	test('Add Income immediately shows new row', async ({ page }) => {
		// Expand Income section
		await page.getByRole('button', { name: /Income/ }).click();
		await expect(page.getByText('Social Security')).toBeVisible();

		// Count existing income stream names before adding
		const namesBefore = await page.getByLabel('Name').count();

		// Click Add Income — row should appear immediately
		await page.getByRole('button', { name: 'Add Income' }).click();
		await expect(page.getByLabel('Name')).toHaveCount(namesBefore + 1);
	});

	test('select-on-focus replaces value when typing', async ({ page }) => {
		// Expand Accounts section
		await page.getByRole('button', { name: /Accounts/ }).click();
		await expect(page.getByText('Balance').first()).toBeVisible();

		// Get the first Balance input and its current value
		const balanceInput = page.getByRole('spinbutton', { name: 'Balance' }).first();
		const origValue = await balanceInput.inputValue();
		expect(Number(origValue)).toBeGreaterThan(0);

		// Click the input (triggers select-all via onfocus) and type a new value
		await balanceInput.click();
		await page.keyboard.type('99999');

		// If select-all worked, value should be 99999, not origValue + 99999
		const newValue = await balanceInput.inputValue();
		expect(newValue).toBe('99999');
	});
});
