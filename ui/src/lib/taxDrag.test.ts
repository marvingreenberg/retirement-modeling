import { describe, it, expect } from 'vitest';
import {
   estimateTaxDrag,
   computeEffectiveGrowth,
   recommendWithdrawalOrder,
   STOCK_TAX_DRAG,
   BOND_TAX_DRAG,
} from './taxDrag';
import type { Account, ConversionStrategy } from './types';

describe('estimateTaxDrag', () => {
   it('returns stock drag for 100% stocks', () => {
      expect(estimateTaxDrag(100)).toBeCloseTo(STOCK_TAX_DRAG, 6);
   });

   it('returns bond drag for 0% stocks', () => {
      expect(estimateTaxDrag(0)).toBeCloseTo(BOND_TAX_DRAG, 6);
   });

   it('blends 60/40 correctly', () => {
      const expected = 0.6 * STOCK_TAX_DRAG + 0.4 * BOND_TAX_DRAG;
      expect(estimateTaxDrag(60)).toBeCloseTo(expected, 6);
   });

   it('blends 50/50 correctly', () => {
      const expected = 0.5 * STOCK_TAX_DRAG + 0.5 * BOND_TAX_DRAG;
      expect(estimateTaxDrag(50)).toBeCloseTo(expected, 6);
   });
});

describe('computeEffectiveGrowth', () => {
   it('computes rate for 60/40 non-brokerage', () => {
      expect(computeEffectiveGrowth(60, false)).toBeCloseTo(0.076, 4);
   });

   it('computes rate for 80/20 non-brokerage', () => {
      expect(computeEffectiveGrowth(80, false)).toBeCloseTo(0.088, 4);
   });

   it('subtracts drag for brokerage', () => {
      const rate = computeEffectiveGrowth(60, true);
      expect(rate).toBeLessThan(0.076);
      expect(rate).toBeGreaterThan(0.06);
   });

   it('uses tax drag override when provided', () => {
      expect(computeEffectiveGrowth(60, true, 0.01)).toBeCloseTo(0.066, 4);
   });

   it('100% stocks gives equity return', () => {
      expect(computeEffectiveGrowth(100, false)).toBeCloseTo(0.1, 4);
   });

   it('0% stocks gives bond return', () => {
      expect(computeEffectiveGrowth(0, false)).toBeCloseTo(0.04, 4);
   });
});

describe('recommendWithdrawalOrder', () => {
   const makeAccount = (
      overrides: Partial<Account> & { id: string },
   ): Account => ({
      name: 'Test',
      balance: 100000,
      type: 'brokerage',
      owner: 'primary',
      ...overrides,
   });

   it('returns minimal-impact order when no brokerage accounts', () => {
      const accounts = [makeAccount({ id: 'ira', type: 'ira' })];
      const result = recommendWithdrawalOrder(accounts, 'standard');
      expect(result.reason).toContain('No brokerage');
   });

   it('recommends brokerage-first when conversions active', () => {
      const accounts = [
         makeAccount({ id: 'brk', stock_pct: 60 }),
         makeAccount({ id: 'ira', type: 'ira' }),
      ];
      const result = recommendWithdrawalOrder(accounts, 'irmaa_tier_1');
      expect(result.recommended).toEqual([
         'cash',
         'brokerage',
         'pretax',
         'roth',
      ]);
      expect(result.reason).toContain('Roth conversions');
   });

   it('recommends brokerage-first for high drag (bond-heavy)', () => {
      const accounts = [makeAccount({ id: 'brk', stock_pct: 0 })];
      const result = recommendWithdrawalOrder(accounts, 'standard');
      expect(result.recommended[1]).toBe('brokerage');
      expect(result.reason).toContain('High tax drag');
   });

   it('recommends IRA-first for low drag (stock-heavy)', () => {
      const accounts = [makeAccount({ id: 'brk', stock_pct: 100 })];
      const result = recommendWithdrawalOrder(accounts, 'standard');
      expect(result.recommended[1]).toBe('pretax');
      expect(result.reason).toContain('Low tax drag');
   });

   it('handles zero-balance brokerage accounts', () => {
      const accounts = [makeAccount({ id: 'brk', balance: 0 })];
      const result = recommendWithdrawalOrder(accounts, 'standard');
      expect(result.reason).toContain('no balance');
   });

   it('uses balance-weighted average for multiple brokerage accounts', () => {
      const accounts = [
         makeAccount({ id: 'b1', balance: 300000, stock_pct: 100 }),
         makeAccount({ id: 'b2', balance: 100000, stock_pct: 0 }),
      ];
      // Weighted: (300k*100 + 100k*0) / 400k = 75% stocks → drag ~0.0042
      // Between 0.3% and 0.5% → moderate drag → brokerage-first
      const result = recommendWithdrawalOrder(accounts, 'standard');
      expect(result.recommended[1]).toBe('brokerage');
      expect(result.reason).toContain('Moderate tax drag');
   });

   it('uses default stock_pct when not specified', () => {
      const accounts = [makeAccount({ id: 'brk' })]; // no stock_pct, default=60
      const result = recommendWithdrawalOrder(
         accounts,
         'standard' as ConversionStrategy,
      );
      // 60% stock drag ~0.0053 → high drag → brokerage-first
      expect(result.recommended[1]).toBe('brokerage');
   });

   it('uses tax_drag_override when set on brokerage account', () => {
      const accounts = [makeAccount({ id: 'brk', tax_drag_override: 0.001 })];
      // Override of 0.1% is low drag → should recommend IRA-first
      const result = recommendWithdrawalOrder(accounts, 'standard');
      expect(result.recommended[1]).toBe('pretax');
      expect(result.reason).toContain('Low tax drag');
   });

   it('prefers tax_drag_override over stock_pct for drag calculation', () => {
      const accounts = [
         makeAccount({ id: 'brk', stock_pct: 0, tax_drag_override: 0.001 }),
      ];
      // stock_pct=0 would give high drag (1%), but override says 0.1% → low drag
      const result = recommendWithdrawalOrder(accounts, 'standard');
      expect(result.recommended[1]).toBe('pretax');
   });
});
