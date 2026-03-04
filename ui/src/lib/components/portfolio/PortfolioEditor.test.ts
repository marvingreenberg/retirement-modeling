import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import {
   portfolio,
   samplePortfolio,
   validationErrors,
   formTouched,
   snapshot,
} from '$lib/stores';

const { default: PortfolioEditor } = await import('./PortfolioEditor.svelte');

describe('PortfolioEditor', () => {
   beforeEach(() => {
      portfolio.value = structuredClone(samplePortfolio);
      validationErrors.value = {};
      formTouched.value = false;
   });

   it('shows annual spending label in budget section', () => {
      render(PortfolioEditor);
      expect(screen.getByText(/Annual Spending/)).toBeInTheDocument();
   });

   it('shows monthly equivalent next to annual input', () => {
      render(PortfolioEditor);
      expect(screen.getByText(/\$5,417\/mo/)).toBeInTheDocument();
   });

   it('shows collapsible sections for accounts, budget, income', () => {
      render(PortfolioEditor);
      expect(screen.getByText('Accounts')).toBeInTheDocument();
      expect(screen.getByText('Budget')).toBeInTheDocument();
      expect(screen.getByText('Income')).toBeInTheDocument();
   });

   it('filters config input errors from validation banner', () => {
      formTouched.value = true;
      const p1 = structuredClone(snapshot(portfolio.value));
      p1.config.inflation_rate = -1;
      p1.accounts[0].balance = -1;
      portfolio.value = p1;
      render(PortfolioEditor);
      // inflation_rate error should be filtered (shown inline in SimulateSettings instead)
      const items = screen.getAllByRole('listitem');
      const texts = items.map((li) => li.textContent ?? '');
      expect(texts.some((t) => t.includes('inflation'))).toBe(false);
      // account balance error should show in the banner
      expect(texts.some((t) => t.includes('Balance'))).toBe(true);
   });

   it('does not show validation errors when form is not touched', () => {
      formTouched.value = false;
      validationErrors.value = { 'accounts.0.balance': 'Balance required' };
      render(PortfolioEditor);
      expect(screen.queryByText('Balance required')).not.toBeInTheDocument();
   });

   it('shows warning when no accounts exist', () => {
      portfolio.value = { ...portfolio.value, accounts: [] };
      render(PortfolioEditor);
      expect(
         screen.getByText(/Add an account to allow simulation/),
      ).toBeInTheDocument();
   });

   it('shows warning when budget is zero but accounts exist', () => {
      portfolio.value = {
         ...portfolio.value,
         config: { ...portfolio.value.config, annual_spend_net: 0 },
      };
      render(PortfolioEditor);
      expect(
         screen.getByText(/Define expected annual spending/),
      ).toBeInTheDocument();
   });

   it('renders SpendingEditor inside budget section', () => {
      render(PortfolioEditor);
      expect(screen.getByText('+ Add Expense')).toBeInTheDocument();
   });

   it('shows accounts collapsed summary with total', () => {
      render(PortfolioEditor);
      expect(screen.getByText(/Total \$370K/)).toBeInTheDocument();
   });

   it('shows "No accounts" summary when accounts empty', () => {
      portfolio.value = { ...portfolio.value, accounts: [] };
      render(PortfolioEditor);
      expect(screen.getByText(/No accounts/)).toBeInTheDocument();
   });

   it('shows budget collapsed summary with annual spending', () => {
      render(PortfolioEditor);
      expect(screen.getByText(/\$65,000\/yr/)).toBeInTheDocument();
   });

   it('shows budget summary with expense count', () => {
      render(PortfolioEditor);
      expect(screen.getByText(/\+ 1 expenses/)).toBeInTheDocument();
   });

   it('shows income collapsed summary with SS and pension', () => {
      render(PortfolioEditor);
      expect(screen.getByText(/SS at 67/)).toBeInTheDocument();
      expect(screen.getByText(/Pension \$22K\/yr/)).toBeInTheDocument();
   });

   it('shows "None configured" when no income', () => {
      const p2 = structuredClone(snapshot(portfolio.value));
      p2.config.social_security.primary_benefit = 0;
      p2.config.ss_auto = null;
      p2.config.income_streams = [];
      portfolio.value = p2;
      render(PortfolioEditor);
      expect(screen.getByText(/None configured/)).toBeInTheDocument();
   });
});
