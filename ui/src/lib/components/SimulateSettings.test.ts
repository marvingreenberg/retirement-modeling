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
      portfolio.set(structuredClone(samplePortfolio));
      validationErrors.set({});
      formTouched.set(false);
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
      expect(screen.getByText(/Growth %/)).toBeInTheDocument();
      expect(screen.getAllByText(/Conversion/).length).toBeGreaterThan(0);
   });

   it('shows strategy summary when collapsed', () => {
      renderSettings();
      expect(screen.getByText(/Withdrawal Strategy/)).toBeInTheDocument();
   });

   it('shows strategy controls after expanding strategy section', async () => {
      portfolio.update((p) => {
         p.config.spending_strategy = 'guardrails';
         return p;
      });
      renderSettings();
      const toggle = screen.getByText(/Withdrawal Strategy/);
      await fireEvent.click(toggle);
      expect(screen.getByText(/Floor Rate %/)).toBeInTheDocument();
      expect(screen.getByText(/Ceiling Rate %/)).toBeInTheDocument();
      expect(screen.getByText('Adjust %')).toBeInTheDocument();
      expect(screen.getByText(/Initial rate:/)).toBeInTheDocument();
   });

   it('shows withdrawal rate after expanding strategy for POP', async () => {
      portfolio.update((p) => {
         p.config.spending_strategy = 'percent_of_portfolio';
         return p;
      });
      renderSettings();
      const toggle = screen.getByText(/Withdrawal Strategy/);
      await fireEvent.click(toggle);
      expect(screen.getByText('Withdrawal Rate')).toBeInTheDocument();
   });

   it('strategy section collapsed by default shows summary', () => {
      portfolio.update((p) => {
         p.config.spending_strategy = 'fixed_dollar';
         p.config.annual_spend_net = 140000;
         return p;
      });
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
      portfolio.update((p) => {
         p.config.current_age_primary = 75;
         p.config.rmd_start_age = 73;
         return p;
      });
      renderSettings();
      const select = screen.getByRole('combobox');
      expect(select).not.toBeDisabled();
   });

   it('shows inline error for inflation input when validation fails', () => {
      portfolio.update((p) => {
         p.config.inflation_rate = -0.01;
         return p;
      });
      formTouched.set(true);
      validationErrors.set({ 'config.inflation_rate': 'Must be >= 0' });
      renderSettings();
      expect(screen.getByText('Must be >= 0')).toBeInTheDocument();
   });

   it('shows inline error for growth input when validation fails', () => {
      formTouched.set(true);
      validationErrors.set({ 'config.investment_growth_rate': 'Invalid rate' });
      renderSettings();
      expect(screen.getByText('Invalid rate')).toBeInTheDocument();
   });

   it('does not show inline errors when form is not touched', () => {
      formTouched.set(false);
      validationErrors.set({ 'config.inflation_rate': 'Must be >= 0' });
      renderSettings();
      expect(screen.queryByText('Must be >= 0')).not.toBeInTheDocument();
   });
});
