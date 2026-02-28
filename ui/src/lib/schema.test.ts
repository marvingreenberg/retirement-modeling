import { describe, it, expect } from 'vitest';
import {
   portfolioSchema,
   accountSchema,
   simulationConfigSchema,
   socialSecuritySchema,
   guardrailsConfigSchema,
   plannedExpenseSchema,
} from './schema';

const validAccount = {
   id: 'ira_1',
   name: 'Traditional IRA',
   balance: 500000,
   type: 'ira' as const,
   owner: 'primary' as const,
   cost_basis_ratio: 0.0,
   available_at_age: 0,
};

const validSocialSecurity = {
   primary_benefit: 36000,
   primary_start_age: 70,
   spouse_benefit: 18000,
   spouse_start_age: 67,
};

const validConfig = {
   current_age_primary: 65,
   current_age_spouse: 62,
   simulation_years: 30,
   start_year: 2026,
   annual_spend_net: 100000,
   inflation_rate: 0.03,
   investment_growth_rate: 0.06,
   strategy_target: 'irmaa_tier_1' as const,
   spending_strategy: 'fixed_dollar' as const,
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
   social_security: validSocialSecurity,
   rmd_start_age: 73,
   planned_expenses: [],
};

describe('accountSchema', () => {
   it('accepts valid account', () => {
      expect(accountSchema.safeParse(validAccount).success).toBe(true);
   });

   it('applies defaults for optional fields', () => {
      const minimalAccount = {
         id: 'test_1',
         name: 'Test Account',
         balance: 100000,
         type: 'ira' as const,
         owner: 'primary' as const,
      };
      const result = accountSchema.safeParse(minimalAccount);
      expect(result.success).toBe(true);
      if (result.success) {
         expect(result.data.cost_basis_ratio).toBe(0.0);
         expect(result.data.available_at_age).toBe(0);
      }
   });

   it('rejects old pretax/roth account types', () => {
      expect(
         accountSchema.safeParse({ ...validAccount, type: 'pretax' }).success,
      ).toBe(false);
      expect(
         accountSchema.safeParse({ ...validAccount, type: 'roth' }).success,
      ).toBe(false);
   });

   it('accepts all specific account types', () => {
      const types = [
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
      ];
      for (const t of types) {
         expect(
            accountSchema.safeParse({ ...validAccount, type: t }).success,
         ).toBe(true);
      }
   });

   it('rejects negative balance', () => {
      const result = accountSchema.safeParse({
         ...validAccount,
         balance: -100,
      });
      expect(result.success).toBe(false);
   });

   it('rejects invalid account type', () => {
      const result = accountSchema.safeParse({
         ...validAccount,
         type: 'savings',
      });
      expect(result.success).toBe(false);
   });

   it('rejects cost basis ratio > 1', () => {
      const result = accountSchema.safeParse({
         ...validAccount,
         cost_basis_ratio: 1.5,
      });
      expect(result.success).toBe(false);
   });

   it('rejects empty name', () => {
      const result = accountSchema.safeParse({ ...validAccount, name: '' });
      expect(result.success).toBe(false);
   });

   it('accepts stock_pct within range', () => {
      expect(
         accountSchema.safeParse({ ...validAccount, stock_pct: 70 }).success,
      ).toBe(true);
      expect(
         accountSchema.safeParse({ ...validAccount, stock_pct: 0 }).success,
      ).toBe(true);
      expect(
         accountSchema.safeParse({ ...validAccount, stock_pct: 100 }).success,
      ).toBe(true);
   });

   it('rejects stock_pct out of range', () => {
      expect(
         accountSchema.safeParse({ ...validAccount, stock_pct: -1 }).success,
      ).toBe(false);
      expect(
         accountSchema.safeParse({ ...validAccount, stock_pct: 101 }).success,
      ).toBe(false);
   });

   it('accepts account without stock_pct (optional)', () => {
      const { stock_pct: _, ...noStockPct } = {
         ...validAccount,
         stock_pct: 60,
      };
      expect(accountSchema.safeParse(noStockPct).success).toBe(true);
   });

   it('accepts tax_drag_override within range', () => {
      expect(
         accountSchema.safeParse({ ...validAccount, tax_drag_override: 0.005 })
            .success,
      ).toBe(true);
      expect(
         accountSchema.safeParse({ ...validAccount, tax_drag_override: 0 })
            .success,
      ).toBe(true);
   });

   it('rejects tax_drag_override out of range', () => {
      expect(
         accountSchema.safeParse({ ...validAccount, tax_drag_override: -0.01 })
            .success,
      ).toBe(false);
      expect(
         accountSchema.safeParse({ ...validAccount, tax_drag_override: 0.2 })
            .success,
      ).toBe(false);
   });

   it('accepts account without tax_drag_override (optional)', () => {
      expect(accountSchema.safeParse(validAccount).success).toBe(true);
   });
});

describe('socialSecuritySchema', () => {
   it('accepts valid config', () => {
      expect(socialSecuritySchema.safeParse(validSocialSecurity).success).toBe(
         true,
      );
   });

   it('rejects start age below 62', () => {
      const result = socialSecuritySchema.safeParse({
         ...validSocialSecurity,
         primary_start_age: 60,
      });
      expect(result.success).toBe(false);
   });

   it('rejects start age above 70', () => {
      const result = socialSecuritySchema.safeParse({
         ...validSocialSecurity,
         spouse_start_age: 72,
      });
      expect(result.success).toBe(false);
   });
});

describe('guardrailsConfigSchema', () => {
   it('accepts valid config', () => {
      const result = guardrailsConfigSchema.safeParse({
         initial_withdrawal_rate: 0.05,
         floor_percent: 0.8,
         ceiling_percent: 1.2,
         adjustment_percent: 0.1,
      });
      expect(result.success).toBe(true);
   });

   it('rejects floor above 1.0', () => {
      const result = guardrailsConfigSchema.safeParse({
         initial_withdrawal_rate: 0.05,
         floor_percent: 1.5,
         ceiling_percent: 1.2,
         adjustment_percent: 0.1,
      });
      expect(result.success).toBe(false);
   });
});

describe('plannedExpenseSchema', () => {
   it('accepts one-time expense', () => {
      const result = plannedExpenseSchema.safeParse({
         name: 'New roof',
         amount: 15000,
         expense_type: 'one_time',
         year: 2028,
         inflation_adjusted: true,
      });
      expect(result.success).toBe(true);
   });

   it('rejects zero amount', () => {
      const result = plannedExpenseSchema.safeParse({
         name: 'Test',
         amount: 0,
         expense_type: 'one_time',
         inflation_adjusted: false,
      });
      expect(result.success).toBe(false);
   });
});

describe('simulationConfigSchema', () => {
   it('accepts valid config', () => {
      expect(simulationConfigSchema.safeParse(validConfig).success).toBe(true);
   });

   it('applies defaults for optional fields', () => {
      const minimalConfig = {
         current_age_primary: 65,
         current_age_spouse: 62,
         simulation_years: 30,
         start_year: 2026,
         annual_spend_net: 100000,
         inflation_rate: 0.03,
         investment_growth_rate: 0.06,
         strategy_target: 'irmaa_tier_1' as const,
         tax_brackets_federal: [],
         tax_rate_state: 0.0575,
         irmaa_limit_tier_1: 206000,
         social_security: validSocialSecurity,
         rmd_start_age: 73,
      };
      const result = simulationConfigSchema.safeParse(minimalConfig);
      expect(result.success).toBe(true);
      if (result.success) {
         expect(result.data.spending_strategy).toBe('fixed_dollar');
         expect(result.data.withdrawal_rate).toBe(0.04);
         expect(result.data.planned_expenses).toEqual([]);
         expect(result.data.guardrails_config).toEqual({
            initial_withdrawal_rate: 0.05,
            floor_percent: 0.8,
            ceiling_percent: 1.2,
            adjustment_percent: 0.1,
         });
      }
   });

   it('rejects age above 120', () => {
      const result = simulationConfigSchema.safeParse({
         ...validConfig,
         current_age_primary: 150,
      });
      expect(result.success).toBe(false);
   });

   it('rejects simulation years above 100', () => {
      const result = simulationConfigSchema.safeParse({
         ...validConfig,
         simulation_years: 200,
      });
      expect(result.success).toBe(false);
   });

   it('rejects negative annual spend', () => {
      const result = simulationConfigSchema.safeParse({
         ...validConfig,
         annual_spend_net: -5000,
      });
      expect(result.success).toBe(false);
   });

   it('rejects invalid spending strategy', () => {
      const result = simulationConfigSchema.safeParse({
         ...validConfig,
         spending_strategy: 'unknown',
      });
      expect(result.success).toBe(false);
   });

   it('rejects state tax rate above 0.2', () => {
      const result = simulationConfigSchema.safeParse({
         ...validConfig,
         tax_rate_state: 0.5,
      });
      expect(result.success).toBe(false);
   });
});

describe('portfolioSchema', () => {
   it('accepts valid portfolio', () => {
      const result = portfolioSchema.safeParse({
         config: validConfig,
         accounts: [validAccount],
      });
      expect(result.success).toBe(true);
   });

   it('accepts empty accounts (validation deferred to simulation time)', () => {
      const result = portfolioSchema.safeParse({
         config: validConfig,
         accounts: [],
      });
      expect(result.success).toBe(true);
   });

   it('rejects missing config', () => {
      const result = portfolioSchema.safeParse({ accounts: [validAccount] });
      expect(result.success).toBe(false);
   });
});
