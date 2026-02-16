import { describe, it, expect } from 'vitest';
import { validatePortfolio, getFieldError } from './validation';
import { samplePortfolio } from './stores';

describe('validatePortfolio', () => {
	it('returns empty errors for valid portfolio', () => {
		const errors = validatePortfolio(structuredClone(samplePortfolio));
		expect(Object.keys(errors)).toHaveLength(0);
	});

	it('returns errors for invalid age', () => {
		const p = structuredClone(samplePortfolio);
		p.config.current_age_primary = 150;
		const errors = validatePortfolio(p);
		expect(Object.keys(errors).length).toBeGreaterThan(0);
		expect(errors['config.current_age_primary']).toBeDefined();
	});

	it('accepts empty accounts (check deferred to simulation time)', () => {
		const p = structuredClone(samplePortfolio);
		p.accounts = [];
		const errors = validatePortfolio(p);
		expect(errors['accounts']).toBeUndefined();
	});

	it('returns errors for negative balance', () => {
		const p = structuredClone(samplePortfolio);
		p.accounts[0].balance = -100;
		const errors = validatePortfolio(p);
		expect(errors['accounts.0.balance']).toBeDefined();
	});
});

describe('getFieldError', () => {
	it('returns error for matching path', () => {
		const errors = { 'config.current_age_primary': 'Too high' };
		expect(getFieldError(errors, 'config.current_age_primary')).toBe('Too high');
	});

	it('returns undefined for non-matching path', () => {
		const errors = { 'config.current_age_primary': 'Too high' };
		expect(getFieldError(errors, 'config.current_age_spouse')).toBeUndefined();
	});
});
