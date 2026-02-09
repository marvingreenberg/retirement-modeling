import { describe, it, expect } from 'vitest';
import { samplePortfolio, defaultPortfolio } from './stores';
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
});
