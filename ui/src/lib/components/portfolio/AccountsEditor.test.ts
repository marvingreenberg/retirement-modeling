import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import AccountsEditor from './AccountsEditor.svelte';
import { validationErrors, formTouched, samplePortfolio } from '$lib/stores';
import type { Account, SimulationConfig } from '$lib/types';

function makeAccount(overrides: Partial<Account> = {}): Account {
   return {
      id: 'account_1',
      name: 'Traditional IRA',
      balance: 500000,
      type: 'ira',
      owner: 'primary',
      cost_basis_ratio: 0.0,
      available_at_age: 0,
      ...overrides,
   };
}

function makeConfig(
   overrides: Partial<SimulationConfig> = {},
): SimulationConfig {
   return { ...structuredClone(samplePortfolio.config), ...overrides };
}

async function expandAccount(name: string) {
   const btn = screen.getByRole('button', { name: `Edit ${name}` });
   await fireEvent.click(btn);
}

describe('AccountsEditor', () => {
   beforeEach(() => {
      validationErrors.value = {};
      formTouched.value = false;
   });

   describe('compact row', () => {
      it('renders compact row with name and balance', () => {
         render(AccountsEditor, { accounts: [makeAccount()] });
         expect(screen.getByText('Traditional IRA')).toBeInTheDocument();
         expect(screen.getByText('$500K')).toBeInTheDocument();
      });

      it('shows type label in compact row', () => {
         render(AccountsEditor, { accounts: [makeAccount()] });
         expect(screen.getByText('IRA')).toBeInTheDocument();
      });

      it('shows compact currency for millions', () => {
         render(AccountsEditor, {
            accounts: [makeAccount({ balance: 2500000 })],
         });
         expect(screen.getByText('$2.50M')).toBeInTheDocument();
      });

      it('shows compact currency for small amounts', () => {
         render(AccountsEditor, { accounts: [makeAccount({ balance: 500 })] });
         expect(screen.getByText('$500')).toBeInTheDocument();
      });

      it('shows pie chart with allocation tooltip when stock_pct set', () => {
         render(AccountsEditor, {
            accounts: [makeAccount({ type: 'brokerage', stock_pct: 70 })],
         });
         expect(
            screen.getByRole('img', { name: '70% stocks, 30% bonds' }),
         ).toBeInTheDocument();
      });

      it('shows gray pie with unknown tooltip when stock_pct null', () => {
         render(AccountsEditor, { accounts: [makeAccount()] });
         expect(
            screen.getByRole('img', { name: 'Allocation unknown' }),
         ).toBeInTheDocument();
      });

      it('shows effective growth rate on compact row', () => {
         render(AccountsEditor, {
            accounts: [makeAccount({ type: 'ira', stock_pct: 60 })],
         });
         expect(screen.getByText('7.6%')).toBeInTheDocument();
      });

      it('shows growth rate with drag for brokerage', () => {
         render(AccountsEditor, {
            accounts: [
               makeAccount({
                  type: 'brokerage',
                  name: 'Brokerage',
                  stock_pct: 60,
                  cost_basis_ratio: 0.5,
               }),
            ],
         });
         expect(screen.getByText('7.1%')).toBeInTheDocument();
      });

      it('renders edit button for each account', () => {
         render(AccountsEditor, { accounts: [makeAccount()] });
         expect(
            screen.getByRole('button', { name: 'Edit Traditional IRA' }),
         ).toBeInTheDocument();
      });
   });

   describe('expand/collapse', () => {
      it('expands when clicking compact row', async () => {
         render(AccountsEditor, { accounts: [makeAccount()] });
         await expandAccount('Traditional IRA');
         expect(screen.getByLabelText('Name')).toHaveValue('Traditional IRA');
         expect(screen.getByLabelText('Balance')).toHaveValue(500000);
      });

      it('collapses when clicking Done', async () => {
         render(AccountsEditor, { accounts: [makeAccount()] });
         await expandAccount('Traditional IRA');
         expect(screen.getByLabelText('Name')).toBeInTheDocument();
         await fireEvent.click(
            screen.getByRole('button', { name: 'Done editing' }),
         );
         expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
         expect(screen.getByText('Traditional IRA')).toBeInTheDocument();
      });

      it('auto-expands new accounts', async () => {
         render(AccountsEditor, { accounts: [makeAccount()] });
         await fireEvent.click(screen.getByText('+ Add Account'));
         const nameInputs = screen.getAllByLabelText('Name');
         expect(nameInputs).toHaveLength(1);
         expect(nameInputs[0]).toHaveValue('Account 2');
      });

      it('auto-expands accounts with validation errors', () => {
         validationErrors.value = { 'accounts.0.balance': 'Must be >= 0' };
         formTouched.value = true;
         render(AccountsEditor, {
            accounts: [makeAccount({ balance: -100 })],
         });
         expect(screen.getByLabelText('Balance')).toBeInTheDocument();
      });

      it('can expand multiple accounts independently', async () => {
         const accounts = [
            makeAccount(),
            makeAccount({
               id: 'account_2',
               name: 'Roth IRA',
               type: 'roth_ira',
            }),
         ];
         render(AccountsEditor, { accounts });
         await expandAccount('Traditional IRA');
         expect(screen.getAllByLabelText('Name')).toHaveLength(1);
         expect(
            screen.getByRole('button', { name: 'Edit Roth IRA' }),
         ).toBeInTheDocument();
      });
   });

   describe('expanded editing', () => {
      it('renders account fields with correct values when expanded', async () => {
         render(AccountsEditor, { accounts: [makeAccount()] });
         await expandAccount('Traditional IRA');
         expect(screen.getByLabelText('Name')).toHaveValue('Traditional IRA');
         expect(screen.getByLabelText('Type')).toHaveValue('ira');
         expect(screen.getByLabelText('Balance')).toHaveValue(500000);
         expect(screen.getByLabelText('Owner')).toHaveValue('primary');
      });

      it('adds account row when clicking Add Account', async () => {
         render(AccountsEditor, { accounts: [makeAccount()] });
         await fireEvent.click(screen.getByText('+ Add Account'));
         expect(screen.getAllByLabelText('Name')).toHaveLength(1);
         const balanceInputs = screen.getAllByLabelText('Balance');
         expect(balanceInputs[0]).toHaveValue(0);
      });

      it('new account gets default values', async () => {
         render(AccountsEditor, { accounts: [makeAccount()] });
         await fireEvent.click(screen.getByText('+ Add Account'));
         const nameInputs = screen.getAllByLabelText('Name');
         expect(nameInputs[0]).toHaveValue('Account 2');
         const typeSelects = screen.getAllByLabelText('Type');
         expect(typeSelects[0]).toHaveValue('brokerage');
      });

      it('removes account when clicking delete in expanded mode', async () => {
         const accounts = [
            makeAccount(),
            makeAccount({
               id: 'account_2',
               name: 'My Roth',
               type: 'roth_ira',
            }),
         ];
         render(AccountsEditor, { accounts });
         await expandAccount('Traditional IRA');
         await fireEvent.click(
            screen.getByRole('button', { name: 'Delete account' }),
         );
         expect(screen.queryByText('Traditional IRA')).not.toBeInTheDocument();
         expect(screen.getByText('My Roth')).toBeInTheDocument();
      });

      it('removes last account leaving empty state', async () => {
         const accounts = [makeAccount()];
         render(AccountsEditor, { accounts });
         await expandAccount('Traditional IRA');
         await fireEvent.click(
            screen.getByRole('button', { name: 'Delete account' }),
         );
         expect(screen.queryByText('Traditional IRA')).not.toBeInTheDocument();
         expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
      });

      it('shows balance error styling when form touched and validation fails', async () => {
         validationErrors.value = { 'accounts.0.balance': 'Must be >= 0' };
         formTouched.value = true;
         render(AccountsEditor, {
            accounts: [makeAccount({ balance: -100 })],
         });
         // auto-expanded due to error
         expect(screen.getByLabelText('Balance').className).toContain(
            'ring-error-500',
         );
      });

      it('hides balance error styling when form not touched', async () => {
         validationErrors.value = { 'accounts.0.balance': 'Must be >= 0' };
         formTouched.value = false;
         render(AccountsEditor, {
            accounts: [makeAccount({ balance: -100 })],
         });
         await expandAccount('Traditional IRA');
         expect(screen.getByLabelText('Balance').className).not.toContain(
            'ring-error-500',
         );
      });

      it('clears balance error when validation errors removed', async () => {
         validationErrors.value = { 'accounts.0.balance': 'Must be >= 0' };
         formTouched.value = true;
         render(AccountsEditor, {
            accounts: [makeAccount({ balance: -100 })],
         });
         expect(screen.getByLabelText('Balance').className).toContain(
            'ring-error-500',
         );

         validationErrors.value = {};
         await waitFor(() => {
            expect(screen.getByLabelText('Balance').className).not.toContain(
               'ring-error-500',
            );
         });
      });

      it('shows error styling on correct account index', async () => {
         validationErrors.value = { 'accounts.1.balance': 'Must be >= 0' };
         formTouched.value = true;
         const accounts = [
            makeAccount(),
            makeAccount({
               id: 'account_2',
               name: 'Bad Account',
               balance: -50,
            }),
         ];
         render(AccountsEditor, { accounts });
         // account_2 auto-expanded due to error; expand account_1 manually
         await expandAccount('Traditional IRA');
         const balanceInputs = screen.getAllByLabelText('Balance');
         expect(balanceInputs[0].className).not.toContain('ring-error-500');
         expect(balanceInputs[1].className).toContain('ring-error-500');
      });

      it('disables cost basis for non-brokerage types', async () => {
         render(AccountsEditor, {
            accounts: [makeAccount({ type: 'ira' })],
         });
         await expandAccount('Traditional IRA');
         expect(screen.getByLabelText('Basis, as %')).toBeDisabled();
      });

      it('enables cost basis for brokerage type', async () => {
         render(AccountsEditor, {
            accounts: [
               makeAccount({
                  type: 'brokerage',
                  name: 'Brokerage',
                  cost_basis_ratio: 0.4,
               }),
            ],
         });
         await expandAccount('Brokerage');
         expect(screen.getByLabelText('Basis, as %')).not.toBeDisabled();
      });

      it('shows all expected account types in dropdown', async () => {
         render(AccountsEditor, { accounts: [makeAccount()] });
         await expandAccount('Traditional IRA');
         const select = screen.getByLabelText('Type');
         const options = Array.from(select.querySelectorAll('option')).map(
            (o) => o.value,
         );
         expect(options).toContain('brokerage');
         expect(options).toContain('roth_ira');
         expect(options).toContain('401k');
         expect(options).toContain('ira');
         expect(options).not.toContain('roth_conversion');
      });

      it('shows Avail. Year and year display when config provided', async () => {
         const config = makeConfig({
            current_age_primary: 65,
            start_year: 2026,
         });
         render(AccountsEditor, {
            accounts: [makeAccount({ available_at_age: 59 })],
            config,
         });
         await expandAccount('Traditional IRA');
         expect(screen.getByLabelText('Avail. Year')).toBeInTheDocument();
         expect(screen.getByText('(age 59)')).toBeInTheDocument();
      });

      it('shows no age hint when available_at_age is 0 with config', async () => {
         const config = makeConfig({
            current_age_primary: 65,
            start_year: 2026,
         });
         render(AccountsEditor, {
            accounts: [makeAccount({ available_at_age: 0 })],
            config,
         });
         await expandAccount('Traditional IRA');
         expect(screen.queryByText('(age')).not.toBeInTheDocument();
      });

      it('falls back to Avail. Age without config', async () => {
         render(AccountsEditor, { accounts: [makeAccount()] });
         await expandAccount('Traditional IRA');
         expect(screen.getByLabelText('Avail. Age')).toBeInTheDocument();
      });

      it('renders stock_pct input', async () => {
         render(AccountsEditor, {
            accounts: [
               makeAccount({
                  type: 'brokerage',
                  name: 'Brokerage',
                  stock_pct: 70,
               }),
            ],
         });
         await expandAccount('Brokerage');
         expect(screen.getByLabelText('Stocks %')).toBeInTheDocument();
         expect(screen.getByLabelText('Stocks %')).toHaveValue(70);
      });

      it('shows default stock_pct when account has no stock_pct', async () => {
         render(AccountsEditor, {
            accounts: [makeAccount({ type: 'brokerage', name: 'Brokerage' })],
         });
         await expandAccount('Brokerage');
         expect(screen.getByLabelText('Stocks %')).toHaveValue(60);
      });

      it('shows estimated drag for brokerage accounts', async () => {
         render(AccountsEditor, {
            accounts: [
               makeAccount({
                  type: 'brokerage',
                  name: 'Brokerage',
                  stock_pct: 60,
               }),
            ],
         });
         await expandAccount('Brokerage');
         expect(screen.getByText(/~.*% drag/)).toBeInTheDocument();
      });

      it('does not show drag for non-brokerage accounts', async () => {
         render(AccountsEditor, {
            accounts: [makeAccount({ type: 'ira' })],
         });
         await expandAccount('Traditional IRA');
         expect(screen.queryByText(/drag/)).not.toBeInTheDocument();
      });

      it('shows override drag without tilde when tax_drag_override set', async () => {
         render(AccountsEditor, {
            accounts: [
               makeAccount({
                  type: 'brokerage',
                  name: 'Brokerage',
                  tax_drag_override: 0.006,
               }),
            ],
         });
         await expandAccount('Brokerage');
         expect(screen.getByText('0.60% drag')).toBeInTheDocument();
         expect(screen.queryByText(/~/)).not.toBeInTheDocument();
      });

      it('shows reset button when tax_drag_override is set', async () => {
         render(AccountsEditor, {
            accounts: [
               makeAccount({
                  type: 'brokerage',
                  name: 'Brokerage',
                  tax_drag_override: 0.006,
               }),
            ],
         });
         await expandAccount('Brokerage');
         expect(
            screen.getByRole('button', { name: 'Reset to estimate' }),
         ).toBeInTheDocument();
      });
   });
});
