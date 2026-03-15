import { describe, it, expect } from 'vitest';
import { getVisibleColumns } from './columnVisibility';
import type { YearResult } from '$lib/types';

const baseYear = {
   pretax_401k_deposit: 0,
   roth_401k_deposit: 0,
   roth_conversion: 0,
   irmaa_cost: 0,
   total_income: 0,
   brokerage_withdrawal: 0,
   pretax_withdrawal: 0,
   roth_withdrawal: 0,
   brokerage_gains_tax: 0,
   conversion_tax: 0,
   rmd: 0,
};

describe('getVisibleColumns', () => {
   it('returns all false for empty years array', () => {
      const result = getVisibleColumns([]);
      expect(result).toEqual({
         dep401k: false,
         capGainsTax: false,
         convTax: false,
         rothConv: false,
         irmaa: false,
         income: false,
         brokerageWd: false,
         pretaxWd: false,
         rmd: false,
         rothWd: false,
      });
   });

   it('returns all false when all values are zero', () => {
      const years = [
         { ...baseYear },
         { ...baseYear },
      ] as unknown as YearResult[];
      const result = getVisibleColumns(years);
      expect(result).toEqual({
         dep401k: false,
         capGainsTax: false,
         convTax: false,
         rothConv: false,
         irmaa: false,
         income: false,
         brokerageWd: false,
         pretaxWd: false,
         rmd: false,
         rothWd: false,
      });
   });

   it('sets dep401k true when pretax_401k_deposit is non-zero in one year', () => {
      const years = [
         { ...baseYear, pretax_401k_deposit: 5000 },
         { ...baseYear },
      ] as unknown as YearResult[];
      const result = getVisibleColumns(years);
      expect(result.dep401k).toBe(true);
      expect(result.capGainsTax).toBe(false);
   });

   it('sets dep401k true when roth_401k_deposit is non-zero in one year', () => {
      const years = [
         { ...baseYear, roth_401k_deposit: 1000 },
      ] as unknown as YearResult[];
      expect(getVisibleColumns(years).dep401k).toBe(true);
   });

   it('sets capGainsTax true when brokerage_gains_tax is non-zero', () => {
      const years = [
         { ...baseYear, brokerage_gains_tax: 200 },
      ] as unknown as YearResult[];
      expect(getVisibleColumns(years).capGainsTax).toBe(true);
   });

   it('sets convTax true when conversion_tax is non-zero', () => {
      const years = [
         { ...baseYear, conversion_tax: 1500 },
      ] as unknown as YearResult[];
      expect(getVisibleColumns(years).convTax).toBe(true);
   });

   it('sets rothConv true when roth_conversion is non-zero', () => {
      const years = [
         { ...baseYear, roth_conversion: 3000 },
      ] as unknown as YearResult[];
      expect(getVisibleColumns(years).rothConv).toBe(true);
   });

   it('sets irmaa true when irmaa_cost is non-zero', () => {
      const years = [
         { ...baseYear, irmaa_cost: 800 },
      ] as unknown as YearResult[];
      expect(getVisibleColumns(years).irmaa).toBe(true);
   });

   it('sets income true when total_income is non-zero', () => {
      const years = [
         { ...baseYear, total_income: 70000 },
      ] as unknown as YearResult[];
      expect(getVisibleColumns(years).income).toBe(true);
   });

   it('sets brokerageWd true when brokerage_withdrawal is non-zero', () => {
      const years = [
         { ...baseYear, brokerage_withdrawal: 2500 },
      ] as unknown as YearResult[];
      expect(getVisibleColumns(years).brokerageWd).toBe(true);
   });

   it('sets pretaxWd true when pretax_withdrawal is non-zero', () => {
      const years = [
         { ...baseYear, pretax_withdrawal: 4000 },
      ] as unknown as YearResult[];
      expect(getVisibleColumns(years).pretaxWd).toBe(true);
   });

   it('sets rothWd true when roth_withdrawal is non-zero', () => {
      const years = [
         { ...baseYear, roth_withdrawal: 1200 },
      ] as unknown as YearResult[];
      expect(getVisibleColumns(years).rothWd).toBe(true);
   });

   it('handles values within threshold (<=0.5) as zero', () => {
      const years = [
         { ...baseYear, total_income: 0.4 },
      ] as unknown as YearResult[];
      expect(getVisibleColumns(years).income).toBe(false);
   });

   it('handles values just above threshold (>0.5) as non-zero', () => {
      const years = [
         { ...baseYear, total_income: 0.6 },
      ] as unknown as YearResult[];
      expect(getVisibleColumns(years).income).toBe(true);
   });

   it('mixed: some columns zero, some not', () => {
      const years = [
         { ...baseYear, pretax_401k_deposit: 5000, total_income: 80000 },
         { ...baseYear, roth_conversion: 10000 },
      ] as unknown as YearResult[];
      const result = getVisibleColumns(years);
      expect(result.dep401k).toBe(true);
      expect(result.income).toBe(true);
      expect(result.rothConv).toBe(true);
      expect(result.capGainsTax).toBe(false);
      expect(result.convTax).toBe(false);
      expect(result.irmaa).toBe(false);
      expect(result.brokerageWd).toBe(false);
      expect(result.pretaxWd).toBe(false);
      expect(result.rothWd).toBe(false);
   });

   it('picks up non-zero value in any year (not just first)', () => {
      const years = [
         { ...baseYear },
         { ...baseYear },
         { ...baseYear, pretax_withdrawal: 9000 },
      ] as unknown as YearResult[];
      expect(getVisibleColumns(years).pretaxWd).toBe(true);
   });
});
