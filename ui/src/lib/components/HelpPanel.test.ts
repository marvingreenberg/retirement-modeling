import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import { helpState, openHelp, closeHelp } from '$lib/helpState.svelte';

const { default: HelpPanel } = await import('./HelpPanel.svelte');

describe('HelpPanel', () => {
   beforeEach(() => {
      closeHelp();
   });

   it('does not render when helpState.open is false', () => {
      render(HelpPanel);
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
   });

   it('renders when helpState.open is true', () => {
      openHelp('getting-started');
      render(HelpPanel);
      expect(
         screen.getByRole('complementary', { name: 'Help' }),
      ).toBeInTheDocument();
   });

   it('shows all 4 category headings', () => {
      openHelp('getting-started');
      render(HelpPanel);
      expect(screen.getByText('App Basics')).toBeInTheDocument();
      expect(screen.getByText('Your Inputs')).toBeInTheDocument();
      expect(screen.getByText('Rules & Strategies')).toBeInTheDocument();
      expect(screen.getByText('Understanding Results')).toBeInTheDocument();
   });

   it('expands category containing active topic', () => {
      openHelp('spending-strategies');
      render(HelpPanel);
      const nav = screen.getByRole('navigation', { name: 'Help topics' });
      expect(nav.querySelector('button')).not.toBeNull();
      // The "Rules & Strategies" category should be expanded showing topic buttons
      expect(screen.getByText('Withdrawal Order')).toBeInTheDocument();
   });

   it('navigates to a different topic on click', async () => {
      openHelp('getting-started');
      render(HelpPanel);
      await fireEvent.click(screen.getByText('Rules & Strategies'));
      await fireEvent.click(screen.getByText('Spending Strategies'));
      expect(helpState.topic).toBe('spending-strategies');
   });

   it('has close button that closes the panel', async () => {
      openHelp('getting-started');
      render(HelpPanel);
      await fireEvent.click(screen.getByLabelText('Close help'));
      expect(helpState.open).toBe(false);
   });

   it('has maximize and minimize toggle', async () => {
      openHelp('getting-started');
      render(HelpPanel);
      expect(screen.getByLabelText('Maximize help')).toBeInTheDocument();
      await fireEvent.click(screen.getByLabelText('Maximize help'));
      expect(screen.getByLabelText('Minimize help')).toBeInTheDocument();
   });

   it('shows related topics for current topic', () => {
      openHelp('spending-strategies');
      render(HelpPanel);
      expect(screen.getByText('Related Topics')).toBeInTheDocument();
   });
});
