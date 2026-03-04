import { describe, it, expect } from 'vitest';
import { buildChartEvents } from '$lib/chartEvents';
import type { SimulationConfig } from '$lib/types';

function makeConfig(
   overrides: Partial<SimulationConfig> = {},
): SimulationConfig {
   return {
      current_age_primary: 65,
      current_age_spouse: 62,
      simulation_years: 30,
      start_year: 2026,
      annual_spend_net: 100000,
      inflation_rate: 0.03,
      conservative_growth: false,
      strategy_target: 'irmaa_tier_1',
      tax_brackets_federal: [],
      tax_rate_state: 0.05,
      irmaa_limit_tier_1: 206000,
      social_security: {
         primary_benefit: 25000,
         primary_start_age: 70,
         spouse_benefit: 12000,
         spouse_start_age: 67,
      },
      rmd_start_age: 73,
      planned_expenses: [],
      income_streams: [],
      ss_auto: null,
      retirement_age: null,
      excess_income_routing: 'brokerage',
      withdrawal_order: ['cash', 'brokerage', 'pretax', 'roth'],
      ...overrides,
   };
}

describe('buildChartEvents', () => {
   it('returns empty array when no income streams or expenses', () => {
      const events = buildChartEvents(makeConfig());
      expect(events).toEqual([]);
   });

   it('creates start event for income stream', () => {
      const config = makeConfig({
         income_streams: [
            {
               name: 'Pension',
               kind: 'pension',
               amount: 30000,
               start_age: 67,
               end_age: null,
               taxable_pct: 1.0,
               cola_rate: null,
               owner: 'primary',
               pretax_401k: 0,
               roth_401k: 0,
            },
         ],
      });
      const events = buildChartEvents(config);
      expect(events).toHaveLength(1);
      expect(events[0].year).toBe(2028);
      expect(events[0].label).toBe('Pension $30K');
      expect(events[0].type).toBe('start');
      expect(events[0].kind).toBe('income_pension');
   });

   it('creates start and end events for income stream with end_age', () => {
      const config = makeConfig({
         income_streams: [
            {
               name: 'Job',
               kind: 'employment',
               amount: 120000,
               start_age: 65,
               end_age: 70,
               taxable_pct: 1.0,
               cola_rate: null,
               owner: 'primary',
               pretax_401k: 0,
               roth_401k: 0,
            },
         ],
      });
      const events = buildChartEvents(config);
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('start');
      expect(events[0].year).toBe(2026);
      expect(events[0].kind).toBe('income_employment');
      expect(events[1].type).toBe('end');
      expect(events[1].year).toBe(2031);
      expect(events[1].label).toBe('Job ends');
      expect(events[1].kind).toBe('income_end');
   });

   it('uses spouse age for spouse-owned income', () => {
      const config = makeConfig({
         income_streams: [
            {
               name: 'Spouse Pension',
               kind: 'pension',
               amount: 20000,
               start_age: 65,
               end_age: null,
               taxable_pct: 1.0,
               cola_rate: null,
               owner: 'spouse',
               pretax_401k: 0,
               roth_401k: 0,
            },
         ],
      });
      const events = buildChartEvents(config);
      expect(events[0].year).toBe(2029);
      expect(events[0].kind).toBe('income_pension');
   });

   it('creates event for one-time planned expense', () => {
      const config = makeConfig({
         planned_expenses: [
            {
               name: 'Home Reno',
               amount: 50000,
               expense_type: 'one_time',
               year: 2030,
               inflation_adjusted: false,
            },
         ],
      });
      const events = buildChartEvents(config);
      expect(events).toHaveLength(1);
      expect(events[0].year).toBe(2030);
      expect(events[0].label).toBe('Home Reno $50K');
      expect(events[0].kind).toBe('expense_one_time');
   });

   it('creates event for recurring planned expense', () => {
      const config = makeConfig({
         planned_expenses: [
            {
               name: 'Nursing Home',
               amount: 100000,
               expense_type: 'recurring',
               start_year: 2040,
               end_year: 2050,
               inflation_adjusted: true,
            },
         ],
      });
      const events = buildChartEvents(config);
      expect(events).toHaveLength(1);
      expect(events[0].year).toBe(2040);
      expect(events[0].label).toBe('Nursing Home $100K');
      expect(events[0].kind).toBe('expense_recurring');
   });

   it('sorts events by year', () => {
      const config = makeConfig({
         income_streams: [
            {
               name: 'Late Pension',
               kind: 'pension',
               amount: 10000,
               start_age: 75,
               end_age: null,
               taxable_pct: 1.0,
               cola_rate: null,
               owner: 'primary',
               pretax_401k: 0,
               roth_401k: 0,
            },
         ],
         planned_expenses: [
            {
               name: 'Early Expense',
               amount: 5000,
               expense_type: 'one_time',
               year: 2027,
               inflation_adjusted: false,
            },
         ],
      });
      const events = buildChartEvents(config);
      expect(events[0].year).toBe(2027);
      expect(events[1].year).toBe(2036);
   });
});
