import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/svelte';

vi.mock('$app/state', () => ({
   page: { url: new URL('http://localhost/') },
}));

const { default: HelpDrawer } = await import('./HelpDrawer.svelte');

describe('HelpDrawer', () => {
   it('does not render when open is false', () => {
      render(HelpDrawer, { props: { open: false } });
      expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
   });

   it('renders drawer when open is true', () => {
      render(HelpDrawer, { props: { open: true } });
      expect(
         screen.getByRole('complementary', { name: 'Help' }),
      ).toBeInTheDocument();
   });

   it('shows default topic for root route (Spending Strategies)', () => {
      render(HelpDrawer, { props: { open: true } });
      expect(
         screen.getByRole('heading', { name: 'Spending Strategies', level: 3 }),
      ).toBeInTheDocument();
      expect(screen.getByText(/Fixed Dollar/)).toBeInTheDocument();
   });

   it('renders all topic buttons in navigation', () => {
      render(HelpDrawer, { props: { open: true } });
      const nav = screen.getByRole('navigation', { name: 'Help topics' });
      const buttons = within(nav).getAllByRole('button');
      const labels = buttons.map((b) => b.textContent?.trim());
      expect(labels).toContain('Tax Bracket Inflation Indexing');
      expect(labels).toContain('Spending Strategies');
      expect(labels).toContain('Social Security Benefit Formula');
      expect(labels).toContain('Income Stream COLA');
   });

   it('navigates to a different topic on click', async () => {
      render(HelpDrawer, { props: { open: true } });
      const nav = screen.getByRole('navigation', { name: 'Help topics' });
      await fireEvent.click(
         within(nav).getByText('Tax Bracket Inflation Indexing'),
      );
      expect(
         screen.getByRole('heading', {
            name: 'Tax Bracket Inflation Indexing',
            level: 3,
         }),
      ).toBeInTheDocument();
   });

   it('displays related topics at bottom', () => {
      render(HelpDrawer, { props: { open: true } });
      expect(screen.getByText('Related Topics')).toBeInTheDocument();
   });

   it('navigates via related topic link', async () => {
      render(HelpDrawer, { props: { open: true } });
      // Related topics have arrow suffix; click the one for Tax Bracket
      const relatedBtn = screen.getByRole('button', { name: /Tax Bracket.*→/ });
      await fireEvent.click(relatedBtn);
      expect(
         screen.getByRole('heading', {
            name: 'Tax Bracket Inflation Indexing',
            level: 3,
         }),
      ).toBeInTheDocument();
   });

   it('has maximize and close buttons', () => {
      render(HelpDrawer, { props: { open: true } });
      expect(screen.getByLabelText('Maximize help')).toBeInTheDocument();
      expect(screen.getByLabelText('Close help')).toBeInTheDocument();
   });

   it('toggles maximize state', async () => {
      render(HelpDrawer, { props: { open: true } });
      await fireEvent.click(screen.getByLabelText('Maximize help'));
      expect(screen.getByLabelText('Minimize help')).toBeInTheDocument();
      await fireEvent.click(screen.getByLabelText('Minimize help'));
      expect(screen.getByLabelText('Maximize help')).toBeInTheDocument();
   });

   it('shows sidebar navigation in maximized mode', async () => {
      render(HelpDrawer, { props: { open: true } });
      await fireEvent.click(screen.getByLabelText('Maximize help'));
      const nav = screen.getByRole('navigation', { name: 'Help topics' });
      expect(nav.querySelector('ul')).toBeInTheDocument();
   });
});
