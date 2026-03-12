import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import WithdrawalOrderEditor from './WithdrawalOrderEditor.svelte';
import type { WithdrawalCategory } from '$lib/types';

describe('WithdrawalOrderEditor', () => {
   it('renders two radio options', () => {
      const order: WithdrawalCategory[] = [
         'cash',
         'brokerage',
         'pretax',
         'roth',
      ];
      render(WithdrawalOrderEditor, { props: { order } });
      expect(screen.getByLabelText(/Brokerage first/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/IRA\/401k first/i)).toBeInTheDocument();
   });

   it('selects Brokerage first when brokerage is before pretax', () => {
      const order: WithdrawalCategory[] = [
         'cash',
         'brokerage',
         'pretax',
         'roth',
      ];
      render(WithdrawalOrderEditor, { props: { order } });
      const radio = screen.getByLabelText(
         /Brokerage first/i,
      ) as HTMLInputElement;
      expect(radio.checked).toBe(true);
   });

   it('selects IRA/401k first when pretax is before brokerage', () => {
      const order: WithdrawalCategory[] = [
         'cash',
         'pretax',
         'brokerage',
         'roth',
      ];
      render(WithdrawalOrderEditor, { props: { order } });
      const radio = screen.getByLabelText(
         /IRA\/401k first/i,
      ) as HTMLInputElement;
      expect(radio.checked).toBe(true);
   });

   it('shows advisory when Brokerage first is selected', () => {
      const order: WithdrawalCategory[] = [
         'cash',
         'brokerage',
         'pretax',
         'roth',
      ];
      render(WithdrawalOrderEditor, { props: { order } });
      expect(
         screen.getByText(/MAY allow more Roth conversion/i),
      ).toBeInTheDocument();
   });

   it('does not show advisory when IRA/401k first is selected', () => {
      const order: WithdrawalCategory[] = [
         'cash',
         'pretax',
         'brokerage',
         'roth',
      ];
      render(WithdrawalOrderEditor, { props: { order } });
      expect(
         screen.queryByText(/MAY allow more Roth conversion/i),
      ).not.toBeInTheDocument();
   });

   it('changes order when clicking a radio button', async () => {
      const order: WithdrawalCategory[] = [
         'cash',
         'brokerage',
         'pretax',
         'roth',
      ];
      render(WithdrawalOrderEditor, { props: { order } });
      const iraRadio = screen.getByLabelText(/IRA\/401k first/i);
      await fireEvent.click(iraRadio);
      expect((iraRadio as HTMLInputElement).checked).toBe(true);
   });
});
