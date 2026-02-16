import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { samplePortfolio, defaultPortfolio, simulationResults, numSimulations } from './stores';
import { portfolioSchema } from './schema';

describe('samplePortfolio', () => {
	it('passes Zod validation', () => {
		const result = portfolioSchema.safeParse(samplePortfolio);
		expect(result.success).toBe(true);
	});

	it('has multiple accounts with different types', () => {
		const types = new Set(samplePortfolio.accounts.map((a) => a.type));
		expect(types.size).toBeGreaterThanOrEqual(3);
		expect(types).toContain('pretax');
		expect(types).toContain('roth');
		expect(types).toContain('brokerage');
	});

	it('has two-person household (both ages set)', () => {
		expect(samplePortfolio.config.current_age_primary).toBeGreaterThan(0);
		expect(samplePortfolio.config.current_age_spouse).toBeGreaterThan(0);
	});

	it('has social security configured', () => {
		expect(samplePortfolio.config.social_security.primary_benefit).toBeGreaterThan(0);
		expect(samplePortfolio.config.social_security.spouse_benefit).toBeGreaterThan(0);
	});

	it('has planned expenses', () => {
		expect(samplePortfolio.config.planned_expenses.length).toBeGreaterThanOrEqual(1);
	});

	it('has ss_auto configured', () => {
		expect(samplePortfolio.config.ss_auto).not.toBeNull();
		expect(samplePortfolio.config.ss_auto!.primary_fra_amount).toBeGreaterThan(0);
	});

	it('has income streams', () => {
		expect(samplePortfolio.config.income_streams.length).toBeGreaterThanOrEqual(1);
	});
});

describe('defaultPortfolio', () => {
	it('starts with empty state (no accounts, age 0)', () => {
		expect(defaultPortfolio.accounts).toHaveLength(0);
		expect(defaultPortfolio.config.current_age_primary).toBe(0);
		expect(defaultPortfolio.config.annual_spend_net).toBe(0);
		expect(defaultPortfolio.config.social_security.primary_benefit).toBe(0);
	});

	it('has sensible defaults for simulation params', () => {
		expect(defaultPortfolio.config.inflation_rate).toBeDefined();
		expect(defaultPortfolio.config.investment_growth_rate).toBeDefined();
		expect(defaultPortfolio.config.spending_strategy).toBeDefined();
		expect(defaultPortfolio.config.strategy_target).toBeDefined();
	});

	it('has empty income streams and null ss_auto', () => {
		expect(defaultPortfolio.config.income_streams).toEqual([]);
		expect(defaultPortfolio.config.ss_auto).toBeNull();
	});
});

describe('simulationResults store', () => {
	it('starts with null results', () => {
		const state = get(simulationResults);
		expect(state.singleResult).toBeNull();
		expect(state.mcResult).toBeNull();
	});

	it('can store single run results', () => {
		const mockResult = {
			singleResult: { result: { strategy: 'standard' as const, spending_strategy: 'fixed_dollar' as const, years: [] }, summary: { final_balance: 100, total_taxes_paid: 10, total_irmaa_paid: 0, total_roth_conversions: 5, simulation_years: 1, strategy: 'standard', spending_strategy: 'fixed_dollar' } },
			mcResult: null,
		};
		simulationResults.set(mockResult);
		const state = get(simulationResults);
		expect(state.singleResult?.summary.final_balance).toBe(100);
		simulationResults.set({ singleResult: null, mcResult: null });
	});
});

describe('numSimulations store', () => {
	it('defaults to 1000', () => {
		expect(get(numSimulations)).toBe(1000);
	});
});
