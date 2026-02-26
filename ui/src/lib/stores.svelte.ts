import { untrack } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import type { Writable, Subscriber, Unsubscriber } from 'svelte/store';
import type {
   Portfolio,
   ComparisonSnapshot,
   SimulationResponse,
   MonteCarloResponse,
   UserProfile,
} from './types';
import type { FieldErrors } from './validation';
export {
   sampleScenarios,
   samplePortfolio,
   sampleProfile,
   type SampleScenario,
} from './sampleScenarios';

function reactiveWritable<T>(initial: T): Writable<T> {
   let _value: T = $state(initial);
   // eslint-disable-next-line svelte/prefer-svelte-reactivity -- internal subscriber tracking, not reactive state
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

const currentYear = new Date().getFullYear();

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
      retirement_age: null,
      excess_income_routing: 'brokerage',
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
export const touchedFields = reactiveWritable<SvelteSet<string>>(
   new SvelteSet(),
);
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
   touchedFields.update((s) => new SvelteSet([...s, path]));
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
