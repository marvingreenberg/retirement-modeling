import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { tick } from 'svelte';
import {
   portfolio,
   samplePortfolio,
   validationErrors,
   formTouched,
} from '$lib/stores';

const { default: SimulateSettings } = await import('./SimulateSettings.svelte');

describe('SimulateSettings', () => {
   beforeEach(() => {
      portfolio.value = structuredClone(samplePortfolio);
      validationErrors.value = {};
      formTouched.value = false;
   });

   function renderSettings(overrides: Record<string, any> = {}) {
      return render(SimulateSettings, {
         onrun: vi.fn(),
         loading: false,
         ...overrides,
      });
   }

   it('shows primary inputs by default', () => {
      renderSettings();
      expect(screen.getByText(/Inflation %/)).toBeInTheDocument();
      expect(
         screen.getByRole('checkbox', { name: /conservative growth/i }),
      ).toBeInTheDocument();
      expect(screen.getAllByText(/Conversion/).length).toBeGreaterThan(0);
   });

   it('shows strategy selector always visible', () => {
      renderSettings();
      expect(screen.getByText(/Strategy/)).toBeInTheDocument();
      const selects = screen.getAllByRole('combobox');
      const strategySelect = selects.find((s) =>
         Array.from(s.querySelectorAll('option')).some(
            (o) => o.value === 'fixed_dollar',
         ),
      );
      expect(strategySelect).toBeInTheDocument();
   });

   it('shows fixed dollar diagnostic for fixed_dollar strategy', () => {
      portfolio.value = {
         ...portfolio.value,
         config: {
            ...portfolio.value.config,
            spending_strategy: 'fixed_dollar',
            annual_spend_net: 200000,
         },
      };
      renderSettings();
      expect(screen.getByText(/Fixed \$200,000/)).toBeInTheDocument();
   });

   it('shows guardrails controls without needing to expand', () => {
      portfolio.value = {
         ...portfolio.value,
         config: { ...portfolio.value.config, spending_strategy: 'guardrails' },
      };
      renderSettings();
      expect(screen.getByText(/Floor Rate %/)).toBeInTheDocument();
      expect(screen.getByText(/Ceiling Rate %/)).toBeInTheDocument();
      expect(screen.getByText('Adjust %')).toBeInTheDocument();
      expect(screen.getByText(/Initial rate:/)).toBeInTheDocument();
   });

   it('shows withdrawal rate for percent_of_portfolio without needing to expand', () => {
      portfolio.value = {
         ...portfolio.value,
         config: {
            ...portfolio.value.config,
            spending_strategy: 'percent_of_portfolio',
         },
      };
      renderSettings();
      expect(screen.getByText('Withdrawal Rate')).toBeInTheDocument();
   });

   it('does not show run mode radio buttons', () => {
      renderSettings();
      expect(screen.queryByText('Single run')).not.toBeInTheDocument();
      expect(screen.queryByText('Monte Carlo')).not.toBeInTheDocument();
   });

   it('shows Simulate button', () => {
      renderSettings();
      expect(
         screen.getByRole('button', { name: 'Run simulation' }),
      ).toBeInTheDocument();
   });

   it('conversion dropdown is enabled regardless of age', () => {
      portfolio.value = {
         ...portfolio.value,
         config: {
            ...portfolio.value.config,
            current_age_primary: 75,
            rmd_start_age: 73,
         },
      };
      renderSettings();
      const selects = screen.getAllByRole('combobox');
      const conversionSelect = selects.find((s) =>
         Array.from(s.querySelectorAll('option')).some(
            (o) => o.value === 'irmaa_tier_1',
         ),
      );
      expect(conversionSelect).toBeDefined();
      expect(conversionSelect).not.toBeDisabled();
   });

   it('shows inline error for inflation input when validation fails', () => {
      portfolio.value = {
         ...portfolio.value,
         config: { ...portfolio.value.config, inflation_rate: -0.01 },
      };
      formTouched.value = true;
      validationErrors.value = { 'config.inflation_rate': 'Must be >= 0' };
      renderSettings();
      expect(screen.getByText('Must be >= 0')).toBeInTheDocument();
   });

   it('renders conservative growth checkbox', () => {
      renderSettings();
      expect(
         screen.getByRole('checkbox', { name: /conservative growth/i }),
      ).toBeInTheDocument();
   });

   it('does not show inline errors when form is not touched', () => {
      formTouched.value = false;
      validationErrors.value = { 'config.inflation_rate': 'Must be >= 0' };
      renderSettings();
      expect(screen.queryByText('Must be >= 0')).not.toBeInTheDocument();
   });

   it('shows conversion dropdown when pretax accounts exist', () => {
      renderSettings();
      expect(screen.getAllByText(/Conversion/).length).toBeGreaterThan(0);
   });

   it('hides conversion dropdown when no pretax accounts', () => {
      portfolio.value = {
         ...portfolio.value,
         accounts: portfolio.value.accounts.map((a) => ({
            ...a,
            type: 'brokerage' as const,
         })),
      };
      renderSettings();
      expect(screen.queryByText(/Conversion/)).not.toBeInTheDocument();
   });

   it('resets strategy_target to standard when pretax accounts removed', async () => {
      portfolio.value = {
         ...portfolio.value,
         config: { ...portfolio.value.config, strategy_target: 'irmaa_tier_1' },
      };
      renderSettings();
      // Sanity: with pretax accounts present, the conversion select shows
      // the current strategy.
      const initialSelects = screen.getAllByRole('combobox');
      const initialConversionSelect = initialSelects.find((s) =>
         Array.from(s.querySelectorAll('option')).some(
            (o) => o.value === 'irmaa_tier_1',
         ),
      );
      expect(initialConversionSelect).toHaveValue('irmaa_tier_1');

      // Remove all pretax accounts by retyping them as brokerage. The
      // SimulateSettings $effect should observe the change and reset
      // strategy_target back to 'standard'. The conversion select then
      // disappears entirely (it lives behind {#if showConversion}).
      portfolio.value = {
         ...portfolio.value,
         accounts: portfolio.value.accounts.map((a) => ({
            ...a,
            type: 'brokerage' as const,
         })),
      };
      await tick();

      expect(portfolio.value.config.strategy_target).toBe('standard');
      // No combobox containing the irmaa option should remain.
      const remainingSelects = screen.queryAllByRole('combobox');
      const remainingConversionSelect = remainingSelects.find((s) =>
         Array.from(s.querySelectorAll('option')).some(
            (o) => o.value === 'irmaa_tier_1',
         ),
      );
      expect(remainingConversionSelect).toBeUndefined();
   });
});
