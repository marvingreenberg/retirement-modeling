import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import WithdrawalPlan from './WithdrawalPlan.svelte';
import type { YearResult } from '$lib/types';
import {
   portfolio,
   profile,
   samplePortfolio,
   defaultProfile,
} from '$lib/stores';

function makeYear(overrides: Partial<YearResult> = {}): YearResult {
   return {
      year: 2026,
      age_primary: 65,
      age_spouse: 62,
      agi: 100000,
      bracket: '22%',
      rmd: 0,
      surplus: 0,
      roth_conversion: 0,
      conversion_tax: 0,
      conversion_tax_from_brokerage: 0,
      pretax_withdrawal: 0,
      roth_withdrawal: 0,
      brokerage_withdrawal: 50000,
      total_tax: 12000,
      irmaa_cost: 0,
      total_balance: 900000,
      spending_target: 80000,
      planned_expense: 0,
      total_income: 0,
      income_tax: 12000,
      pretax_balance: 400000,
      roth_balance: 200000,
      roth_conversion_balance: 0,
      brokerage_balance: 300000,
      brokerage_gains_tax: 0,
      pretax_401k_deposit: 0,
      roth_401k_deposit: 0,
      spending_limited: false,
      withdrawal_details: [],
      income_details: [],
      ...overrides,
   };
}

describe('WithdrawalPlan', () => {
   beforeEach(() => {
      profile.value = { primaryName: 'Alex', spouseName: 'Sam' };
      portfolio.value = structuredClone(samplePortfolio);
   });

   it('renders heading', () => {
      render(WithdrawalPlan, { props: { years: [makeYear()] } });
      expect(screen.getByText('Withdrawal Plan')).toBeTruthy();
   });

   it('shows year and both names with ages', () => {
      render(WithdrawalPlan, {
         props: {
            years: [makeYear({ year: 2027, age_primary: 66, age_spouse: 63 })],
         },
      });
      expect(screen.getByText(/2027/)).toBeTruthy();
      expect(screen.getByText(/Alex 66/)).toBeTruthy();
      expect(screen.getByText(/Sam 63/)).toBeTruthy();
   });

   it('shows single person header when no spouse', () => {
      profile.value = { primaryName: 'Alex', spouseName: '' };
      render(WithdrawalPlan, {
         props: { years: [makeYear({ year: 2027, age_primary: 66 })] },
      });
      expect(screen.getByText(/Alex 66/)).toBeTruthy();
      expect(screen.queryByText(/Sam/)).toBeNull();
   });

   it('shows spending in uses section', () => {
      render(WithdrawalPlan, {
         props: { years: [makeYear({ spending_target: 100000 })] },
      });
      expect(screen.getByText('Spending')).toBeTruthy();
      expect(screen.getByText('$100,000')).toBeTruthy();
   });

   it('shows only the selected year when multiple years provided', () => {
      const years = [
         makeYear({ year: 2026, age_primary: 65 }),
         makeYear({ year: 2027, age_primary: 66 }),
      ];
      render(WithdrawalPlan, { props: { years } });
      expect(screen.getByText(/2026/)).toBeTruthy();
      expect(screen.queryByText(/2027/)).toBeNull();
   });

   it('shows second year when yearIndex is 1', () => {
      const years = [
         makeYear({ year: 2026, age_primary: 65 }),
         makeYear({ year: 2027, age_primary: 66 }),
      ];
      render(WithdrawalPlan, { props: { years, yearIndex: 1 } });
      expect(screen.getByText(/2027/)).toBeTruthy();
      expect(screen.queryByText(/2026/)).toBeNull();
   });

   it('falls back to first year when yearIndex is out of range', () => {
      const years = [makeYear({ year: 2026 })];
      render(WithdrawalPlan, { props: { years, yearIndex: 5 } });
      expect(screen.getByText(/2026/)).toBeTruthy();
   });

   it('shows RMD section with per-person totals', () => {
      const yr = makeYear({
         rmd: 20000,
         withdrawal_details: [
            {
               account_id: 'ira1',
               account_name: 'Primary IRA',
               amount: 20000,
               purpose: 'rmd',
            },
         ],
      });
      render(WithdrawalPlan, { props: { years: [yr] } });
      expect(screen.getByText('RMD')).toBeTruthy();
      expect(screen.getAllByText('$20,000').length).toBeGreaterThanOrEqual(1);
   });

   it('shows spending withdrawals with per-account details', () => {
      const yr = makeYear({
         withdrawal_details: [
            {
               account_id: 'brok',
               account_name: 'Brokerage',
               amount: 50000,
               purpose: 'spending',
            },
         ],
      });
      render(WithdrawalPlan, { props: { years: [yr] } });
      expect(screen.getByText('Withdrawals')).toBeTruthy();
      expect(screen.getByText('Brokerage')).toBeTruthy();
   });

   it('labels withdrawals as Additional when RMD present', () => {
      const yr = makeYear({
         rmd: 10000,
         withdrawal_details: [
            {
               account_id: 'ira1',
               account_name: 'IRA',
               amount: 10000,
               purpose: 'rmd',
            },
            {
               account_id: 'brok',
               account_name: 'Brokerage',
               amount: 50000,
               purpose: 'spending',
            },
         ],
      });
      render(WithdrawalPlan, { props: { years: [yr] } });
      expect(screen.getByText('Additional Withdrawals')).toBeTruthy();
   });

   it('shows Roth conversion with per-account details', () => {
      const yr = makeYear({
         roth_conversion: 80000,
         withdrawal_details: [
            {
               account_id: 'ira1',
               account_name: 'Main IRA',
               amount: 80000,
               purpose: 'conversion',
            },
         ],
      });
      render(WithdrawalPlan, { props: { years: [yr] } });
      expect(screen.getByText('Roth Conversion')).toBeTruthy();
      expect(screen.getByText('Main IRA')).toBeTruthy();
   });

   it('shows No Roth Conversion when none', () => {
      render(WithdrawalPlan, {
         props: { years: [makeYear({ roth_conversion: 0 })] },
      });
      expect(screen.getByText('No Roth Conversion')).toBeTruthy();
   });

   it('shows taxes section', () => {
      render(WithdrawalPlan, {
         props: { years: [makeYear({ total_tax: 15000 })] },
      });
      expect(screen.getByText('Taxes')).toBeTruthy();
      expect(screen.getByText('$15,000')).toBeTruthy();
   });

   it('shows IRMAA surcharge as its own line when present', () => {
      render(WithdrawalPlan, {
         props: { years: [makeYear({ irmaa_cost: 2400 })] },
      });
      expect(screen.getByText('IRMAA Surcharge')).toBeTruthy();
      expect(screen.getByText('$2,400')).toBeTruthy();
   });

   it('hides IRMAA surcharge when zero', () => {
      render(WithdrawalPlan, {
         props: { years: [makeYear({ irmaa_cost: 0 })] },
      });
      expect(screen.queryByText('IRMAA Surcharge')).toBeNull();
   });

   it('shows surplus as reinvested', () => {
      render(WithdrawalPlan, {
         props: { years: [makeYear({ surplus: 5000 })] },
      });
      expect(screen.getByText(/Surplus/)).toBeTruthy();
      expect(screen.getByText(/Reinvested/)).toBeTruthy();
   });

   it('shows strategy label for fixed_dollar', () => {
      const yr = makeYear({ spending_target: 80000, planned_expense: 0 });
      render(WithdrawalPlan, {
         props: { years: [yr], spendingStrategy: 'fixed_dollar' },
      });
      expect(screen.getByText(/Fixed \$80,000/)).toBeInTheDocument();
   });

   it('shows strategy label for percent_of_portfolio with desired', () => {
      const yr = makeYear({
         spending_target: 80000,
         planned_expense: 0,
         total_balance: 2000000,
      });
      render(WithdrawalPlan, {
         props: {
            years: [yr],
            spendingStrategy: 'percent_of_portfolio',
            withdrawalRate: 0.04,
         },
      });
      expect(screen.getByText(/4%/)).toBeInTheDocument();
      expect(screen.getByText(/desired/)).toBeInTheDocument();
   });

   it('shows income tax breakdown when multiple tax types present', () => {
      const yr = makeYear({
         total_tax: 18000,
         income_tax: 12000,
         irmaa_cost: 2400,
         conversion_tax: 3600,
      });
      render(WithdrawalPlan, { props: { years: [yr] } });
      expect(screen.getByText('Income Tax')).toBeInTheDocument();
      expect(screen.getByText('IRMAA Surcharge')).toBeInTheDocument();
      expect(screen.getByText('Conversion Tax')).toBeInTheDocument();
   });

   it('shows italic placeholders for missing sources', () => {
      const yr = makeYear({ rmd: 0, total_income: 0, withdrawal_details: [] });
      render(WithdrawalPlan, { props: { years: [yr] } });
      expect(screen.getByText(/No RMD/)).toBeInTheDocument();
      expect(screen.getByText(/No Income/)).toBeInTheDocument();
   });

   it('includes tax withdrawals in Withdrawals total', () => {
      const yr = makeYear({
         withdrawal_details: [
            {
               account_id: 'brok',
               account_name: 'Brokerage',
               amount: 50000,
               purpose: 'spending',
            },
            {
               account_id: 'brok',
               account_name: 'Brokerage',
               amount: 8000,
               purpose: 'tax',
            },
         ],
      });
      render(WithdrawalPlan, { props: { years: [yr] } });
      // Total withdrawals = 50000 + 8000 = 58000 (header + merged detail line)
      expect(screen.getAllByText('$58,000').length).toBeGreaterThanOrEqual(1);
   });

   it('shows tax withdrawal accounts in Withdrawals section', () => {
      const yr = makeYear({
         withdrawal_details: [
            {
               account_id: 'roth1',
               account_name: 'Roth IRA',
               amount: 30000,
               purpose: 'spending',
            },
            {
               account_id: 'brok',
               account_name: 'Brokerage',
               amount: 5000,
               purpose: 'tax',
            },
         ],
      });
      render(WithdrawalPlan, { props: { years: [yr] } });
      expect(screen.getByText('Roth IRA')).toBeInTheDocument();
      expect(screen.getByText('Brokerage')).toBeInTheDocument();
   });

   it('shows planned expenses when present', () => {
      const p = structuredClone(samplePortfolio);
      p.config.planned_expenses = [
         {
            name: 'Kitchen',
            amount: 25000,
            expense_type: 'one_time',
            year: 2026,
            inflation_adjusted: false,
         },
      ];
      portfolio.value = p;
      const yr = makeYear({ planned_expense: 25000, spending_target: 105000 });
      render(WithdrawalPlan, { props: { years: [yr] } });
      expect(screen.getByText('Planned Expenses')).toBeInTheDocument();
      expect(screen.getByText('Kitchen')).toBeInTheDocument();
   });

   it('shows capital gains tax when present', () => {
      const yr = makeYear({
         total_tax: 15000,
         income_tax: 12000,
         brokerage_gains_tax: 3000,
      });
      render(WithdrawalPlan, { props: { years: [yr] } });
      expect(screen.getByText('Capital Gains Tax')).toBeInTheDocument();
      expect(screen.getByText('$3,000')).toBeInTheDocument();
   });

   it('hides capital gains tax when zero', () => {
      render(WithdrawalPlan, {
         props: { years: [makeYear({ brokerage_gains_tax: 0 })] },
      });
      expect(screen.queryByText('Capital Gains Tax')).toBeNull();
   });

   it('shows income tax sub-item when capital gains tax is present', () => {
      const yr = makeYear({
         total_tax: 15000,
         income_tax: 12000,
         brokerage_gains_tax: 3000,
      });
      render(WithdrawalPlan, { props: { years: [yr] } });
      expect(screen.getByText('Income Tax')).toBeInTheDocument();
   });

   it('shows pretax 401k deposit when present', () => {
      const yr = makeYear({ pretax_401k_deposit: 23000 });
      render(WithdrawalPlan, { props: { years: [yr] } });
      expect(screen.getByText('Emp. 401k Deposit')).toBeInTheDocument();
      expect(screen.getByText('$23,000')).toBeInTheDocument();
   });

   it('hides pretax 401k deposit when zero', () => {
      render(WithdrawalPlan, {
         props: { years: [makeYear({ pretax_401k_deposit: 0 })] },
      });
      expect(screen.queryByText('Emp. 401k Deposit')).toBeNull();
   });

   it('shows roth 401k deposit when present', () => {
      const yr = makeYear({ roth_401k_deposit: 10000 });
      render(WithdrawalPlan, { props: { years: [yr] } });
      expect(screen.getByText('Emp. Roth 401k Deposit')).toBeInTheDocument();
      expect(screen.getByText('$10,000')).toBeInTheDocument();
   });

   it('hides roth 401k deposit when zero', () => {
      render(WithdrawalPlan, {
         props: { years: [makeYear({ roth_401k_deposit: 0 })] },
      });
      expect(screen.queryByText('Emp. Roth 401k Deposit')).toBeNull();
   });

   it('shows spending limited warning when spending_limited is true', () => {
      const yr = makeYear({ spending_limited: true });
      render(WithdrawalPlan, { props: { years: [yr] } });
      expect(
         screen.getByText('(!) Spending limited to available income'),
      ).toBeInTheDocument();
   });

   it('hides spending limited warning when spending_limited is false', () => {
      render(WithdrawalPlan, {
         props: { years: [makeYear({ spending_limited: false })] },
      });
      expect(
         screen.queryByText('(!) Spending limited to available income'),
      ).toBeNull();
   });
});
