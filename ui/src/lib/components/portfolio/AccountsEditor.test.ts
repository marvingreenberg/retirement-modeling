import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import AccountsEditor from './AccountsEditor.svelte';
import { validationErrors, formTouched, samplePortfolio } from '$lib/stores';
import type { Account, SimulationConfig } from '$lib/types';

function makeAccount(overrides: Partial<Account> = {}): Account {
	return {
		id: 'account_1', name: 'Traditional IRA', balance: 500000,
		type: 'ira', owner: 'primary', cost_basis_ratio: 0.0, available_at_age: 0,
		...overrides,
	};
}

function makeConfig(overrides: Partial<SimulationConfig> = {}): SimulationConfig {
	return { ...structuredClone(samplePortfolio.config), ...overrides };
}

describe('AccountsEditor', () => {
	beforeEach(() => {
		validationErrors.set({});
		formTouched.set(false);
	});

	it('renders account fields with correct values', () => {
		render(AccountsEditor, { accounts: [makeAccount()] });
		expect(screen.getByLabelText('Name')).toHaveValue('Traditional IRA');
		expect(screen.getByLabelText('Type')).toHaveValue('ira');
		expect(screen.getByLabelText('Balance')).toHaveValue(500000);
		expect(screen.getByLabelText('Owner')).toHaveValue('primary');
	});

	it('adds account row when clicking Add Account', async () => {
		render(AccountsEditor, { accounts: [makeAccount()] });
		expect(screen.getAllByLabelText('Name')).toHaveLength(1);
		await fireEvent.click(screen.getByText('+ Add Account'));
		expect(screen.getAllByLabelText('Name')).toHaveLength(2);
	});

	it('new account gets default values', async () => {
		render(AccountsEditor, { accounts: [makeAccount()] });
		await fireEvent.click(screen.getByText('+ Add Account'));
		const nameInputs = screen.getAllByLabelText('Name');
		expect(nameInputs[1]).toHaveValue('Account 2');
		const balanceInputs = screen.getAllByLabelText('Balance');
		expect(balanceInputs[1]).toHaveValue(0);
		const typeSelects = screen.getAllByLabelText('Type');
		expect(typeSelects[1]).toHaveValue('brokerage');
	});

	it('removes account row when clicking remove', async () => {
		const accounts = [
			makeAccount(),
			makeAccount({ id: 'account_2', name: 'Roth IRA', type: 'roth_ira' }),
		];
		render(AccountsEditor, { accounts });
		expect(screen.getAllByLabelText('Name')).toHaveLength(2);
		const removeButtons = screen.getAllByRole('button', { name: '✕' });
		await fireEvent.click(removeButtons[0]);
		expect(screen.getAllByLabelText('Name')).toHaveLength(1);
		expect(screen.getByLabelText('Name')).toHaveValue('Roth IRA');
	});

	it('disables remove button when only one account', () => {
		render(AccountsEditor, { accounts: [makeAccount()] });
		expect(screen.getByRole('button', { name: '✕' })).toBeDisabled();
	});

	it('enables remove buttons with multiple accounts', () => {
		const accounts = [makeAccount(), makeAccount({ id: 'account_2' })];
		render(AccountsEditor, { accounts });
		screen.getAllByRole('button', { name: '✕' }).forEach((btn) => {
			expect(btn).not.toBeDisabled();
		});
	});

	it('shows balance error styling when form touched and validation fails', () => {
		validationErrors.set({ 'accounts.0.balance': 'Must be >= 0' });
		formTouched.set(true);
		render(AccountsEditor, { accounts: [makeAccount({ balance: -100 })] });
		expect(screen.getByLabelText('Balance').className).toContain('ring-error-500');
	});

	it('hides balance error styling when form not touched', () => {
		validationErrors.set({ 'accounts.0.balance': 'Must be >= 0' });
		formTouched.set(false);
		render(AccountsEditor, { accounts: [makeAccount({ balance: -100 })] });
		expect(screen.getByLabelText('Balance').className).not.toContain('ring-error-500');
	});

	it('clears balance error when validation errors removed', async () => {
		validationErrors.set({ 'accounts.0.balance': 'Must be >= 0' });
		formTouched.set(true);
		render(AccountsEditor, { accounts: [makeAccount({ balance: -100 })] });
		expect(screen.getByLabelText('Balance').className).toContain('ring-error-500');

		validationErrors.set({});
		await waitFor(() => {
			expect(screen.getByLabelText('Balance').className).not.toContain('ring-error-500');
		});
	});

	it('shows error styling on correct account index', () => {
		validationErrors.set({ 'accounts.1.balance': 'Must be >= 0' });
		formTouched.set(true);
		const accounts = [
			makeAccount(),
			makeAccount({ id: 'account_2', name: 'Bad Account', balance: -50 }),
		];
		render(AccountsEditor, { accounts });
		const balanceInputs = screen.getAllByLabelText('Balance');
		expect(balanceInputs[0].className).not.toContain('ring-error-500');
		expect(balanceInputs[1].className).toContain('ring-error-500');
	});

	it('disables cost basis for non-brokerage types', () => {
		render(AccountsEditor, { accounts: [makeAccount({ type: 'ira' })] });
		expect(screen.getByLabelText('Basis, as %')).toBeDisabled();
	});

	it('enables cost basis for brokerage type', () => {
		render(AccountsEditor, { accounts: [makeAccount({ type: 'brokerage', cost_basis_ratio: 0.40 })] });
		expect(screen.getByLabelText('Basis, as %')).not.toBeDisabled();
	});

	it('shows all expected account types in dropdown', () => {
		render(AccountsEditor, { accounts: [makeAccount()] });
		const select = screen.getByLabelText('Type');
		const options = Array.from(select.querySelectorAll('option')).map((o) => o.value);
		expect(options).toContain('brokerage');
		expect(options).toContain('roth_ira');
		expect(options).toContain('401k');
		expect(options).toContain('ira');
		expect(options).not.toContain('roth_conversion');
	});

	it('shows Avail. Year header and year display when config provided', () => {
		const config = makeConfig({ current_age_primary: 65, start_year: 2026 });
		render(AccountsEditor, {
			accounts: [makeAccount({ available_at_age: 59 })],
			config,
		});
		expect(screen.getByText('Avail. Year')).toBeInTheDocument();
		// age 59 for primary 65 in 2026 = year 2020
		expect(screen.getByLabelText('Avail. Year')).toBeInTheDocument();
		expect(screen.getByText('(age 59)')).toBeInTheDocument();
	});

	it('shows no age hint when available_at_age is 0 with config', () => {
		const config = makeConfig({ current_age_primary: 65, start_year: 2026 });
		render(AccountsEditor, {
			accounts: [makeAccount({ available_at_age: 0 })],
			config,
		});
		expect(screen.queryByText('(age')).not.toBeInTheDocument();
	});

	it('falls back to Avail. Age without config', () => {
		render(AccountsEditor, { accounts: [makeAccount()] });
		expect(screen.getByText('Avail. Age')).toBeInTheDocument();
		expect(screen.getByLabelText('Avail. Age')).toBeInTheDocument();
	});
});
