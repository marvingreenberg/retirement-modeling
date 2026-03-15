import { describe, it, expect } from 'vitest';
import { effectiveTaxRate, taxRateColor } from './effectiveTaxRate';

describe('effectiveTaxRate', () => {
   it('calculates rate correctly', () => {
      const yr = {
         income_tax: 10000,
         brokerage_gains_tax: 3000,
         conversion_tax: 2000,
         total_income: 50000,
         pretax_withdrawal: 30000,
         roth_withdrawal: 10000,
         brokerage_withdrawal: 10000,
         rmd: 0,
      };
      // totalTax = 15000, totalGross = 100000
      expect(effectiveTaxRate(yr)).toBeCloseTo(0.15);
   });

   it('returns 0 when no income or withdrawals', () => {
      const yr = {
         income_tax: 0,
         brokerage_gains_tax: 0,
         conversion_tax: 0,
         total_income: 0,
         pretax_withdrawal: 0,
         roth_withdrawal: 0,
         brokerage_withdrawal: 0,
         rmd: 0,
      };
      expect(effectiveTaxRate(yr)).toBe(0);
   });

   it('includes RMD in denominator', () => {
      const yr = {
         income_tax: 20000,
         brokerage_gains_tax: 0,
         conversion_tax: 0,
         total_income: 0,
         pretax_withdrawal: 0,
         roth_withdrawal: 0,
         brokerage_withdrawal: 0,
         rmd: 100000,
      };
      // 20000 / 100000 = 0.20
      expect(effectiveTaxRate(yr)).toBeCloseTo(0.2);
   });

   it('returns 0 for rate of exactly 0 (zero tax, nonzero income)', () => {
      const yr = {
         income_tax: 0,
         brokerage_gains_tax: 0,
         conversion_tax: 0,
         total_income: 50000,
         pretax_withdrawal: 0,
         roth_withdrawal: 0,
         brokerage_withdrawal: 0,
         rmd: 0,
      };
      expect(effectiveTaxRate(yr)).toBe(0);
   });
});

describe('taxRateColor', () => {
   it('returns green-ish for rate below 0.18', () => {
      const color = taxRateColor(0.15);
      // Should be rgb(34, 139, 34) — pure green
      expect(color).toBe('rgb(34, 139, 34)');
   });

   it('returns red-ish for rate above 0.23', () => {
      const color = taxRateColor(0.25);
      // Should be rgb(220, 38, 38) — pure red
      expect(color).toBe('rgb(220, 38, 38)');
   });

   it('returns an intermediate color for rate of 0.20', () => {
      const color = taxRateColor(0.2);
      // Should be some interpolated color — not pure green or red
      expect(color).not.toBe('rgb(34, 139, 34)');
      expect(color).not.toBe('rgb(220, 38, 38)');
      expect(color).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
   });

   it('returns green for rate of exactly 0', () => {
      const color = taxRateColor(0);
      expect(color).toBe('rgb(34, 139, 34)');
   });
});
