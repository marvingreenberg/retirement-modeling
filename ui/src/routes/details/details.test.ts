import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { simulationResults } from '$lib/stores';
import type { SimulationResponse, MonteCarloResponse } from '$lib/types';

const { default: DetailsPage } = await import('./+page.svelte');

const mockSingleResult: SimulationResponse = {
   result: {
      strategy: 'standard',
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
      strategy: 'standard',
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
   yearly_percentiles: [
      {
         age: 65,
         year: 2026,
         balance_p5: 90000,
         balance_p25: 280000,
         balance_median: 500000,
         balance_p75: 720000,
         balance_p95: 1100000,
         spending_p5: 40000,
         spending_p25: 55000,
         spending_median: 70000,
         spending_p75: 85000,
         spending_p95: 100000,
         agi_median: 50000,
         total_tax_median: 10000,
         roth_conversion_median: 0,
      },
   ],
   final_balance_p5: 100000,
   final_balance_p95: 950000,
};

describe('Details page', () => {
   beforeEach(() => {
      simulationResults.value = { singleResult: null, mcResult: null };
   });

   it('shows empty state when no results', () => {
      render(DetailsPage);
      expect(
         screen.getByText('Run a simulation to see detailed results.'),
      ).toBeInTheDocument();
   });

   it('shows year-by-year table for single run results', () => {
      simulationResults.value = {
         singleResult: mockSingleResult,
         mcResult: null,
      };
      render(DetailsPage);
      expect(screen.getByText('Year-by-Year Detail')).toBeInTheDocument();
      expect(screen.getByText('2026')).toBeInTheDocument();
      expect(screen.getByText('65')).toBeInTheDocument();
      expect(screen.getByText('22%')).toBeInTheDocument();
   });

   it('shows Monte Carlo percentile table on MC tab', async () => {
      simulationResults.value = { singleResult: null, mcResult: mockMCResult };
      render(DetailsPage);
      const mcTab = screen.getByText('Monte Carlo');
      await fireEvent.click(mcTab);
      expect(
         screen.getByText('Yearly Balance Percentiles'),
      ).toBeInTheDocument();
      expect(
         screen.getByText('Yearly Spending Percentiles'),
      ).toBeInTheDocument();
      expect(screen.getAllByText('5th')).toHaveLength(2);
      expect(screen.getAllByText('Median')).toHaveLength(2);
      expect(screen.getAllByText('95th')).toHaveLength(2);
   });

   it('shows heading on all states', () => {
      render(DetailsPage);
      expect(screen.getByText('Detailed Results')).toBeInTheDocument();
   });

   it('shows tab bar when results exist', () => {
      simulationResults.value = {
         singleResult: mockSingleResult,
         mcResult: mockMCResult,
      };
      render(DetailsPage);
      expect(screen.getByText('Simulation')).toBeInTheDocument();
      expect(screen.getByText('Monte Carlo')).toBeInTheDocument();
   });
});
