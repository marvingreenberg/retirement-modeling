import { describe, it, expect } from 'vitest';
import { generateTextReport } from './textReport';
import type { SimulationResponse, YearResult } from './types';

function makeYear(overrides: Partial<YearResult> = {}): YearResult {
   return {
      year: 2026,
      age_primary: 65,
      age_spouse: 62,
      agi: 80000,
      bracket: '22%',
      rmd: 0,
      surplus: 0,
      roth_conversion: 10000,
      conversion_tax: 2200,
      conversion_tax_from_brokerage: 0,
      pretax_withdrawal: 50000,
      roth_withdrawal: 20000,
      brokerage_withdrawal: 30000,
      total_tax: 15000,
      irmaa_cost: 0,
      total_balance: 485000,
      spending_target: 100000,
      planned_expense: 0,
      total_income: 36000,
      income_tax: 12800,
      pretax_balance: 350000,
      roth_balance: 80000,
      roth_conversion_balance: 0,
      brokerage_balance: 55000,
      withdrawal_details: [],
      income_details: [],
      ...overrides,
   };
}

function makeSim(years: YearResult[]): SimulationResponse {
   return {
      result: {
         strategy: 'standard',
         spending_strategy: 'fixed_dollar',
         years,
      },
      summary: {
         final_balance: years[years.length - 1]?.total_balance ?? 0,
         total_taxes_paid: 15000,
         total_irmaa_paid: 0,
         total_roth_conversions: 10000,
         simulation_years: years.length,
         strategy: 'standard',
         spending_strategy: 'fixed_dollar',
      },
   };
}

describe('generateTextReport', () => {
   it('includes header, summary, withdrawal plan, and year-by-year table', () => {
      const report = generateTextReport(makeSim([makeYear()]));
      expect(report).toContain('Retirement Simulation Report');
      expect(report).toContain('SUMMARY');
      expect(report).toContain('WITHDRAWAL PLAN');
      expect(report).toContain('YEAR-BY-YEAR DETAIL');
      expect(report).toContain('2026');
      expect(report).toContain('$485,000');
   });

   it('shows withdrawal details in plan section', () => {
      const yr = makeYear({
         rmd: 25000,
         withdrawal_details: [
            {
               account_id: 'a1',
               account_name: '401(k)',
               amount: 25000,
               purpose: 'rmd',
            },
            {
               account_id: 'a2',
               account_name: 'Brokerage',
               amount: 30000,
               purpose: 'spending',
            },
         ],
      });
      const report = generateTextReport(makeSim([yr]));
      expect(report).toContain('RMD: $25,000');
      expect(report).toContain('401(k): $25,000');
      expect(report).toContain('Withdrawals: $30,000');
      expect(report).toContain('Brokerage: $30,000');
   });

   it('shows surplus when present', () => {
      const report = generateTextReport(makeSim([makeYear({ surplus: 5000 })]));
      expect(report).toContain('Income Surplus: $5,000');
   });

   it('shows IRMAA and conversion tax in plan section', () => {
      const report = generateTextReport(
         makeSim([makeYear({ irmaa_cost: 1200, conversion_tax: 2200 })]),
      );
      expect(report).toContain('IRMAA Surcharge: $1,200');
      expect(report).toContain('Conversion Tax: $2,200');
   });

   it('truncates at depletion', () => {
      const years = [
         makeYear({ year: 2026, total_balance: 100000 }),
         makeYear({ year: 2027, total_balance: 0 }),
         makeYear({ year: 2028, total_balance: 0 }),
      ];
      const report = generateTextReport(makeSim(years));
      expect(report).toContain('2027');
      expect(report).not.toContain('2028');
      expect(report).toContain('Portfolio depleted');
   });

   it('includes all year-by-year columns', () => {
      const report = generateTextReport(makeSim([makeYear()]));
      const lines = report.split('\n');
      const headerLine = lines.find(
         (l) => l.includes('Year') && l.includes('AGI'),
      );
      expect(headerLine).toBeDefined();
      expect(headerLine).toContain('Brkt');
      expect(headerLine).toContain('RMD');
      expect(headerLine).toContain('Total Balance');
   });

   it('summary shows strategy and final balance', () => {
      const report = generateTextReport(
         makeSim([makeYear({ total_balance: 1234567 })]),
      );
      expect(report).toContain('Strategy: standard / fixed_dollar');
      expect(report).toContain('Final Balance: $1,234,567');
   });

   it('handles guardrails initial spend', () => {
      const sim = makeSim([makeYear()]);
      sim.summary.initial_annual_spend = 95000;
      const report = generateTextReport(sim);
      expect(report).toContain('Initial Annual Spend: $95,000');
   });

   it('shows income details breakdown in plan section', () => {
      const yr = makeYear({
         total_income: 55200,
         income_details: [
            { name: 'Social Security (primary)', amount: 48000 },
            { name: 'LMC', amount: 7200 },
         ],
      });
      const report = generateTextReport(makeSim([yr]));
      expect(report).toContain('Income: $55,200');
      expect(report).toContain('Social Security (primary): $48,000');
      expect(report).toContain('LMC: $7,200');
   });

   it('omits income section when no income details', () => {
      const report = generateTextReport(
         makeSim([makeYear({ total_income: 0, income_details: [] })]),
      );
      expect(report).not.toMatch(/^\s*Income:/m);
   });
});
