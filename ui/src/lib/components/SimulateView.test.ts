import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { portfolio, validationErrors, comparisonSnapshots } from '$lib/stores';
import { samplePortfolio } from '$lib/stores';
import type { SimulationResponse, MonteCarloResponse } from '$lib/types';

vi.mock(
   '$lib/components/charts/BalanceChart.svelte',
   () => import('$lib/test-helpers/MockChart.svelte'),
);
vi.mock(
   '$lib/components/charts/FanChart.svelte',
   () => import('$lib/test-helpers/MockChart.svelte'),
);

import SimulateView from './SimulateView.svelte';

const mockSingleResult: SimulationResponse = {
   result: {
      strategy: 'irmaa_tier_1',
      spending_strategy: 'fixed_dollar',
      years: [
         {
            year: 2026,
            age_primary: 65,
            age_spouse: 62,
            agi: 80000,
            bracket: '22%',
            rmd: 0,
            surplus: 0,
            roth_conversion: 10000,
            conversion_tax: 2200,
            pretax_withdrawal: 50000,
            roth_withdrawal: 20000,
            brokerage_withdrawal: 30000,
            total_tax: 15000,
            irmaa_cost: 0,
            total_balance: 485000,
            spending_target: 100000,
            pretax_balance: 350000,
            roth_balance: 80000,
            roth_conversion_balance: 0,
            brokerage_balance: 55000,
            withdrawal_details: [],
         },
      ],
   },
   summary: {
      final_balance: 485000,
      total_taxes_paid: 15000,
      total_irmaa_paid: 0,
      total_roth_conversions: 10000,
      simulation_years: 1,
      strategy: 'irmaa_tier_1',
      spending_strategy: 'fixed_dollar',
   },
};

const mockMCResult: MonteCarloResponse = {
   num_simulations: 1000,
   success_rate: 0.92,
   median_simulation: {
      strategy: 'irmaa_tier_1',
      spending_strategy: 'fixed_dollar',
      years: [],
   },
   yearly_percentiles: [],
   final_balance_p5: 100000,
   final_balance_p95: 950000,
};

describe('SimulateView (tabbed results)', () => {
   beforeEach(() => {
      vi.clearAllMocks();
      portfolio.set(structuredClone(samplePortfolio));
      validationErrors.set({});
      comparisonSnapshots.set([]);
   });

   it('renders tab bar with Simulation and Monte Carlo tabs', () => {
      render(SimulateView, {
         singleResult: mockSingleResult,
         mcResult: null,
         mcLoading: false,
         error: '',
      });
      expect(screen.getByText('Simulation')).toBeInTheDocument();
      expect(screen.getByText('Monte Carlo')).toBeInTheDocument();
   });

   it('shows error message when error prop is set', () => {
      render(SimulateView, {
         singleResult: null,
         mcResult: null,
         mcLoading: false,
         error: 'Server error',
      });
      expect(screen.getByText('Server error')).toBeInTheDocument();
   });

   it('shows summary for single run results on Simulation tab', () => {
      render(SimulateView, {
         singleResult: mockSingleResult,
         mcResult: null,
         mcLoading: false,
         error: '',
      });
      expect(screen.getByText('Final Balance')).toBeInTheDocument();
      expect(screen.getByText('Total Taxes')).toBeInTheDocument();
      expect(screen.getByText('Total IRMAA')).toBeInTheDocument();
      expect(screen.getByText('Roth Conversions')).toBeInTheDocument();
   });

   it('shows details link for single results', () => {
      render(SimulateView, {
         singleResult: mockSingleResult,
         mcResult: null,
         mcLoading: false,
         error: '',
      });
      expect(
         screen.getByRole('link', { name: /year-by-year details/i }),
      ).toBeInTheDocument();
   });

   it('shows loading spinner on Simulation tab when no single result', () => {
      render(SimulateView, {
         singleResult: null,
         mcResult: null,
         mcLoading: true,
         error: '',
      });
      expect(screen.getByText('Running simulation...')).toBeInTheDocument();
   });

   it('shows MC loading spinner when switching to Monte Carlo tab', async () => {
      render(SimulateView, {
         singleResult: mockSingleResult,
         mcResult: null,
         mcLoading: true,
         error: '',
      });
      const mcTab = screen.getByText('Monte Carlo');
      await fireEvent.click(mcTab);
      expect(
         screen.getByText('Running Monte Carlo simulation...'),
      ).toBeInTheDocument();
   });

   it('shows success rate on Monte Carlo tab', async () => {
      render(SimulateView, {
         singleResult: mockSingleResult,
         mcResult: mockMCResult,
         mcLoading: false,
         error: '',
      });
      const mcTab = screen.getByText('Monte Carlo');
      await fireEvent.click(mcTab);
      expect(screen.getByText(/92\.0% Success Rate/)).toBeInTheDocument();
   });

   it('shows final balance percentiles on Monte Carlo tab', async () => {
      render(SimulateView, {
         singleResult: mockSingleResult,
         mcResult: mockMCResult,
         mcLoading: false,
         error: '',
      });
      const mcTab = screen.getByText('Monte Carlo');
      await fireEvent.click(mcTab);
      expect(screen.getByText('5th')).toBeInTheDocument();
      expect(screen.getByText('Median')).toBeInTheDocument();
      expect(screen.getByText('95th')).toBeInTheDocument();
   });

   it('shows depletion count when success rate < 1', async () => {
      const mcWithFailures = { ...mockMCResult, success_rate: 0.9 };
      render(SimulateView, {
         singleResult: null,
         mcResult: mcWithFailures,
         mcLoading: false,
         error: '',
      });
      const mcTab = screen.getByText('Monte Carlo');
      await fireEvent.click(mcTab);
      expect(screen.getByText('100 of 1000')).toBeInTheDocument();
   });

   it('shows no depletion message when success rate is 100%', async () => {
      const mcNoDep = { ...mockMCResult, success_rate: 1.0 };
      render(SimulateView, {
         singleResult: null,
         mcResult: mcNoDep,
         mcLoading: false,
         error: '',
      });
      const mcTab = screen.getByText('Monte Carlo');
      await fireEvent.click(mcTab);
      expect(
         screen.getByText(/no simulations resulted in portfolio depletion/i),
      ).toBeInTheDocument();
   });

   it('shows MC warning text about historically-sampled returns', async () => {
      render(SimulateView, {
         singleResult: null,
         mcResult: mockMCResult,
         mcLoading: false,
         error: '',
      });
      const mcTab = screen.getByText('Monte Carlo');
      await fireEvent.click(mcTab);
      expect(
         screen.getByText(
            /Monte Carlo uses historically-sampled inflation and growth/,
         ),
      ).toBeInTheDocument();
   });

   it('shows View Details link for single results', () => {
      render(SimulateView, {
         singleResult: mockSingleResult,
         mcResult: null,
         mcLoading: false,
         error: '',
      });
      const link = screen.getByText(/view year-by-year details/i);
      expect(link).toBeInTheDocument();
      expect(link.getAttribute('href')).toBe('/details');
   });

   it('shows View Details link for MC results', async () => {
      render(SimulateView, {
         singleResult: null,
         mcResult: mockMCResult,
         mcLoading: false,
         error: '',
      });
      const mcTab = screen.getByText('Monte Carlo');
      await fireEvent.click(mcTab);
      const link = screen.getByText(/view yearly percentiles/i);
      expect(link).toBeInTheDocument();
      expect(link.getAttribute('href')).toBe('/details');
   });

   it('shows initial spending when initial_monthly_spend is present', () => {
      const resultWithSpending: SimulationResponse = {
         ...mockSingleResult,
         summary: {
            ...mockSingleResult.summary,
            initial_monthly_spend: 10000,
            initial_annual_spend: 120000,
         },
      };
      render(SimulateView, {
         singleResult: resultWithSpending,
         mcResult: null,
         mcLoading: false,
         error: '',
      });
      expect(screen.getByText('Initial Spending')).toBeInTheDocument();
      expect(screen.getByText(/\$10,000\/mo/)).toBeInTheDocument();
      expect(screen.getByText(/\$120,000\/yr/)).toBeInTheDocument();
   });

   it('does not show initial spending when field is absent', () => {
      render(SimulateView, {
         singleResult: mockSingleResult,
         mcResult: null,
         mcLoading: false,
         error: '',
      });
      expect(screen.queryByText('Initial Spending')).not.toBeInTheDocument();
   });
});
