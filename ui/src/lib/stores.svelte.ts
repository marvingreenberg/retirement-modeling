import { untrack } from 'svelte';
import type { Writable, Subscriber, Unsubscriber } from 'svelte/store';
import type {
   Portfolio,
   ComparisonSnapshot,
   SimulationResponse,
   MonteCarloResponse,
   UserProfile,
} from './types';
import type { FieldErrors } from './validation';

function reactiveWritable<T>(initial: T): Writable<T> {
   let _value: T = $state(initial);
   const subs = new Set<Subscriber<T>>();

   function notify() {
      for (const fn of subs) fn(_value);
   }

   return {
      subscribe(fn: Subscriber<T>): Unsubscriber {
         subs.add(fn);
         untrack(() => fn(_value));
         return () => {
            subs.delete(fn);
         };
      },
      set(v: T) {
         _value = v;
         untrack(notify);
      },
      update(fn: (v: T) => T) {
         _value = untrack(() => fn(_value));
         untrack(notify);
      },
   };
}

export function snapshot<T>(value: T): T {
   return $state.snapshot(value) as T;
}

export interface SampleScenario {
   profile: UserProfile;
   portfolio: Portfolio;
}

const currentYear = new Date().getFullYear();

export const sampleScenarios: Record<string, SampleScenario> = {
   'Moderate Couple': {
      profile: { primaryName: 'Pat', spouseName: 'Chris' },
      portfolio: {
         config: {
            current_age_primary: 65,
            current_age_spouse: 61,
            simulation_years: 30,
            start_year: currentYear,
            annual_spend_net: 65000,
            inflation_rate: 0.03,
            investment_growth_rate: 0.07,
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
            tax_rate_state: 0.05,
            irmaa_limit_tier_1: 206000,
            social_security: {
               primary_benefit: 36000,
               primary_start_age: 67,
               spouse_benefit: 26400,
               spouse_start_age: 67,
            },
            rmd_start_age: 73,
            planned_expenses: [
               {
                  name: 'New car',
                  amount: 10000,
                  expense_type: 'one_time',
                  year: currentYear + 5,
                  inflation_adjusted: false,
               },
            ],
            income_streams: [
               {
                  name: 'Pension',
                  amount: 22000,
                  start_age: 65,
                  end_age: null,
                  taxable_pct: 1.0,
                  cola_rate: 0.02,
                  owner: 'primary',
               },
            ],
            ss_auto: {
               primary_fra_amount: 36000,
               primary_start_age: 67,
               spouse_fra_amount: 26400,
               spouse_start_age: 67,
               fra_age: 67,
            },
         },
         accounts: [
            {
               id: 'mod_401k_p',
               name: '401(k)',
               balance: 300000,
               type: '401k',
               owner: 'primary',
               cost_basis_ratio: 0.0,
               available_at_age: 60,
            },
            {
               id: 'mod_cash',
               name: 'Cash/CD',
               balance: 20000,
               type: 'cash_cd',
               owner: 'primary',
               cost_basis_ratio: 1.0,
               available_at_age: 0,
            },
            {
               id: 'mod_ira_s',
               name: 'IRA - Spouse',
               balance: 50000,
               type: 'ira',
               owner: 'spouse',
               cost_basis_ratio: 0.0,
               available_at_age: 60,
            },
         ],
      },
   },
   'Comfortable Single': {
      profile: { primaryName: 'Jordan', spouseName: '' },
      portfolio: {
         config: {
            current_age_primary: 63,
            current_age_spouse: 0,
            simulation_years: 32,
            start_year: currentYear,
            annual_spend_net: 85000,
            inflation_rate: 0.03,
            investment_growth_rate: 0.07,
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
            tax_rate_state: 0.05,
            irmaa_limit_tier_1: 206000,
            social_security: {
               primary_benefit: 36000,
               primary_start_age: 67,
               spouse_benefit: 0,
               spouse_start_age: 67,
            },
            rmd_start_age: 73,
            planned_expenses: [
               {
                  name: 'Vacation home',
                  amount: 100000,
                  expense_type: 'one_time',
                  year: currentYear + 5,
                  inflation_adjusted: false,
               },
            ],
            income_streams: [
               {
                  name: 'Alimony',
                  amount: 18000,
                  start_age: 63,
                  end_age: null,
                  taxable_pct: 1.0,
                  cola_rate: null,
                  owner: 'primary',
               },
               {
                  name: 'Rental income',
                  amount: 52500,
                  start_age: 63,
                  end_age: null,
                  taxable_pct: 1.0,
                  cola_rate: 0.02,
                  owner: 'primary',
               },
            ],
            ss_auto: {
               primary_fra_amount: 36000,
               primary_start_age: 67,
               spouse_fra_amount: null,
               spouse_start_age: null,
               fra_age: 67,
            },
         },
         accounts: [
            {
               id: 'comf_401k',
               name: '401(k)',
               balance: 950000,
               type: '401k',
               owner: 'primary',
               cost_basis_ratio: 0.0,
               available_at_age: 60,
            },
            {
               id: 'comf_ira',
               name: 'IRA',
               balance: 100000,
               type: 'ira',
               owner: 'primary',
               cost_basis_ratio: 0.0,
               available_at_age: 60,
            },
            {
               id: 'comf_brokerage',
               name: 'Brokerage',
               balance: 250000,
               type: 'brokerage',
               owner: 'primary',
               cost_basis_ratio: 0.4,
               available_at_age: 0,
            },
         ],
      },
   },
   'Wealthier Couple': {
      profile: { primaryName: 'Sue', spouseName: 'Steve' },
      portfolio: {
         config: {
            current_age_primary: 62,
            current_age_spouse: 65,
            simulation_years: 33,
            start_year: currentYear,
            annual_spend_net: 125000,
            inflation_rate: 0.03,
            investment_growth_rate: 0.07,
            strategy_target: 'irmaa_tier_1',
            spending_strategy: 'guardrails',
            withdrawal_rate: 0.04,
            guardrails_config: {
               initial_withdrawal_rate: 0.045,
               floor_percent: 0.8,
               ceiling_percent: 1.2,
               adjustment_percent: 0.1,
            },
            tax_brackets_federal: [],
            tax_rate_state: 0.05,
            irmaa_limit_tier_1: 206000,
            social_security: {
               primary_benefit: 36000,
               primary_start_age: 67,
               spouse_benefit: 26400,
               spouse_start_age: 67,
            },
            rmd_start_age: 73,
            planned_expenses: [
               {
                  name: 'Home renovation',
                  amount: 100000,
                  expense_type: 'one_time',
                  year: currentYear + 5,
                  inflation_adjusted: false,
               },
            ],
            income_streams: [
               {
                  name: 'Alimony',
                  amount: 18000,
                  start_age: 62,
                  end_age: null,
                  taxable_pct: 1.0,
                  cola_rate: null,
                  owner: 'primary',
               },
            ],
            ss_auto: {
               primary_fra_amount: 36000,
               primary_start_age: 67,
               spouse_fra_amount: 26400,
               spouse_start_age: 67,
               fra_age: 67,
            },
         },
         accounts: [
            {
               id: 'wlth_401k_p',
               name: '401(k) - Sue',
               balance: 1200000,
               type: '401k',
               owner: 'primary',
               cost_basis_ratio: 0.0,
               available_at_age: 60,
            },
            {
               id: 'wlth_ira_p',
               name: 'IRA - Sue',
               balance: 100000,
               type: 'ira',
               owner: 'primary',
               cost_basis_ratio: 0.0,
               available_at_age: 60,
            },
            {
               id: 'wlth_roth_p',
               name: 'Roth IRA - Sue',
               balance: 75000,
               type: 'roth_ira',
               owner: 'primary',
               cost_basis_ratio: 1.0,
               available_at_age: 60,
            },
            {
               id: 'wlth_401k_s',
               name: '401(k) - Steve',
               balance: 600000,
               type: '401k',
               owner: 'spouse',
               cost_basis_ratio: 0.0,
               available_at_age: 60,
            },
            {
               id: 'wlth_cash_s',
               name: 'Cash/CD - Steve',
               balance: 20000,
               type: 'cash_cd',
               owner: 'spouse',
               cost_basis_ratio: 1.0,
               available_at_age: 0,
            },
         ],
      },
   },
};

// Backward-compatible aliases — point to first scenario
export const samplePortfolio: Portfolio =
   sampleScenarios['Moderate Couple'].portfolio;
export const sampleProfile: UserProfile =
   sampleScenarios['Moderate Couple'].profile;

export const defaultPortfolio: Portfolio = {
   config: {
      current_age_primary: 0,
      current_age_spouse: 0,
      simulation_years: 30,
      start_year: currentYear,
      annual_spend_net: 0,
      inflation_rate: 0.03,
      investment_growth_rate: 0.07,
      strategy_target: 'standard',
      spending_strategy: 'fixed_dollar',
      withdrawal_rate: 0.04,
      guardrails_config: {
         initial_withdrawal_rate: 0.05,
         floor_percent: 0.8,
         ceiling_percent: 1.2,
         adjustment_percent: 0.1,
      },
      tax_brackets_federal: [],
      tax_rate_state: 0.05,
      irmaa_limit_tier_1: 206000,
      social_security: {
         primary_benefit: 0,
         primary_start_age: 67,
         spouse_benefit: 0,
         spouse_start_age: 67,
      },
      rmd_start_age: 73,
      planned_expenses: [],
      income_streams: [],
      ss_auto: null,
   },
   accounts: [],
};

export const defaultProfile: UserProfile = { primaryName: '', spouseName: '' };

export const profile = reactiveWritable<UserProfile>(
   structuredClone(defaultProfile),
);
export const portfolio = reactiveWritable<Portfolio>(
   structuredClone(defaultPortfolio),
);
export const validationErrors = reactiveWritable<FieldErrors>({});
export const touchedFields = reactiveWritable<Set<string>>(new Set());
export const formTouched = reactiveWritable<boolean>(false);
export const comparisonSnapshots = reactiveWritable<ComparisonSnapshot[]>([]);
export const simulateBlockedSection = reactiveWritable<string | null>(null);
export const numSimulations = reactiveWritable<number>(1000);

export interface SimulationResultsState {
   singleResult: SimulationResponse | null;
   mcResult: MonteCarloResponse | null;
}

export const simulationResults = reactiveWritable<SimulationResultsState>({
   singleResult: null,
   mcResult: null,
});

export function markTouched(path: string) {
   touchedFields.update((s) => new Set([...s, path]));
}

export function markFormTouched() {
   formTouched.set(true);
}

export function randomizeForDemo() {
   portfolio.update((p) => ({
      ...p,
      accounts: p.accounts.map((a) => ({
         ...a,
         balance:
            Math.round((a.balance * (0.3 + Math.random() * 0.4)) / 1000) * 1000,
      })),
   }));
   profile.update(() => ({ primaryName: 'Alex', spouseName: 'Sam' }));
}
