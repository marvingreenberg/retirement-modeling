import { describe, it, expect } from 'vitest';
import type { ComparisonSnapshot } from '$lib/types';
import { get } from 'svelte/store';
import { comparisonSnapshots, defaultPortfolio } from '$lib/stores';

describe('Portfolio defaults', () => {
	it('default portfolio config still has simulation params for API compatibility', () => {
		const config = defaultPortfolio.config;
		expect(config.inflation_rate).toBeDefined();
		expect(config.investment_growth_rate).toBeDefined();
		expect(config.spending_strategy).toBeDefined();
		expect(config.strategy_target).toBeDefined();
		expect(config.tax_rate_state).toBeDefined();
		expect(config.tax_rate_capital_gains).toBeDefined();
	});

	it('default portfolio has planned_expenses as array', () => {
		expect(Array.isArray(defaultPortfolio.config.planned_expenses)).toBe(true);
	});
});

describe('Snapshot name generation', () => {
	function generateSnapshotName(config: typeof defaultPortfolio.config): string {
		const spendingLabels: Record<string, string> = {
			fixed_dollar: 'Fixed Dollar',
			percent_of_portfolio: '% of Portfolio',
			guardrails: 'Guardrails',
			rmd_based: 'RMD-Based',
		};
		const conversionLabels: Record<string, string> = {
			standard: 'Standard',
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
		const name = generateSnapshotName(defaultPortfolio.config);
		expect(name).toBe('3.0% infl, 6.0% growth, Fixed Dollar, IRMAA Tier 1');
	});

	it('reflects changed parameters', () => {
		const config = { ...defaultPortfolio.config, inflation_rate: 0.04, strategy_target: 'standard' as const };
		const name = generateSnapshotName(config);
		expect(name).toContain('4.0% infl');
		expect(name).toContain('Standard');
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
			taxRateCapitalGains: 0.15,
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

	it('can update snapshot name', () => {
		const snap: ComparisonSnapshot = {
			id: 'test-2',
			name: 'Original',
			runType: 'monte_carlo',
			numSimulations: 1000,
			inflationRate: 0.03,
			growthRate: 0.07,
			spendingStrategy: 'RMD-Based',
			conversionStrategy: '22% Bracket',
			taxRateState: 0.05,
			taxRateCapitalGains: 0.15,
			finalBalance: 3000000,
			totalTaxes: 0,
			totalIrmaa: 0,
			totalRothConversions: 0,
			successRate: 0.92,
		};

		comparisonSnapshots.set([snap]);
		comparisonSnapshots.update((s) =>
			s.map((x) => (x.id === 'test-2' ? { ...x, name: 'Renamed' } : x))
		);
		expect(get(comparisonSnapshots)[0].name).toBe('Renamed');

		// cleanup
		comparisonSnapshots.set([]);
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
			conversionStrategy: 'Standard',
			taxRateState: 0.05,
			taxRateCapitalGains: 0.15,
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
