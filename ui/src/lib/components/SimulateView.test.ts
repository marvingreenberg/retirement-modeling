import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { portfolio, validationErrors, comparisonSnapshots } from '$lib/stores';
import { defaultPortfolio } from '$lib/stores';
import type { SimulationResponse, MonteCarloResponse } from '$lib/types';

vi.mock('$lib/api', () => ({
	runSimulation: vi.fn(),
	runMonteCarlo: vi.fn(),
}));

vi.mock('$lib/components/charts/BalanceChart.svelte', () => import('$lib/test-helpers/MockChart.svelte'));
vi.mock('$lib/components/charts/FanChart.svelte', () => import('$lib/test-helpers/MockChart.svelte'));

import SimulateView from './SimulateView.svelte';
import { runSimulation, runMonteCarlo } from '$lib/api';

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

describe('SimulateView', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		portfolio.set(structuredClone(defaultPortfolio));
		validationErrors.set({});
		comparisonSnapshots.set([]);
	});

	it('renders simulate button', () => {
		render(SimulateView);
		expect(screen.getByRole('button', { name: /simulate/i })).toBeInTheDocument();
	});

	it('calls runSimulation on click in single mode', async () => {
		vi.mocked(runSimulation).mockResolvedValue(mockSingleResult);
		render(SimulateView);
		await fireEvent.click(screen.getByRole('button', { name: /simulate/i }));
		expect(runSimulation).toHaveBeenCalledTimes(1);
	});

	it('shows loading state while simulation runs', async () => {
		let resolveApi!: (v: SimulationResponse) => void;
		vi.mocked(runSimulation).mockReturnValue(
			new Promise((resolve) => { resolveApi = resolve; }),
		);
		render(SimulateView);
		await fireEvent.click(screen.getByRole('button', { name: /simulate/i }));

		await waitFor(() => {
			expect(screen.getByRole('button', { name: /running/i })).toBeDisabled();
		});

		resolveApi(mockSingleResult);
		await waitFor(() => {
			expect(screen.queryByRole('button', { name: /running/i })).not.toBeInTheDocument();
		});
	});

	it('shows summary after single simulation succeeds', async () => {
		vi.mocked(runSimulation).mockResolvedValue(mockSingleResult);
		render(SimulateView);
		await fireEvent.click(screen.getByRole('button', { name: /simulate/i }));

		await waitFor(() => {
			expect(screen.getByText('Final Balance')).toBeInTheDocument();
			expect(screen.getByText('Total Taxes')).toBeInTheDocument();
		});
	});

	it('shows error on API failure', async () => {
		vi.mocked(runSimulation).mockRejectedValue(new Error('Server error'));
		render(SimulateView);
		await fireEvent.click(screen.getByRole('button', { name: /simulate/i }));

		await waitFor(() => {
			expect(screen.getByText('Server error')).toBeInTheDocument();
		});
	});

	it('shows validation error when portfolio is invalid', async () => {
		portfolio.update((p) => {
			p.accounts[0].balance = -100;
			return p;
		});
		render(SimulateView);
		await fireEvent.click(screen.getByRole('button', { name: /simulate/i }));

		await waitFor(() => {
			expect(screen.getByText(/validation errors/i)).toBeInTheDocument();
		});
	});

	it('shows success rate for monte carlo results', async () => {
		vi.mocked(runMonteCarlo).mockResolvedValue(mockMCResult);
		render(SimulateView);

		const mcRadio = screen.getByLabelText(/monte carlo/i);
		await fireEvent.click(mcRadio);
		await fireEvent.click(screen.getByRole('button', { name: /simulate/i }));

		await waitFor(() => {
			expect(screen.getByText(/92\.0% Success Rate/)).toBeInTheDocument();
		});
	});

	it('does not call API when portfolio has validation errors', async () => {
		portfolio.update((p) => {
			p.accounts[0].balance = -100;
			return p;
		});
		render(SimulateView);
		await fireEvent.click(screen.getByRole('button', { name: /simulate/i }));

		await waitFor(() => {
			expect(screen.getByText(/validation errors/i)).toBeInTheDocument();
		});
		expect(runSimulation).not.toHaveBeenCalled();
	});
});
