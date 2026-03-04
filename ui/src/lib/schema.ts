import { z } from 'zod';

export const accountTypeSchema = z.enum([
   'brokerage',
   'cash_cd',
   'roth_ira',
   'roth_401k',
   'roth_conversion',
   '401k',
   '403b',
   '457b',
   'ira',
   'sep_ira',
   'simple_ira',
]);
export const ownerSchema = z.enum(['primary', 'spouse', 'joint']);
export const conversionStrategySchema = z.enum([
   'standard',
   'irmaa_tier_1',
   '22_percent_bracket',
   '24_percent_bracket',
]);
export const spendingStrategySchema = z.enum([
   'fixed_dollar',
   'percent_of_portfolio',
   'guardrails',
]);

export const incomeKindSchema = z.enum([
   'employment',
   'pension',
   'rental',
   'alimony',
   'ss',
   'other',
]);

export const excessIncomeRoutingSchema = z.enum([
   'brokerage',
   'ira_first',
   'roth_ira_first',
]);

export const withdrawalCategorySchema = z.enum([
   'cash',
   'brokerage',
   'pretax',
   'roth',
]);

export const guardrailsConfigSchema = z.object({
   initial_withdrawal_rate: z.number().min(0.01).max(0.15).default(0.05),
   floor_percent: z.number().min(0.5).max(1.0).default(0.8),
   ceiling_percent: z.number().min(1.0).max(2.0).default(1.2),
   adjustment_percent: z.number().min(0.01).max(0.25).default(0.1),
});

export const accountSchema = z.object({
   id: z.string().min(1),
   name: z.string().min(1),
   balance: z.number().min(0),
   type: accountTypeSchema,
   owner: ownerSchema,
   cost_basis_ratio: z.number().min(0).max(1).default(0.0),
   available_at_age: z.number().int().min(0).default(0),
   stock_pct: z.number().min(0).max(100).optional(),
   tax_drag_override: z.number().min(0).max(0.1).optional(),
});

export const socialSecuritySchema = z.object({
   primary_benefit: z.number().min(0),
   primary_start_age: z.number().int().min(62).max(70),
   spouse_benefit: z.number().min(0),
   spouse_start_age: z.number().int().min(62).max(70),
});

export const taxBracketSchema = z.object({
   limit: z.number(),
   rate: z.number().min(0).max(1),
});

export const incomeStreamSchema = z.object({
   name: z.string().min(1),
   kind: incomeKindSchema.default('other'),
   amount: z.number().min(0),
   start_age: z.number().int().min(0),
   end_age: z.number().int().min(0).nullable().default(null),
   taxable_pct: z.number().min(0).max(1).default(1.0),
   cola_rate: z.number().min(0).max(0.2).nullable().default(null),
   owner: ownerSchema.default('primary'),
   pretax_401k: z.number().min(0).default(0),
   roth_401k: z.number().min(0).default(0),
});

export const ssAutoConfigSchema = z.object({
   primary_fra_amount: z.number().min(0),
   primary_start_age: z.number().int().min(62).max(70),
   spouse_fra_amount: z.number().min(0).nullable().default(null),
   spouse_start_age: z.number().int().min(62).max(70).nullable().default(null),
   fra_age: z.number().int().min(62).max(70).default(67),
   cola_rate: z.number().min(0).max(0.2).default(0.025),
});

export const plannedExpenseSchema = z.object({
   name: z.string().min(1),
   amount: z.number().positive(),
   expense_type: z.enum(['one_time', 'recurring']),
   year: z.number().int().min(2000).max(2100).optional(),
   start_year: z.number().int().min(2000).max(2100).optional(),
   end_year: z.number().int().min(2000).max(2100).optional(),
   inflation_adjusted: z.boolean(),
});

export const simulationConfigSchema = z
   .object({
      current_age_primary: z.number().int().min(0).max(120),
      current_age_spouse: z.number().int().min(0).max(120),
      simulation_years: z.number().int().min(1).max(100),
      start_year: z.number().int().min(2000).max(2100),
      annual_spend_net: z.number().min(0),
      inflation_rate: z.number().min(0).max(0.5),
      conservative_growth: z.boolean(),
      strategy_target: conversionStrategySchema,
      spending_strategy: spendingStrategySchema.default('fixed_dollar'),
      withdrawal_rate: z.number().min(0.01).max(0.15).default(0.04),
      guardrails_config: guardrailsConfigSchema.default({
         initial_withdrawal_rate: 0.05,
         floor_percent: 0.8,
         ceiling_percent: 1.2,
         adjustment_percent: 0.1,
      }),
      tax_brackets_federal: z.array(taxBracketSchema),
      tax_rate_state: z.number().min(0).max(0.2),
      irmaa_limit_tier_1: z.number().positive(),
      social_security: socialSecuritySchema,
      rmd_start_age: z.number().int().min(70).max(80),
      planned_expenses: z.array(plannedExpenseSchema).default([]),
      income_streams: z.array(incomeStreamSchema).default([]),
      ss_auto: ssAutoConfigSchema.nullable().default(null),
      retirement_age: z.number().int().min(0).max(120).nullable().default(null),
      excess_income_routing: excessIncomeRoutingSchema.default('brokerage'),
      withdrawal_order: z
         .array(withdrawalCategorySchema)
         .length(4)
         .default(['cash', 'brokerage', 'pretax', 'roth']),
   })
   .strip();

export const portfolioSchema = z.object({
   config: simulationConfigSchema,
   accounts: z.array(accountSchema),
});

export const userProfileSchema = z.object({
   primaryName: z.string().default(''),
   spouseName: z.string().default(''),
   avatarSvg: z.string().optional(),
});

export const saveFileSchema = z.object({
   config: simulationConfigSchema,
   accounts: z.array(accountSchema),
   profile: userProfileSchema.optional(),
});
