export interface UserProfile {
	primaryName: string;
	spouseName: string;
}

export type AccountType = 'brokerage' | 'pretax' | 'roth';
export type Owner = 'primary' | 'spouse' | 'joint';
export type ConversionStrategy = 'standard' | 'irmaa_tier_1' | '22_percent_bracket' | '24_percent_bracket';
export type SpendingStrategy = 'fixed_dollar' | 'percent_of_portfolio' | 'guardrails' | 'rmd_based';

export interface GuardrailsConfig {
	initial_withdrawal_rate: number;
	floor_percent: number;
	ceiling_percent: number;
	adjustment_percent: number;
}

export interface Account {
	id: string;
	name: string;
	balance: number;
	type: AccountType;
	owner: Owner;
	cost_basis_ratio?: number;
	available_at_age?: number;
}

export interface SocialSecurityConfig {
	primary_benefit: number;
	primary_start_age: number;
	spouse_benefit: number;
	spouse_start_age: number;
}

export interface TaxBracket {
	limit: number;
	rate: number;
}

export interface IncomeStream {
	name: string;
	amount: number;
	start_age: number;
	end_age: number | null;
	taxable_pct: number;
	cola_rate: number | null;
}

export interface SSAutoConfig {
	primary_fra_amount: number;
	primary_start_age: number;
	spouse_fra_amount: number | null;
	spouse_start_age: number | null;
	fra_age: number;
}

export interface PlannedExpense {
	name: string;
	amount: number;
	expense_type: 'one_time' | 'recurring';
	year?: number;
	start_age?: number;
	end_age?: number;
	inflation_adjusted: boolean;
}

export interface SimulationConfig {
	current_age_primary: number;
	current_age_spouse: number;
	simulation_years: number;
	start_year: number;
	annual_spend_net: number;
	inflation_rate: number;
	investment_growth_rate: number;
	strategy_target: ConversionStrategy;
	spending_strategy?: SpendingStrategy;
	withdrawal_rate?: number;
	guardrails_config?: GuardrailsConfig;
	tax_brackets_federal: TaxBracket[];
	tax_rate_state: number;
	tax_rate_capital_gains: number;
	irmaa_limit_tier_1: number;
	social_security: SocialSecurityConfig;
	rmd_start_age: number;
	planned_expenses: PlannedExpense[];
	income_streams: IncomeStream[];
	ss_auto: SSAutoConfig | null;
}

export interface Portfolio {
	config: SimulationConfig;
	accounts: Account[];
}

export interface YearResult {
	year: number;
	age_primary: number;
	age_spouse: number;
	agi: number;
	bracket: string;
	rmd: number;
	surplus: number;
	roth_conversion: number;
	conversion_tax: number;
	pretax_withdrawal: number;
	roth_withdrawal: number;
	brokerage_withdrawal: number;
	total_tax: number;
	irmaa_cost: number;
	total_balance: number;
	spending_target: number;
	pretax_balance: number;
	roth_balance: number;
	brokerage_balance: number;
}

export interface SimulationResult {
	strategy: ConversionStrategy;
	spending_strategy: SpendingStrategy;
	years: YearResult[];
}

export interface SimulationResponse {
	result: SimulationResult;
	summary: {
		final_balance: number;
		total_taxes_paid: number;
		total_irmaa_paid: number;
		total_roth_conversions: number;
		simulation_years: number;
		strategy: string;
		spending_strategy: string;
		initial_annual_spend?: number;
		initial_monthly_spend?: number;
	};
}

export interface YearlyPercentiles {
	age: number;
	percentile_5: number;
	percentile_25: number;
	median: number;
	percentile_75: number;
	percentile_95: number;
}

export interface MonteCarloResponse {
	num_simulations: number;
	success_rate: number;
	failure_rate: number;
	median_final_balance: number;
	percentile_5: number;
	percentile_25: number;
	percentile_75: number;
	percentile_95: number;
	depletion_ages: number[];
	yearly_percentiles: YearlyPercentiles[];
}

export interface ComparisonResult {
	conversion_strategy: string;
	spending_strategy: string;
	final_balance: number;
	total_taxes_paid: number;
	total_irmaa_paid: number;
	total_roth_conversions: number;
	final_roth_balance: number;
	final_pretax_balance: number;
	final_brokerage_balance: number;
}

export interface CompareResponse {
	comparisons: ComparisonResult[];
}

export interface StrategyOption {
	value: string;
	description: string;
}

export interface StrategiesResponse {
	conversion_strategies: StrategyOption[];
	spending_strategies: StrategyOption[];
}

export interface ComparisonSnapshot {
	id: string;
	name: string;
	runType: 'single' | 'monte_carlo';
	numSimulations?: number;
	inflationRate: number;
	growthRate: number;
	spendingStrategy: string;
	conversionStrategy: string;
	taxRateState: number;
	taxRateCapitalGains: number;
	finalBalance: number;
	totalTaxes: number;
	totalIrmaa: number;
	totalRothConversions: number;
	successRate?: number;
}
