import { SvelteSet } from 'svelte/reactivity';
import type {
   Portfolio,
   ComparisonSnapshot,
   ComparisonEntry,
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

function createStore<T>(initial: T) {
   let _value = $state(initial);
   return {
      get value() {
         return _value;
      },
      set value(v: T) {
         _value = v;
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
      conservative_growth: false,
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
      salary_auto: null,
      retirement_age: null,
      excess_income_routing: 'brokerage',
      withdrawal_order: ['cash', 'brokerage', 'pretax', 'roth'],
   },
   accounts: [],
};

export const defaultProfile: UserProfile = { primaryName: '', spouseName: '' };

export const profile = createStore<UserProfile>(
   structuredClone(defaultProfile),
);
export const portfolio = createStore<Portfolio>(
   structuredClone(defaultPortfolio),
);
export const validationErrors = createStore<FieldErrors>({});
export const touchedFields = createStore<SvelteSet<string>>(new SvelteSet());
export const formTouched = createStore<boolean>(false);
export const comparisonSnapshots = createStore<ComparisonSnapshot[]>([]);
export const simulateBlockedSection = createStore<string | null>(null);
export const numSimulations = createStore<number>(1000);
export const pvMode = createStore<boolean>(false);

// Unified comparison view stores
export const comparisonEntries = createStore<ComparisonEntry[]>([]);
export const selectedEntryIds = createStore<string[]>([]);
export type ResultPaneTab = 'balance' | 'spending' | 'monte_carlo' | 'details';
export const resultPaneTab = createStore<ResultPaneTab>('balance');
export const selectedYearIdx = createStore<number>(0);

export interface SimulationResultsState {
   singleResult: SimulationResponse | null;
   mcResult: MonteCarloResponse | null;
}

export const simulationResults = createStore<SimulationResultsState>({
   singleResult: null,
   mcResult: null,
});

/**
 * Produces a string fingerprint of the "structural" portfolio inputs —
 * the fields that, when changed, make existing comparison snapshots invalid.
 * Deliberately excludes settings that are varied between comparison runs
 * (inflation, growth mode, strategies, withdrawal order, etc.).
 */
export function portfolioFingerprint(p: Portfolio): string {
   const data = {
      accounts: p.accounts.map((a) => ({
         id: a.id,
         balance: a.balance,
         type: a.type,
         stock_pct: a.stock_pct,
      })),
      spend: p.config.annual_spend_net,
      expenses: p.config.planned_expenses,
      income: p.config.income_streams,
      ss: p.config.social_security,
      ss_auto: p.config.ss_auto,
      salary_auto: p.config.salary_auto,
   };
   return JSON.stringify(data);
}

export function markTouched(path: string) {
   touchedFields.value = new SvelteSet([...touchedFields.value, path]);
}

export function markFormTouched() {
   formTouched.value = true;
}

export function randomizeForDemo() {
   portfolio.value = {
      ...portfolio.value,
      accounts: portfolio.value.accounts.map((a) => ({
         ...a,
         balance:
            Math.round((a.balance * (0.3 + Math.random() * 0.4)) / 1000) * 1000,
      })),
   };
   profile.value = { primaryName: 'Alex', spouseName: 'Sam' };
}
