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
   '$lib/components/charts/SpendingChart.svelte',
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
            conversion_tax_from_brokerage: 0,
            pretax_withdrawal: 50000,
            roth_withdrawal: 20000,
            brokerage_withdrawal: 30000,
            total_tax: 15000,
            irmaa_cost: 0,
            total_balance: 485000,
            spending_target: 100000,
            planned_expense: 0,
            total_income: 0,
            income_tax: 12000,
            pretax_balance: 350000,
            roth_balance: 80000,
            roth_conversion_balance: 0,
            brokerage_balance: 55000,
            pretax_401k_deposit: 0,
            roth_401k_deposit: 0,
            brokerage_gains_tax: 0,
            spending_limited: false,
            withdrawal_details: [],
            income_details: [],
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
      portfolio.value = structuredClone(samplePortfolio);
      validationErrors.value = {};
      comparisonSnapshots.value = [];
   });

   it('renders tab bar with Simulation, Spending, and Monte Carlo tabs', () => {
      render(SimulateView, {
         singleResult: mockSingleResult,
         mcResult: null,
         mcLoading: false,
         error: '',
      });
      expect(screen.getByText('Simulation')).toBeInTheDocument();
      expect(screen.getByText('Spending')).toBeInTheDocument();
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

   it('shows summary bar with single run metrics', () => {
      render(SimulateView, {
         singleResult: mockSingleResult,
         mcResult: null,
         mcLoading: false,
         error: '',
      });
      expect(screen.getByText('Final Balance')).toBeInTheDocument();
      expect(screen.getByText('Total Taxes (PV $)')).toBeInTheDocument();
      expect(
         screen.getByText('Total IRMAA Surcharges (PV $)'),
      ).toBeInTheDocument();
      expect(screen.getByText('Spending Range (PV $)')).toBeInTheDocument();
   });

   it('shows dash for MC metrics when no MC result', () => {
      render(SimulateView, {
         singleResult: mockSingleResult,
         mcResult: null,
         mcLoading: false,
         error: '',
      });
      expect(screen.getByText('MC Balance Range')).toBeInTheDocument();
      expect(screen.getByText('MC Success Rate')).toBeInTheDocument();
      // The values should show dashes
      const balanceRange = screen.getByText('MC Balance Range').closest('div');
      expect(balanceRange?.textContent).toContain('—');
      const successRate = screen.getByText('MC Success Rate').closest('div');
      expect(successRate?.textContent).toContain('—');
   });

   it('shows MC metrics in summary bar when MC result exists', () => {
      render(SimulateView, {
         singleResult: mockSingleResult,
         mcResult: mockMCResult,
         mcLoading: false,
         error: '',
      });
      expect(screen.getByText('92%')).toBeInTheDocument();
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

   it('shows success rate with stoplight icon on Monte Carlo tab', async () => {
      render(SimulateView, {
         singleResult: mockSingleResult,
         mcResult: mockMCResult,
         mcLoading: false,
         error: '',
      });
      // Success rate appears in summary bar as "92%" (0 decimal places)
      expect(screen.getByText('92%')).toBeInTheDocument();
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

   it('shows spending chart on Spending tab', async () => {
      render(SimulateView, {
         singleResult: mockSingleResult,
         mcResult: null,
         mcLoading: false,
         error: '',
      });
      const spendingTab = screen.getByText('Spending');
      await fireEvent.click(spendingTab);
      expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
   });

   it('hides PV toggle on Monte Carlo tab', async () => {
      render(SimulateView, {
         singleResult: mockSingleResult,
         mcResult: mockMCResult,
         mcLoading: false,
         error: '',
      });
      // PV toggle visible on Simulation tab
      expect(screen.getByLabelText('Present Value $')).toBeInTheDocument();
      // Switch to MC tab
      const mcTab = screen.getByText('Monte Carlo');
      await fireEvent.click(mcTab);
      expect(
         screen.queryByLabelText('Present Value $'),
      ).not.toBeInTheDocument();
   });

   it('shows dash for single-result metrics when no single result', () => {
      render(SimulateView, {
         singleResult: null,
         mcResult: mockMCResult,
         mcLoading: false,
         error: '',
      });
      const finalBalance = screen.getByText('Final Balance').closest('div');
      expect(finalBalance?.textContent).toContain('—');
      const taxes = screen.getByText('Total Taxes (PV $)').closest('div');
      expect(taxes?.textContent).toContain('—');
   });
});
