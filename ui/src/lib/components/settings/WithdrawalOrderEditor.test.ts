import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import WithdrawalOrderEditor from './WithdrawalOrderEditor.svelte';
import type { WithdrawalCategory } from '$lib/types';

describe('WithdrawalOrderEditor', () => {
   it('renders a select with both options', () => {
      const order: WithdrawalCategory[] = [
         'cash',
         'brokerage',
         'pretax',
         'roth',
      ];
      render(WithdrawalOrderEditor, { props: { order } });
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('Brokerage first')).toBeInTheDocument();
      expect(screen.getByText('IRA/401k first')).toBeInTheDocument();
   });

   it('selects Brokerage first when brokerage is before pretax', () => {
      const order: WithdrawalCategory[] = [
         'cash',
         'brokerage',
         'pretax',
         'roth',
      ];
      render(WithdrawalOrderEditor, { props: { order } });
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('brokerage');
   });

   it('selects IRA/401k first when pretax is before brokerage', () => {
      const order: WithdrawalCategory[] = [
         'cash',
         'pretax',
         'brokerage',
         'roth',
      ];
      render(WithdrawalOrderEditor, { props: { order } });
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('pretax');
   });

   it('shows Withdrawal Order label with help button', () => {
      const order: WithdrawalCategory[] = [
         'cash',
         'brokerage',
         'pretax',
         'roth',
      ];
      render(WithdrawalOrderEditor, { props: { order } });
      expect(screen.getByText('Withdrawal Order')).toBeInTheDocument();
   });
});
