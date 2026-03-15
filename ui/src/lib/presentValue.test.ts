import { describe, it, expect } from 'vitest';
import {
   pvDivisor,
   toPV,
   pvTotalTaxes,
   pvTotalIrmaa,
   pvSpendingRange,
} from './presentValue';
import type { YearResult } from '$lib/types';

function makeYear(overrides: Partial<YearResult> = {}): YearResult {
   return {
      year: 2026,
      age_primary: 65,
      age_spouse: 62,
      agi: 0,
      bracket: '',
      rmd: 0,
      surplus: 0,
      roth_conversion: 0,
      conversion_tax: 0,
      conversion_tax_from_brokerage: 0,
      pretax_withdrawal: 0,
      roth_withdrawal: 0,
      brokerage_withdrawal: 0,
      total_tax: 0,
      irmaa_cost: 0,
      total_balance: 0,
      spending_target: 0,
      planned_expense: 0,
      total_income: 0,
      income_tax: 0,
      pretax_balance: 0,
      roth_balance: 0,
      roth_conversion_balance: 0,
      brokerage_balance: 0,
      brokerage_gains_tax: 0,
      pretax_401k_deposit: 0,
      roth_401k_deposit: 0,
      spending_limited: false,
      withdrawal_details: [],
      income_details: [],
      ...overrides,
   };
}

describe('pvDivisor', () => {
   it('returns 1 at year 0', () => {
      expect(pvDivisor(0.03, 0)).toBe(1);
   });

   it('returns correct value at year 10 with 3%', () => {
      expect(pvDivisor(0.03, 10)).toBeCloseTo(1.03 ** 10);
   });
});

describe('toPV', () => {
   it('divides value by pvDivisor', () => {
      const value = 1000;
      const rate = 0.03;
      const year = 5;
      expect(toPV(value, rate, year)).toBeCloseTo(
         value / pvDivisor(rate, year),
      );
   });

   it('returns value unchanged at year 0', () => {
      expect(toPV(500, 0.03, 0)).toBe(500);
   });

   it('returns 0 for 0 value', () => {
      expect(toPV(0, 0.03, 10)).toBe(0);
   });
});

describe('pvTotalTaxes', () => {
   it('sums discounted total_tax across years', () => {
      const years = [
         makeYear({ total_tax: 10000 }),
         makeYear({ total_tax: 10000 }),
      ];
      const result = pvTotalTaxes(years, 0.03);
      expect(result).toBeCloseTo(10000 + 10000 / 1.03);
   });

   it('returns 0 for empty years', () => {
      expect(pvTotalTaxes([], 0.03)).toBe(0);
   });
});

describe('pvTotalIrmaa', () => {
   it('sums discounted irmaa_cost across years', () => {
      const years = [
         makeYear({ irmaa_cost: 5000 }),
         makeYear({ irmaa_cost: 5000 }),
      ];
      const result = pvTotalIrmaa(years, 0.03);
      expect(result).toBeCloseTo(5000 + 5000 / 1.03);
   });
});

describe('pvSpendingRange', () => {
   it('returns min/max of PV spending', () => {
      const years = [
         makeYear({ spending_target: 100000 }),
         makeYear({ spending_target: 103000 }),
      ];
      const result = pvSpendingRange(years, 0.03);
      expect(result).not.toBeNull();
      expect(result!.min).toBeCloseTo(100000);
      expect(result!.max).toBeCloseTo(100000);
   });

   it('returns null for empty years', () => {
      expect(pvSpendingRange([], 0.03)).toBeNull();
   });
});
