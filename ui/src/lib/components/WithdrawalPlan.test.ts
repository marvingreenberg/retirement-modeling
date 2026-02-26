import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import WithdrawalPlan from './WithdrawalPlan.svelte';
import type { YearResult } from '$lib/types';

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
      withdrawal_details: [],
      income_details: [],
      ...overrides,
   };
}

describe('WithdrawalPlan', () => {
   it('renders heading', () => {
      render(WithdrawalPlan, { props: { years: [makeYear()] } });
      expect(screen.getByText('Withdrawal Plan')).toBeTruthy();
   });

   it('shows year and age', () => {
      render(WithdrawalPlan, {
         props: { years: [makeYear({ year: 2027, age_primary: 66 })] },
      });
      expect(screen.getByText(/2027/)).toBeTruthy();
      expect(screen.getByText(/Age 66/)).toBeTruthy();
   });

   it('shows spending target', () => {
      render(WithdrawalPlan, {
         props: { years: [makeYear({ spending_target: 100000 })] },
      });
      expect(screen.getByText('$100,000')).toBeTruthy();
   });

   it('shows two year cards when two years provided', () => {
      const years = [
         makeYear({ year: 2026, age_primary: 65 }),
         makeYear({ year: 2027, age_primary: 66 }),
      ];
      render(WithdrawalPlan, { props: { years } });
      expect(screen.getByText(/2026/)).toBeTruthy();
      expect(screen.getByText(/2027/)).toBeTruthy();
   });

   it('limits to two year cards even with more years', () => {
      const years = [
         makeYear({ year: 2026 }),
         makeYear({ year: 2027 }),
         makeYear({ year: 2028 }),
      ];
      render(WithdrawalPlan, { props: { years } });
      expect(screen.queryByText(/2028/)).toBeNull();
   });

   it('shows RMD section with per-account details', () => {
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
      expect(screen.getByText('Primary IRA')).toBeTruthy();
      // $20,000 appears in both the RMD total and the per-account row
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

   it('shows taxes section', () => {
      render(WithdrawalPlan, {
         props: { years: [makeYear({ total_tax: 15000 })] },
      });
      expect(screen.getByText('Taxes')).toBeTruthy();
      expect(screen.getByText('$15,000')).toBeTruthy();
   });

   it('shows IRMAA when present', () => {
      render(WithdrawalPlan, {
         props: { years: [makeYear({ irmaa_cost: 2400 })] },
      });
      expect(screen.getByText('IRMAA Surcharge')).toBeTruthy();
   });

   it('hides IRMAA when zero', () => {
      render(WithdrawalPlan, {
         props: { years: [makeYear({ irmaa_cost: 0 })] },
      });
      expect(screen.queryByText('IRMAA Surcharge')).toBeNull();
   });

   it('shows surplus when income exceeds spending', () => {
      render(WithdrawalPlan, {
         props: { years: [makeYear({ surplus: 5000 })] },
      });
      expect(screen.getByText('Income Surplus')).toBeTruthy();
   });
});
