import { describe, it, expect } from 'vitest';
import {
   estimateTaxDrag,
   computeEffectiveGrowth,
   STOCK_TAX_DRAG,
   BOND_TAX_DRAG,
} from './taxDrag';

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

