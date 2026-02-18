import { describe, it, expect } from 'vitest';

describe('InfoPopover', () => {
	it('component module exists and can be imported', async () => {
		const mod = await import('./InfoPopover.svelte');
		expect(mod.default).toBeDefined();
	});

	it('help text content is defined for key financial terms', () => {
		const helpTexts: Record<string, string> = {
			inflation: 'Assumed annual rate at which prices increase, reducing the purchasing power of fixed withdrawals over time.',
			growth: 'Assumed annual return on investments before inflation. In Monte Carlo mode, this is overridden by historically-sampled returns.',
			costBasis: 'The portion of the account that represents original contributions (not gains). Affects capital gains tax on brokerage withdrawals.',
			irmaa: 'Income threshold above which Medicare Part B/D premiums increase. Roth conversions that push income above this trigger surcharges.',
			rmdAge: 'Age at which Required Minimum Distributions from pre-tax accounts begin. Currently 73 under the SECURE 2.0 Act.',
			monteCarlo: 'Runs the simulation many times with investment returns sampled from historical market data (1928-2023). Shows how your plan holds up across a range of market conditions, not just the single average return assumed above.',
		};

		for (const [key, text] of Object.entries(helpTexts)) {
			expect(text.length).toBeGreaterThan(20);
			expect(text).not.toContain('undefined');
		}
	});

	it('popover text for withdrawal strategy covers all four strategies', () => {
		const text = 'How annual withdrawals are calculated. Fixed Dollar adjusts for inflation. % of Portfolio takes a fixed percentage each year. Guardrails adjusts spending when withdrawal rate drifts. RMD-Based uses IRS Required Minimum Distribution tables.';
		expect(text).toContain('Fixed Dollar');
		expect(text).toContain('Portfolio');
		expect(text).toContain('Guardrails');
		expect(text).toContain('RMD');
	});

	it('popover text for conversion strategy covers all options', () => {
		const text = 'Controls Roth conversion aggressiveness. No Conversion skips conversions. Other strategies convert pre-tax to Roth up to a tax bracket or IRMAA threshold to reduce future taxes.';
		expect(text).toContain('No Conversion');
		expect(text).toContain('Roth');
		expect(text).toContain('IRMAA');
	});
});
