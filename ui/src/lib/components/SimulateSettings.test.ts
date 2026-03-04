import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
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

   it('shows strategy summary when collapsed', () => {
      renderSettings();
      expect(screen.getByText(/Withdrawal Strategy/)).toBeInTheDocument();
   });

   it('shows strategy controls after expanding strategy section', async () => {
      portfolio.value = {
         ...portfolio.value,
         config: { ...portfolio.value.config, spending_strategy: 'guardrails' },
      };
      renderSettings();
      const toggle = screen.getByText(/Withdrawal Strategy/);
      await fireEvent.click(toggle);
      expect(screen.getByText(/Floor Rate %/)).toBeInTheDocument();
      expect(screen.getByText(/Ceiling Rate %/)).toBeInTheDocument();
      expect(screen.getByText('Adjust %')).toBeInTheDocument();
      expect(screen.getByText(/Initial rate:/)).toBeInTheDocument();
   });

   it('shows withdrawal rate after expanding strategy for POP', async () => {
      portfolio.value = {
         ...portfolio.value,
         config: {
            ...portfolio.value.config,
            spending_strategy: 'percent_of_portfolio',
         },
      };
      renderSettings();
      const toggle = screen.getByText(/Withdrawal Strategy/);
      await fireEvent.click(toggle);
      expect(screen.getByText('Withdrawal Rate')).toBeInTheDocument();
   });

   it('strategy section collapsed by default shows summary', () => {
      portfolio.value = {
         ...portfolio.value,
         config: {
            ...portfolio.value.config,
            spending_strategy: 'fixed_dollar',
            annual_spend_net: 140000,
         },
      };
      renderSettings();
      expect(screen.getByText(/Fixed \$140K/)).toBeInTheDocument();
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
      const select = screen.getByRole('combobox');
      expect(select).not.toBeDisabled();
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
      expect(screen.getByRole('combobox')).toBeInTheDocument();
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

   it('resets strategy_target to standard when pretax accounts removed', () => {
      portfolio.value = {
         ...portfolio.value,
         config: { ...portfolio.value.config, strategy_target: 'irmaa_tier_1' },
      };
      renderSettings();
      expect(screen.getByRole('combobox')).toHaveValue('irmaa_tier_1');

      portfolio.value = {
         ...portfolio.value,
         accounts: portfolio.value.accounts.map((a) => ({
            ...a,
            type: 'brokerage' as const,
         })),
      };
      // $effect resets to 'standard'
   });
});
