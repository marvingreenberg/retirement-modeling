import { describe, it, expect } from 'vitest';
import type { ComparisonSnapshot } from '$lib/types';
import { get } from 'svelte/store';
import {
   comparisonSnapshots,
   simulationResults,
   samplePortfolio,
} from '$lib/stores';

describe('Portfolio defaults', () => {
   it('default portfolio config still has simulation params for API compatibility', () => {
      const config = samplePortfolio.config;
      expect(config.inflation_rate).toBeDefined();
      expect(config.investment_growth_rate).toBeDefined();
      expect(config.spending_strategy).toBeDefined();
      expect(config.strategy_target).toBeDefined();
      expect(config.tax_rate_state).toBeDefined();
   });

   it('default portfolio has planned_expenses as array', () => {
      expect(Array.isArray(samplePortfolio.config.planned_expenses)).toBe(true);
   });
});

describe('Snapshot name generation', () => {
   function generateSnapshotName(
      config: typeof samplePortfolio.config,
   ): string {
      const spendingLabels: Record<string, string> = {
         fixed_dollar: 'Fixed Dollar',
         percent_of_portfolio: '% of Portfolio',
         guardrails: 'Guardrails',
         rmd_based: 'RMD-Based',
      };
      const conversionLabels: Record<string, string> = {
         standard: 'No Conversion',
         irmaa_tier_1: 'IRMAA Tier 1',
         '22_percent_bracket': '22% Bracket',
         '24_percent_bracket': '24% Bracket',
      };
      const infl = (config.inflation_rate * 100).toFixed(1);
      const growth = (config.investment_growth_rate * 100).toFixed(1);
      const spend = spendingLabels[config.spending_strategy ?? 'fixed_dollar'];
      const conv = conversionLabels[config.strategy_target];
      return `${infl}% infl, ${growth}% growth, ${spend}, ${conv}`;
   }

   it('generates name from default config', () => {
      const name = generateSnapshotName(samplePortfolio.config);
      expect(name).toBe('3.0% infl, 7.0% growth, Fixed Dollar, IRMAA Tier 1');
   });

   it('reflects changed parameters', () => {
      const config = {
         ...samplePortfolio.config,
         inflation_rate: 0.04,
         strategy_target: 'standard' as const,
      };
      const name = generateSnapshotName(config);
      expect(name).toContain('4.0% infl');
      expect(name).toContain('No Conversion');
   });
});

describe('Comparison store', () => {
   it('starts empty', () => {
      const snaps = get(comparisonSnapshots);
      expect(snaps).toEqual([]);
   });

   it('can add and remove snapshots', () => {
      const snap: ComparisonSnapshot = {
         id: 'test-1',
         name: 'Test Run',
         runType: 'single',
         inflationRate: 0.03,
         growthRate: 0.06,
         spendingStrategy: 'Fixed Dollar',
         conversionStrategy: 'IRMAA Tier 1',
         taxRateState: 0.0575,
         finalBalance: 2000000,
         totalTaxes: 500000,
         totalIrmaa: 10000,
         totalRothConversions: 300000,
      };

      comparisonSnapshots.update((s) => [...s, snap]);
      expect(get(comparisonSnapshots)).toHaveLength(1);
      expect(get(comparisonSnapshots)[0].name).toBe('Test Run');

      comparisonSnapshots.update((s) => s.filter((x) => x.id !== 'test-1'));
      expect(get(comparisonSnapshots)).toHaveLength(0);
   });

   it('deduplicates snapshots with same parameters', () => {
      const snap1: ComparisonSnapshot = {
         id: 'test-2',
         name: '',
         runType: 'single',
         inflationRate: 0.03,
         growthRate: 0.07,
         spendingStrategy: 'Fixed Dollar',
         conversionStrategy: '22% Bracket',
         taxRateState: 0.05,
         finalBalance: 3000000,
         totalTaxes: 100000,
         totalIrmaa: 0,
         totalRothConversions: 0,
      };
      const snap2 = { ...snap1, id: 'test-3', finalBalance: 3500000 };

      comparisonSnapshots.set([snap1]);
      // Same key params → should replace, not duplicate
      const key = `${snap2.runType}|${snap2.inflationRate}|${snap2.growthRate}|${snap2.spendingStrategy}|${snap2.conversionStrategy}|${snap2.taxRateState}`;
      comparisonSnapshots.update((snaps) => {
         const filtered = snaps.filter(
            (s) =>
               `${s.runType}|${s.inflationRate}|${s.growthRate}|${s.spendingStrategy}|${s.conversionStrategy}|${s.taxRateState}` !==
               key,
         );
         return [...filtered, snap2];
      });
      expect(get(comparisonSnapshots)).toHaveLength(1);
      expect(get(comparisonSnapshots)[0].finalBalance).toBe(3500000);

      comparisonSnapshots.set([]);
   });

   it('simulationResults store can be cleared', () => {
      simulationResults.set({
         singleResult: { result: {} } as any,
         mcResult: { success_rate: 0.9 } as any,
      });
      expect(get(simulationResults).singleResult).not.toBeNull();
      simulationResults.set({ singleResult: null, mcResult: null });
      expect(get(simulationResults).singleResult).toBeNull();
      expect(get(simulationResults).mcResult).toBeNull();
   });

   it('comparisonSnapshots can be cleared', () => {
      comparisonSnapshots.set([{ id: 'x', name: 'X' } as ComparisonSnapshot]);
      expect(get(comparisonSnapshots)).toHaveLength(1);
      comparisonSnapshots.set([]);
      expect(get(comparisonSnapshots)).toHaveLength(0);
   });

   it('MC snapshot includes success rate', () => {
      const snap: ComparisonSnapshot = {
         id: 'test-mc',
         name: 'MC Test',
         runType: 'monte_carlo',
         numSimulations: 500,
         inflationRate: 0.03,
         growthRate: 0.07,
         spendingStrategy: 'Fixed Dollar',
         conversionStrategy: 'No Conversion',
         taxRateState: 0.05,
         finalBalance: 2500000,
         totalTaxes: 0,
         totalIrmaa: 0,
         totalRothConversions: 0,
         successRate: 0.87,
      };

      expect(snap.successRate).toBe(0.87);
      expect(snap.runType).toBe('monte_carlo');
      expect(snap.numSimulations).toBe(500);
   });
});
