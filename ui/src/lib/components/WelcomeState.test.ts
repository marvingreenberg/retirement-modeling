import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { portfolio, samplePortfolio, defaultPortfolio } from '$lib/stores';

const { default: WelcomeState } = await import('./WelcomeState.svelte');

describe('WelcomeState', () => {
   beforeEach(() => {
      portfolio.set(structuredClone(defaultPortfolio));
   });

   it('renders heading', () => {
      render(WelcomeState);
      expect(screen.getByText('Ready to simulate')).toBeInTheDocument();
   });

   it('renders guidance text', () => {
      render(WelcomeState);
      expect(
         screen.getByText(/add your accounts and income/i),
      ).toBeInTheDocument();
   });

   it('shows portfolio summary when accounts exist', () => {
      portfolio.set(structuredClone(samplePortfolio));
      render(WelcomeState);
      expect(screen.getByText('Total Balance')).toBeInTheDocument();
      expect(screen.getByText('Annual Spending')).toBeInTheDocument();
   });

   it('hides portfolio summary when no accounts', () => {
      render(WelcomeState);
      expect(screen.queryByText('Total Balance')).not.toBeInTheDocument();
   });

   it('shows coverage estimate when spending > 0', () => {
      portfolio.set(structuredClone(samplePortfolio));
      render(WelcomeState);
      expect(screen.getByText('Est. Coverage')).toBeInTheDocument();
      expect(screen.getByText(/~\d+ years/)).toBeInTheDocument();
   });
});
