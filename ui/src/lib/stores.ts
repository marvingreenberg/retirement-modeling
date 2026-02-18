import { writable } from 'svelte/store';
import type { Portfolio, ComparisonSnapshot, SimulationResponse, MonteCarloResponse, UserProfile } from './types';
import type { FieldErrors } from './validation';

export const samplePortfolio: Portfolio = {
	config: {
		current_age_primary: 58,
		current_age_spouse: 55,
		simulation_years: 35,
		start_year: new Date().getFullYear(),
		annual_spend_net: 120000,
		inflation_rate: 0.03,
		investment_growth_rate: 0.07,
		strategy_target: 'irmaa_tier_1',
		spending_strategy: 'guardrails',
		withdrawal_rate: 0.04,
		guardrails_config: {
			initial_withdrawal_rate: 0.045,
			floor_percent: 0.80,
			ceiling_percent: 1.20,
			adjustment_percent: 0.10,
		},
		tax_brackets_federal: [],
		tax_rate_state: 0.05,
		irmaa_limit_tier_1: 206000,
		social_security: {
			primary_benefit: 42000,
			primary_start_age: 70,
			spouse_benefit: 24000,
			spouse_start_age: 67,
		},
		rmd_start_age: 73,
		planned_expenses: [
			{
				name: 'Kitchen remodel',
				amount: 40000,
				expense_type: 'one_time',
				year: new Date().getFullYear() + 2,
				inflation_adjusted: false,
			},
			{
				name: 'Travel',
				amount: 15000,
				expense_type: 'recurring',
				start_year: new Date().getFullYear() + 4,
				end_year: new Date().getFullYear() + 17,
				inflation_adjusted: true,
			},
		],
		income_streams: [
			{
				name: 'Pension',
				amount: 24000,
				start_age: 65,
				end_age: null,
				taxable_pct: 1.0,
				cola_rate: 0.02,
				owner: 'primary',
			},
		],
		ss_auto: {
			primary_fra_amount: 42000,
			primary_start_age: 70,
			spouse_fra_amount: 24000,
			spouse_start_age: 67,
			fra_age: 67,
		},
	},
	accounts: [
		{
			id: 'sample_401k_p',
			name: '401(k) - Primary',
			balance: 850000,
			type: '401k',
			owner: 'primary',
			cost_basis_ratio: 0.0,
			available_at_age: 0,
		},
		{
			id: 'sample_403b_s',
			name: '403(b) - Spouse',
			balance: 420000,
			type: '403b',
			owner: 'spouse',
			cost_basis_ratio: 0.0,
			available_at_age: 0,
		},
		{
			id: 'sample_roth_p',
			name: 'Roth IRA - Primary',
			balance: 180000,
			type: 'roth_ira',
			owner: 'primary',
			cost_basis_ratio: 1.0,
			available_at_age: 0,
		},
		{
			id: 'sample_brokerage',
			name: 'Joint Brokerage',
			balance: 350000,
			type: 'brokerage',
			owner: 'joint',
			cost_basis_ratio: 0.40,
			available_at_age: 0,
		},
	],
};

export const defaultPortfolio: Portfolio = {
	config: {
		current_age_primary: 0,
		current_age_spouse: 0,
		simulation_years: 30,
		start_year: new Date().getFullYear(),
		annual_spend_net: 0,
		inflation_rate: 0.03,
		investment_growth_rate: 0.07,
		strategy_target: 'standard',
		spending_strategy: 'fixed_dollar',
		withdrawal_rate: 0.04,
		guardrails_config: {
			initial_withdrawal_rate: 0.05,
			floor_percent: 0.80,
			ceiling_percent: 1.20,
			adjustment_percent: 0.10,
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
export const sampleProfile: UserProfile = { primaryName: 'Mike', spouseName: 'Karen' };

export const profile = writable<UserProfile>(structuredClone(defaultProfile));
export const portfolio = writable<Portfolio>(structuredClone(defaultPortfolio));
export const validationErrors = writable<FieldErrors>({});
export const touchedFields = writable<Set<string>>(new Set());
export const formTouched = writable<boolean>(false);
export const comparisonSnapshots = writable<ComparisonSnapshot[]>([]);
export const simulateBlockedSection = writable<string | null>(null);
export const numSimulations = writable<number>(1000);

export interface SimulationResultsState {
	singleResult: SimulationResponse | null;
	mcResult: MonteCarloResponse | null;
}

export const simulationResults = writable<SimulationResultsState>({
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
			balance: Math.round((a.balance * (0.3 + Math.random() * 0.4)) / 1000) * 1000,
		})),
	}));
	profile.update(() => ({ primaryName: 'Alex', spouseName: 'Sam' }));
}
