import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { portfolio, validationErrors, comparisonSnapshots } from '$lib/stores';
import { defaultPortfolio } from '$lib/stores';
import type { SimulationResponse, MonteCarloResponse } from '$lib/types';

vi.mock('$lib/components/charts/BalanceChart.svelte', () => import('$lib/test-helpers/MockChart.svelte'));
vi.mock('$lib/components/charts/FanChart.svelte', () => import('$lib/test-helpers/MockChart.svelte'));

import SimulateView from './SimulateView.svelte';

const mockSingleResult: SimulationResponse = {
	result: {
		strategy: 'irmaa_tier_1',
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
		strategy: 'irmaa_tier_1', spending_strategy: 'fixed_dollar',
	},
};

const mockMCResult: MonteCarloResponse = {
	num_simulations: 1000, success_rate: 0.92, failure_rate: 0.08,
	median_final_balance: 520000, percentile_5: 100000, percentile_25: 300000,
	percentile_75: 750000, percentile_95: 1200000,
	depletion_ages: [], yearly_percentiles: [],
};

describe('SimulateView (results-only)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		portfolio.set(structuredClone(defaultPortfolio));
		validationErrors.set({});
		comparisonSnapshots.set([]);
	});

	it('renders nothing when no results and no error', () => {
		render(SimulateView, {
			singleResult: null, mcResult: null, lastRunMode: null, error: '',
		});
		expect(screen.queryByText('Summary')).not.toBeInTheDocument();
		expect(screen.queryByText('Success Rate')).not.toBeInTheDocument();
	});

	it('shows error message when error prop is set', () => {
		render(SimulateView, {
			singleResult: null, mcResult: null, lastRunMode: null, error: 'Server error',
		});
		expect(screen.getByText('Server error')).toBeInTheDocument();
	});

	it('shows summary for single run results', () => {
		render(SimulateView, {
			singleResult: mockSingleResult, mcResult: null, lastRunMode: 'single', error: '',
		});
		expect(screen.getByText('Final Balance')).toBeInTheDocument();
		expect(screen.getByText('Total Taxes')).toBeInTheDocument();
		expect(screen.getByText('Total IRMAA')).toBeInTheDocument();
		expect(screen.getByText('Roth Conversions')).toBeInTheDocument();
	});

	it('shows Add to Comparison button for single results', () => {
		render(SimulateView, {
			singleResult: mockSingleResult, mcResult: null, lastRunMode: 'single', error: '',
		});
		expect(screen.getByRole('button', { name: /add to comparison/i })).toBeInTheDocument();
	});

	it('shows success rate for monte carlo results', () => {
		render(SimulateView, {
			singleResult: null, mcResult: mockMCResult, lastRunMode: 'monte_carlo', error: '',
		});
		expect(screen.getByText(/92\.0% Success Rate/)).toBeInTheDocument();
	});

	it('shows final balance percentiles for monte carlo results', () => {
		render(SimulateView, {
			singleResult: null, mcResult: mockMCResult, lastRunMode: 'monte_carlo', error: '',
		});
		expect(screen.getByText('5th')).toBeInTheDocument();
		expect(screen.getByText('Median')).toBeInTheDocument();
		expect(screen.getByText('95th')).toBeInTheDocument();
	});

	it('shows depletion info when depletion ages exist', () => {
		const mcWithDepletion = { ...mockMCResult, depletion_ages: [78, 82, 85] };
		render(SimulateView, {
			singleResult: null, mcResult: mcWithDepletion, lastRunMode: 'monte_carlo', error: '',
		});
		expect(screen.getByText('Age 78')).toBeInTheDocument();
		expect(screen.getByText('Age 85')).toBeInTheDocument();
	});

	it('shows no depletion message when depletion ages are empty', () => {
		render(SimulateView, {
			singleResult: null, mcResult: mockMCResult, lastRunMode: 'monte_carlo', error: '',
		});
		expect(screen.getByText(/no simulations resulted in portfolio depletion/i)).toBeInTheDocument();
	});
});
