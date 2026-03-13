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

describe('HelpPanel search', () => {
   beforeEach(() => {
      closeHelp();
   });

   it('shows search input in header', () => {
      openHelp('getting-started');
      render(HelpPanel);
      expect(screen.getByPlaceholderText('Search help...')).toBeInTheDocument();
   });

   it('shows search button with aria-label', () => {
      openHelp('getting-started');
      render(HelpPanel);
      expect(screen.getByLabelText('Search')).toBeInTheDocument();
   });

   it('submitting search replaces accordion with results', async () => {
      openHelp('getting-started');
      render(HelpPanel);
      const input = screen.getByPlaceholderText('Search help...');
      await fireEvent.input(input, { target: { value: 'portfolio' } });
      await fireEvent.submit(input.closest('form')!);
      expect(screen.getByText(/results? for/)).toBeInTheDocument();
      expect(screen.queryByText('App Basics')).not.toBeInTheDocument();
   });

   it('clicking a search result navigates to that topic', async () => {
      openHelp('getting-started');
      render(HelpPanel);
      const input = screen.getByPlaceholderText('Search help...');
      await fireEvent.input(input, { target: { value: 'portfolio' } });
      await fireEvent.submit(input.closest('form')!);
      const results = screen.getByRole('navigation', {
         name: 'Search results',
      });
      const firstLink = results.querySelector('button');
      expect(firstLink).not.toBeNull();
      await fireEvent.click(firstLink!);
      expect(helpState.topic).toBeTruthy();
   });

   it('search bar stays populated after clicking result', async () => {
      openHelp('getting-started');
      render(HelpPanel);
      const input = screen.getByPlaceholderText(
         'Search help...',
      ) as HTMLInputElement;
      await fireEvent.input(input, { target: { value: 'portfolio' } });
      await fireEvent.submit(input.closest('form')!);
      const results = screen.getByRole('navigation', {
         name: 'Search results',
      });
      const firstLink = results.querySelector('button');
      await fireEvent.click(firstLink!);
      expect(input.value).toBe('portfolio');
   });

   it('clear button restores accordion nav', async () => {
      openHelp('getting-started');
      render(HelpPanel);
      const input = screen.getByPlaceholderText('Search help...');
      await fireEvent.input(input, { target: { value: 'portfolio' } });
      await fireEvent.submit(input.closest('form')!);
      expect(screen.queryByText('App Basics')).not.toBeInTheDocument();
      await fireEvent.click(screen.getByLabelText('Clear search'));
      expect(screen.getByText('App Basics')).toBeInTheDocument();
   });

   it('shows "No results" for nonsense query', async () => {
      openHelp('getting-started');
      render(HelpPanel);
      const input = screen.getByPlaceholderText('Search help...');
      await fireEvent.input(input, { target: { value: 'xyzzyplugh' } });
      await fireEvent.submit(input.closest('form')!);
      expect(screen.getByText(/no results/i)).toBeInTheDocument();
   });

   it('highlights search terms in content', async () => {
      openHelp('getting-started');
      render(HelpPanel);
      const input = screen.getByPlaceholderText('Search help...');
      await fireEvent.input(input, { target: { value: 'portfolio' } });
      await fireEvent.submit(input.closest('form')!);
      const content = screen.getByRole('complementary', { name: 'Help' });
      expect(content.querySelector('mark')).not.toBeNull();
   });
});
