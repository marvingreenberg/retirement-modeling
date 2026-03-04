import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import HelpButton from './HelpButton.svelte';
import { helpState } from '$lib/helpState.svelte';

describe('HelpButton', () => {
   beforeEach(() => {
      helpState.open = false;
      helpState.topic = 'getting-started';
      helpState.anchor = undefined;
   });

   it('renders a button with question mark label', () => {
      render(HelpButton, { props: { topic: 'spending-strategies' } });
      expect(screen.getByRole('button', { name: 'Help' })).toBeInTheDocument();
   });

   it('opens help to the specified topic on click', async () => {
      render(HelpButton, { props: { topic: 'spending-strategies' } });
      await fireEvent.click(screen.getByRole('button', { name: 'Help' }));
      expect(helpState.open).toBe(true);
      expect(helpState.topic).toBe('spending-strategies');
      expect(helpState.anchor).toBeUndefined();
   });

   it('opens help with anchor when provided', async () => {
      render(HelpButton, {
         props: { topic: 'simulation-parameters', anchor: 'growth-rate' },
      });
      await fireEvent.click(screen.getByRole('button', { name: 'Help' }));
      expect(helpState.open).toBe(true);
      expect(helpState.topic).toBe('simulation-parameters');
      expect(helpState.anchor).toBe('growth-rate');
   });
});
