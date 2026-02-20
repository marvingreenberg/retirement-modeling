import { describe, it, expect } from 'vitest';
import {
   classifyHolding,
   summarizePortfolio,
   ASSET_CLASS_MAP,
} from './assetClassification';
import type { ParsedHolding } from './ofxParser';

function makeHolding(overrides: Partial<ParsedHolding> = {}): ParsedHolding {
   return {
      symbol: 'VTI',
      cusip: '922908363',
      name: 'VANGUARD TOTAL STOCK MKT ETF',
      quantity: 100,
      price: 250,
      market_value: 25000,
      security_type: 'Stock',
      ...overrides,
   };
}

describe('classifyHolding', () => {
   it('classifies known US equity ETF', () => {
      expect(classifyHolding(makeHolding({ symbol: 'VTI' }))).toBe('us_equity');
      expect(classifyHolding(makeHolding({ symbol: 'VOO' }))).toBe('us_equity');
      expect(classifyHolding(makeHolding({ symbol: 'SPY' }))).toBe('us_equity');
   });

   it('classifies known intl equity ETF', () => {
      expect(classifyHolding(makeHolding({ symbol: 'VXUS' }))).toBe(
         'intl_equity',
      );
      expect(classifyHolding(makeHolding({ symbol: 'VEA' }))).toBe(
         'intl_equity',
      );
   });

   it('classifies known bond ETF', () => {
      expect(classifyHolding(makeHolding({ symbol: 'BND' }))).toBe('us_bond');
      expect(classifyHolding(makeHolding({ symbol: 'AGG' }))).toBe('us_bond');
   });

   it('classifies known intl bond ETF', () => {
      expect(classifyHolding(makeHolding({ symbol: 'BNDX' }))).toBe(
         'intl_bond',
      );
   });

   it('classifies REIT ETF', () => {
      expect(classifyHolding(makeHolding({ symbol: 'VNQ' }))).toBe('reit');
   });

   it('classifies commodity ETF', () => {
      expect(classifyHolding(makeHolding({ symbol: 'GLD' }))).toBe('commodity');
   });

   it('classifies cash/money market', () => {
      expect(classifyHolding(makeHolding({ symbol: 'VMFXX' }))).toBe('cash');
   });

   it('defaults unknown stock to us_equity', () => {
      expect(
         classifyHolding(
            makeHolding({ symbol: 'ZZZZ', security_type: 'Stock' }),
         ),
      ).toBe('us_equity');
   });

   it('defaults unknown MF to other', () => {
      expect(
         classifyHolding(makeHolding({ symbol: 'UNKN', security_type: 'MF' })),
      ).toBe('other');
   });

   it('defaults null symbol stock to us_equity', () => {
      expect(
         classifyHolding(makeHolding({ symbol: null, security_type: 'Stock' })),
      ).toBe('us_equity');
   });

   it('has at least 40 tickers in ASSET_CLASS_MAP', () => {
      expect(Object.keys(ASSET_CLASS_MAP).length).toBeGreaterThanOrEqual(40);
   });
});

describe('summarizePortfolio', () => {
   it('computes correct total value', () => {
      const holdings = [
         makeHolding({ market_value: 60000 }),
         makeHolding({ symbol: 'BND', market_value: 40000 }),
      ];
      const summary = summarizePortfolio(holdings, 5000);
      expect(summary.totalValue).toBe(105000);
      expect(summary.cashBalance).toBe(5000);
   });

   it('computes allocation percentages that sum to ~1', () => {
      const holdings = [
         makeHolding({ symbol: 'VTI', market_value: 60000 }),
         makeHolding({ symbol: 'BND', market_value: 30000 }),
         makeHolding({ symbol: 'VXUS', market_value: 10000 }),
      ];
      const summary = summarizePortfolio(holdings, 0);
      const totalPct = summary.allocation.reduce((s, a) => s + a.percent, 0);
      expect(totalPct).toBeCloseTo(1.0, 5);
   });

   it('computes correct allocation for simple case', () => {
      const holdings = [
         makeHolding({ symbol: 'VTI', market_value: 70000 }),
         makeHolding({ symbol: 'BND', market_value: 30000 }),
      ];
      const summary = summarizePortfolio(holdings, 0);
      const usEquity = summary.allocation.find(
         (a) => a.assetClass === 'us_equity',
      );
      const usBond = summary.allocation.find((a) => a.assetClass === 'us_bond');
      expect(usEquity!.percent).toBeCloseTo(0.7);
      expect(usBond!.percent).toBeCloseTo(0.3);
   });

   it('includes cash in allocation', () => {
      const holdings = [makeHolding({ symbol: 'VTI', market_value: 9000 })];
      const summary = summarizePortfolio(holdings, 1000);
      const cash = summary.allocation.find((a) => a.assetClass === 'cash');
      expect(cash).toBeDefined();
      expect(cash!.percent).toBeCloseTo(0.1);
   });

   it('computes stock/bond percentages', () => {
      const holdings = [
         makeHolding({ symbol: 'VTI', market_value: 50000 }),
         makeHolding({ symbol: 'VXUS', market_value: 20000 }),
         makeHolding({ symbol: 'BND', market_value: 20000 }),
         makeHolding({ symbol: 'BNDX', market_value: 10000 }),
      ];
      const summary = summarizePortfolio(holdings, 0);
      expect(summary.stockPercent).toBeCloseTo(0.7);
      expect(summary.bondPercent).toBeCloseTo(0.3);
   });

   it('computes estimated return as weighted average', () => {
      const holdings = [
         makeHolding({ symbol: 'VTI', market_value: 50000 }),
         makeHolding({ symbol: 'BND', market_value: 50000 }),
      ];
      const summary = summarizePortfolio(holdings, 0);
      // 50% * 0.10 + 50% * 0.04 = 0.07
      expect(summary.estimatedReturn).toBeCloseTo(0.07);
   });

   it('sorts allocation by value descending', () => {
      const holdings = [
         makeHolding({ symbol: 'BND', market_value: 10000 }),
         makeHolding({ symbol: 'VTI', market_value: 50000 }),
         makeHolding({ symbol: 'VXUS', market_value: 30000 }),
      ];
      const summary = summarizePortfolio(holdings, 0);
      expect(summary.allocation[0].assetClass).toBe('us_equity');
      expect(summary.allocation[1].assetClass).toBe('intl_equity');
      expect(summary.allocation[2].assetClass).toBe('us_bond');
   });

   it('handles empty portfolio', () => {
      const summary = summarizePortfolio([], 0);
      expect(summary.totalValue).toBe(0);
      expect(summary.holdingsCount).toBe(0);
      expect(summary.allocation).toHaveLength(0);
      expect(summary.estimatedReturn).toBe(0);
   });

   it('handles cash-only portfolio', () => {
      const summary = summarizePortfolio([], 10000);
      expect(summary.totalValue).toBe(10000);
      expect(summary.allocation).toHaveLength(1);
      expect(summary.allocation[0].assetClass).toBe('cash');
      expect(summary.allocation[0].percent).toBeCloseTo(1.0);
   });

   it('tracks holdings count', () => {
      const holdings = [
         makeHolding({ symbol: 'VTI', market_value: 25000 }),
         makeHolding({ symbol: 'BND', market_value: 25000 }),
         makeHolding({ symbol: 'VXUS', market_value: 25000 }),
      ];
      const summary = summarizePortfolio(holdings, 0);
      expect(summary.holdingsCount).toBe(3);
   });
});
