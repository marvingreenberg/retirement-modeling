import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import {
   samplePortfolio,
   sampleScenarios,
   defaultPortfolio,
   simulationResults,
   numSimulations,
   portfolio,
   profile,
   randomizeForDemo,
   snapshot,
} from './stores';
import { portfolioSchema } from './schema';

describe('sampleScenarios', () => {
   it('has three named scenarios', () => {
      const names = Object.keys(sampleScenarios);
      expect(names).toContain('Moderate Couple');
      expect(names).toContain('Comfortable Single');
      expect(names).toContain('Wealthier Couple');
      expect(names).toHaveLength(3);
   });

   it.each(Object.entries(sampleScenarios))(
      '%s passes Zod validation',
      (_name, scenario) => {
         const result = portfolioSchema.safeParse(scenario.portfolio);
         expect(result.success).toBe(true);
      },
   );

   it.each(Object.entries(sampleScenarios))(
      '%s has profile with primaryName',
      (_name, scenario) => {
         expect(scenario.profile.primaryName.length).toBeGreaterThan(0);
      },
   );

   it('retirement accounts have available_at_age >= 60', () => {
      for (const [, scenario] of Object.entries(sampleScenarios)) {
         for (const acct of scenario.portfolio.accounts) {
            if (
               [
                  '401k',
                  '403b',
                  '457b',
                  'ira',
                  'sep_ira',
                  'simple_ira',
                  'roth_ira',
                  'roth_401k',
               ].includes(acct.type)
            ) {
               expect(acct.available_at_age).toBeGreaterThanOrEqual(60);
            }
         }
      }
   });

   it('IRA-type accounts are not joint-owned', () => {
      for (const [, scenario] of Object.entries(sampleScenarios)) {
         for (const acct of scenario.portfolio.accounts) {
            if (
               [
                  '401k',
                  '403b',
                  '457b',
                  'ira',
                  'sep_ira',
                  'simple_ira',
                  'roth_ira',
                  'roth_401k',
               ].includes(acct.type)
            ) {
               expect(acct.owner).not.toBe('joint');
            }
         }
      }
   });
});

describe('samplePortfolio (backward compat)', () => {
   it('passes Zod validation', () => {
      const result = portfolioSchema.safeParse(samplePortfolio);
      expect(result.success).toBe(true);
   });

   it('has accounts with different types', () => {
      const types = new Set(samplePortfolio.accounts.map((a) => a.type));
      expect(types.size).toBeGreaterThanOrEqual(2);
   });

   it('has social security configured', () => {
      expect(
         samplePortfolio.config.social_security.primary_benefit,
      ).toBeGreaterThan(0);
   });

   it('has planned expenses', () => {
      expect(
         samplePortfolio.config.planned_expenses.length,
      ).toBeGreaterThanOrEqual(1);
   });

   it('has ss_auto configured', () => {
      expect(samplePortfolio.config.ss_auto).not.toBeNull();
      expect(
         samplePortfolio.config.ss_auto!.primary_fra_amount,
      ).toBeGreaterThan(0);
   });

   it('has income streams', () => {
      expect(
         samplePortfolio.config.income_streams.length,
      ).toBeGreaterThanOrEqual(1);
   });
});

describe('Moderate Couple scenario', () => {
   const scenario = sampleScenarios['Moderate Couple'];

   it('has two-person household', () => {
      expect(scenario.portfolio.config.current_age_primary).toBe(65);
      expect(scenario.portfolio.config.current_age_spouse).toBe(61);
   });

   it('has spouse benefit configured', () => {
      expect(
         scenario.portfolio.config.social_security.spouse_benefit,
      ).toBeGreaterThan(0);
   });
});

describe('Comfortable Single scenario', () => {
   const scenario = sampleScenarios['Comfortable Single'];

   it('is a single-person household', () => {
      expect(scenario.portfolio.config.current_age_primary).toBe(63);
      expect(scenario.portfolio.config.current_age_spouse).toBe(0);
      expect(scenario.profile.spouseName).toBe('');
   });

   it('has rental and alimony income', () => {
      const names = scenario.portfolio.config.income_streams.map((s) => s.name);
      expect(names).toContain('Alimony');
      expect(names).toContain('Rental income');
   });
});

describe('Wealthier Couple scenario', () => {
   const scenario = sampleScenarios['Wealthier Couple'];

   it('has named primary and spouse', () => {
      expect(scenario.profile.primaryName).toBe('Sue');
      expect(scenario.profile.spouseName).toBe('Steve');
   });

   it('has accounts for both spouses', () => {
      const owners = new Set(scenario.portfolio.accounts.map((a) => a.owner));
      expect(owners).toContain('primary');
      expect(owners).toContain('spouse');
   });

   it('has Roth IRA for primary', () => {
      const rothAcct = scenario.portfolio.accounts.find(
         (a) => a.type === 'roth_ira',
      );
      expect(rothAcct).toBeDefined();
      expect(rothAcct!.owner).toBe('primary');
   });
});

describe('defaultPortfolio', () => {
   it('starts with empty state (no accounts, age 0)', () => {
      expect(defaultPortfolio.accounts).toHaveLength(0);
      expect(defaultPortfolio.config.current_age_primary).toBe(0);
      expect(defaultPortfolio.config.annual_spend_net).toBe(0);
      expect(defaultPortfolio.config.social_security.primary_benefit).toBe(0);
   });

   it('has sensible defaults for simulation params', () => {
      expect(defaultPortfolio.config.inflation_rate).toBeDefined();
      expect(defaultPortfolio.config.investment_growth_rate).toBeDefined();
      expect(defaultPortfolio.config.spending_strategy).toBeDefined();
      expect(defaultPortfolio.config.strategy_target).toBeDefined();
   });

   it('has empty income streams and null ss_auto', () => {
      expect(defaultPortfolio.config.income_streams).toEqual([]);
      expect(defaultPortfolio.config.ss_auto).toBeNull();
   });
});

describe('simulationResults store', () => {
   it('starts with null results', () => {
      const state = get(simulationResults);
      expect(state.singleResult).toBeNull();
      expect(state.mcResult).toBeNull();
   });

   it('can store single run results', () => {
      const mockResult = {
         singleResult: {
            result: {
               strategy: 'standard' as const,
               spending_strategy: 'fixed_dollar' as const,
               years: [],
            },
            summary: {
               final_balance: 100,
               total_taxes_paid: 10,
               total_irmaa_paid: 0,
               total_roth_conversions: 5,
               simulation_years: 1,
               strategy: 'standard',
               spending_strategy: 'fixed_dollar',
            },
         },
         mcResult: null,
      };
      simulationResults.set(mockResult);
      const state = get(simulationResults);
      expect(state.singleResult?.summary.final_balance).toBe(100);
      simulationResults.set({ singleResult: null, mcResult: null });
   });
});

describe('numSimulations store', () => {
   it('defaults to 1000', () => {
      expect(get(numSimulations)).toBe(1000);
   });
});

describe('randomizeForDemo', () => {
   it('scales account balances between 0.3x and 0.7x and rounds to $1000', () => {
      portfolio.set(structuredClone(samplePortfolio));
      const original = snapshot(get(portfolio));
      randomizeForDemo();
      const updated = get(portfolio);

      for (let i = 0; i < updated.accounts.length; i++) {
         const orig = original.accounts[i].balance;
         const rand = updated.accounts[i].balance;
         expect(rand).toBeGreaterThanOrEqual(
            Math.round((orig * 0.3) / 1000) * 1000 - 1000,
         );
         expect(rand).toBeLessThanOrEqual(
            Math.round((orig * 0.7) / 1000) * 1000 + 1000,
         );
         expect(rand % 1000).toBe(0);
      }
   });

   it('replaces profile names with placeholders', () => {
      profile.set({ primaryName: 'John', spouseName: 'Jane' });
      portfolio.set(structuredClone(samplePortfolio));
      randomizeForDemo();
      const p = get(profile);
      expect(p.primaryName).toBe('Alex');
      expect(p.spouseName).toBe('Sam');
   });
});
