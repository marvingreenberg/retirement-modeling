import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { simulationResults } from '$lib/stores';
import type { SimulationResponse, MonteCarloResponse } from '$lib/types';

const { default: DetailsPage } = await import('./+page.svelte');

const mockSingleResult: SimulationResponse = {
	result: {
		strategy: 'standard',
		spending_strategy: 'fixed_dollar',
		years: [{
			year: 2026, age_primary: 65, age_spouse: 62, agi: 80000, bracket: '22%',
			rmd: 0, surplus: 0, roth_conversion: 10000, conversion_tax: 2200,
			pretax_withdrawal: 50000, roth_withdrawal: 20000, brokerage_withdrawal: 30000,
			total_tax: 15000, irmaa_cost: 0, total_balance: 485000, spending_target: 100000,
			pretax_balance: 350000, roth_balance: 80000, brokerage_balance: 55000,
		}],
	},
	summary: {
		final_balance: 485000, total_taxes_paid: 15000, total_irmaa_paid: 0,
		total_roth_conversions: 10000, simulation_years: 1,
		strategy: 'standard', spending_strategy: 'fixed_dollar',
	},
};

const mockMCResult: MonteCarloResponse = {
	num_simulations: 1000, success_rate: 0.92, failure_rate: 0.08,
	median_final_balance: 520000, percentile_5: 100000, percentile_25: 300000,
	percentile_75: 750000, percentile_95: 1200000,
	depletion_ages: [],
	yearly_percentiles: [
		{ age: 65, percentile_5: 90000, percentile_25: 280000, median: 500000, percentile_75: 720000, percentile_95: 1100000 },
	],
};

describe('Details page', () => {
	beforeEach(() => {
		simulationResults.set({ singleResult: null, mcResult: null, lastRunMode: null });
	});

	it('shows empty state when no results', () => {
		render(DetailsPage);
		expect(screen.getByText('Run a simulation to see detailed results.')).toBeInTheDocument();
	});

	it('shows year-by-year table for single run results', () => {
		simulationResults.set({ singleResult: mockSingleResult, mcResult: null, lastRunMode: 'single' });
		render(DetailsPage);
		expect(screen.getByText('Year-by-Year Detail')).toBeInTheDocument();
		expect(screen.getByText('2026')).toBeInTheDocument();
		expect(screen.getByText('65')).toBeInTheDocument();
		expect(screen.getByText('22%')).toBeInTheDocument();
	});

	it('shows Monte Carlo percentile table', () => {
		simulationResults.set({ singleResult: null, mcResult: mockMCResult, lastRunMode: 'monte_carlo' });
		render(DetailsPage);
		expect(screen.getByText('Yearly Balance Percentiles')).toBeInTheDocument();
		expect(screen.getByText('5th')).toBeInTheDocument();
		expect(screen.getByText('Median')).toBeInTheDocument();
		expect(screen.getByText('95th')).toBeInTheDocument();
	});

	it('shows heading on all states', () => {
		render(DetailsPage);
		expect(screen.getByText('Detailed Results')).toBeInTheDocument();
	});
});
