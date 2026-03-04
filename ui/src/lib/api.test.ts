import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runSimulation, runMonteCarlo } from './api';
import type { Portfolio } from './types';

const mockPortfolio: Portfolio = {
   config: {
      current_age_primary: 65,
      current_age_spouse: 62,
      simulation_years: 30,
      start_year: 2026,
      annual_spend_net: 100000,
      inflation_rate: 0.03,
      conservative_growth: false,
      strategy_target: 'irmaa_tier_1',
      spending_strategy: 'fixed_dollar',
      withdrawal_rate: 0.04,
      guardrails_config: {
         initial_withdrawal_rate: 0.05,
         floor_percent: 0.8,
         ceiling_percent: 1.2,
         adjustment_percent: 0.1,
      },
      tax_brackets_federal: [],
      tax_rate_state: 0.0575,
      irmaa_limit_tier_1: 206000,
      social_security: {
         primary_benefit: 36000,
         primary_start_age: 70,
         spouse_benefit: 18000,
         spouse_start_age: 67,
      },
      rmd_start_age: 73,
      planned_expenses: [],
      income_streams: [],
      ss_auto: null,
      retirement_age: null,
      excess_income_routing: 'brokerage',
      withdrawal_order: ['cash', 'brokerage', 'pretax', 'roth'],
   },
   accounts: [
      {
         id: 'ira_1',
         name: 'IRA',
         balance: 500000,
         type: 'ira',
         owner: 'primary',
         cost_basis_ratio: 0.0,
         available_at_age: 0,
      },
   ],
};

beforeEach(() => {
   vi.restoreAllMocks();
});

describe('runSimulation', () => {
   it('calls POST /api/v1/simulate with portfolio', async () => {
      const mockResult = { result: {}, summary: {} };
      vi.stubGlobal(
         'fetch',
         vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockResult),
         }),
      );

      await runSimulation(mockPortfolio);
      expect(fetch).toHaveBeenCalledWith(
         '/api/v1/simulate',
         expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
         }),
      );
      const callBody = JSON.parse((fetch as any).mock.calls[0][1].body);
      expect(callBody.portfolio).toBeDefined();
   });

   it('throws with detail message on 400', async () => {
      vi.stubGlobal(
         'fetch',
         vi.fn().mockResolvedValue({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ detail: 'Invalid portfolio' }),
         }),
      );

      await expect(runSimulation(mockPortfolio)).rejects.toThrow(
         'Invalid portfolio',
      );
   });
});

describe('runMonteCarlo', () => {
   it('calls POST /api/v1/monte-carlo with simulation count', async () => {
      vi.stubGlobal(
         'fetch',
         vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({}),
         }),
      );

      await runMonteCarlo(mockPortfolio, 500);
      const callBody = JSON.parse((fetch as any).mock.calls[0][1].body);
      expect(callBody.num_simulations).toBe(500);
   });
});
