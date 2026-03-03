export interface UserProfile {
   primaryName: string;
   spouseName: string;
   avatarSvg?: string;
}

export type AccountType =
   | 'brokerage'
   | 'cash_cd'
   | 'roth_ira'
   | 'roth_401k'
   | 'roth_conversion'
   | '401k'
   | '403b'
   | '457b'
   | 'ira'
   | 'sep_ira'
   | 'simple_ira';

export type TaxCategory = 'pretax' | 'roth' | 'brokerage' | 'cash';

export const TAX_CATEGORY_MAP: Record<AccountType, TaxCategory> = {
   brokerage: 'brokerage',
   cash_cd: 'cash',
   roth_ira: 'roth',
   roth_401k: 'roth',
   roth_conversion: 'roth',
   '401k': 'pretax',
   '403b': 'pretax',
   '457b': 'pretax',
   ira: 'pretax',
   sep_ira: 'pretax',
   simple_ira: 'pretax',
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
   brokerage: 'Brokerage',
   cash_cd: 'Cash/CD',
   roth_ira: 'Roth IRA',
   roth_401k: 'Roth 401(k)',
   roth_conversion: 'Roth Conversions',
   '401k': '401(k)',
   '403b': '403(b)',
   '457b': '457(b)',
   ira: 'IRA',
   sep_ira: 'SEP IRA',
   simple_ira: 'SIMPLE IRA',
};

export const ACCOUNT_TYPE_DEFAULTS: Record<
   AccountType,
   {
      cost_basis_ratio: number;
      editable: boolean;
      default_available_age: number;
      default_stock_pct: number;
   }
> = {
   brokerage: {
      cost_basis_ratio: 0.4,
      editable: true,
      default_available_age: 0,
      default_stock_pct: 60,
   },
   cash_cd: {
      cost_basis_ratio: 1.0,
      editable: false,
      default_available_age: 0,
      default_stock_pct: 0,
   },
   roth_ira: {
      cost_basis_ratio: 1.0,
      editable: false,
      default_available_age: 60,
      default_stock_pct: 80,
   },
   roth_401k: {
      cost_basis_ratio: 1.0,
      editable: false,
      default_available_age: 60,
      default_stock_pct: 80,
   },
   roth_conversion: {
      cost_basis_ratio: 1.0,
      editable: false,
      default_available_age: 60,
      default_stock_pct: 80,
   },
   '401k': {
      cost_basis_ratio: 0.0,
      editable: false,
      default_available_age: 60,
      default_stock_pct: 60,
   },
   '403b': {
      cost_basis_ratio: 0.0,
      editable: false,
      default_available_age: 60,
      default_stock_pct: 60,
   },
   '457b': {
      cost_basis_ratio: 0.0,
      editable: false,
      default_available_age: 60,
      default_stock_pct: 60,
   },
   ira: {
      cost_basis_ratio: 0.0,
      editable: false,
      default_available_age: 60,
      default_stock_pct: 60,
   },
   sep_ira: {
      cost_basis_ratio: 0.0,
      editable: false,
      default_available_age: 60,
      default_stock_pct: 60,
   },
   simple_ira: {
      cost_basis_ratio: 0.0,
      editable: false,
      default_available_age: 60,
      default_stock_pct: 60,
   },
};

// Account types that are individual-only (no joint ownership)
export const INDIVIDUAL_ONLY_TYPES: Set<AccountType> = new Set([
   'roth_ira',
   'roth_401k',
   '401k',
   '403b',
   '457b',
   'ira',
   'sep_ira',
   'simple_ira',
]);

// Account types shown in the editor dropdown (excludes roth_conversion which is sim-only)
export const EDITOR_ACCOUNT_TYPES: AccountType[] = [
   'brokerage',
   'cash_cd',
   'roth_ira',
   'roth_401k',
   '401k',
   '403b',
   '457b',
   'ira',
   'sep_ira',
   'simple_ira',
];
export type Owner = 'primary' | 'spouse' | 'joint';
export type ConversionStrategy =
   | 'standard'
   | 'irmaa_tier_1'
   | '22_percent_bracket'
   | '24_percent_bracket';
export type SpendingStrategy =
   | 'fixed_dollar'
   | 'percent_of_portfolio'
   | 'guardrails';

export type IncomeKind =
   | 'employment'
   | 'pension'
   | 'rental'
   | 'alimony'
   | 'ss'
   | 'other';

export const INCOME_KIND_LABELS: Record<IncomeKind, string> = {
   employment: 'Employment',
   pension: 'Pension',
   rental: 'Rental',
   alimony: 'Alimony',
   ss: 'Social Security',
   other: 'Other',
};

export type ExcessIncomeRouting = 'brokerage' | 'ira_first' | 'roth_ira_first';

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
   stock_pct?: number;
   tax_drag_override?: number;
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
   kind: IncomeKind;
   amount: number;
   start_age: number;
   end_age: number | null;
   taxable_pct: number;
   cola_rate: number | null;
   owner: Owner;
   pretax_401k: number;
   roth_401k: number;
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
   start_year?: number;
   end_year?: number;
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
   irmaa_limit_tier_1: number;
   social_security: SocialSecurityConfig;
   rmd_start_age: number;
   planned_expenses: PlannedExpense[];
   income_streams: IncomeStream[];
   ss_auto: SSAutoConfig | null;
   retirement_age: number | null;
   excess_income_routing: ExcessIncomeRouting;
   withdrawal_order: WithdrawalCategory[];
}

export interface Portfolio {
   config: SimulationConfig;
   accounts: Account[];
}

export interface AccountWithdrawal {
   account_id: string;
   account_name: string;
   amount: number;
   purpose: 'rmd' | 'spending' | 'conversion' | 'tax';
}

export interface IncomeDetail {
   name: string;
   amount: number;
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
   conversion_tax_from_brokerage: number;
   pretax_withdrawal: number;
   roth_withdrawal: number;
   brokerage_withdrawal: number;
   total_tax: number;
   irmaa_cost: number;
   total_balance: number;
   spending_target: number;
   planned_expense: number;
   total_income: number;
   income_tax: number;
   pretax_balance: number;
   roth_balance: number;
   roth_conversion_balance: number;
   brokerage_balance: number;
   withdrawal_details: AccountWithdrawal[];
   income_details: IncomeDetail[];
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

export interface YearlyResultPercentiles {
   age: number;
   year: number;
   balance_p5: number;
   balance_p25: number;
   balance_median: number;
   balance_p75: number;
   balance_p95: number;
   agi_median: number;
   total_tax_median: number;
   roth_conversion_median: number;
}

export interface MonteCarloResponse {
   num_simulations: number;
   success_rate: number;
   median_simulation: SimulationResult;
   yearly_percentiles: YearlyResultPercentiles[];
   final_balance_p5: number;
   final_balance_p95: number;
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
   finalBalance: number;
   totalTaxes: number;
   totalIrmaa: number;
   totalRothConversions: number;
   successRate?: number;
   withdrawalOrder?: string;
}

export type WithdrawalCategory = 'cash' | 'brokerage' | 'pretax' | 'roth';

export const WITHDRAWAL_CATEGORY_LABELS: Record<WithdrawalCategory, string> = {
   cash: 'Cash/CD',
   brokerage: 'Brokerage',
   pretax: 'IRA/401K',
   roth: 'Roth IRA',
};

export const DEFAULT_WITHDRAWAL_ORDER: WithdrawalCategory[] = [
   'cash',
   'brokerage',
   'pretax',
   'roth',
];

export type ChartEventKind =
   | 'income_employment'
   | 'income_pension'
   | 'income_ss'
   | 'income_rental'
   | 'income_alimony'
   | 'income_other'
   | 'income_end'
   | 'expense_one_time'
   | 'expense_recurring';

export interface ChartEvent {
   year: number;
   label: string;
   tooltip: string;
   type: 'start' | 'end';
   kind: ChartEventKind;
}

export function hasPretaxAccounts(accounts: Account[]): boolean {
   return accounts.some((a) => TAX_CATEGORY_MAP[a.type] === 'pretax');
}
