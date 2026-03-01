import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import WithdrawalOrderEditor from './WithdrawalOrderEditor.svelte';
import type { Account, WithdrawalCategory } from '$lib/types';

function makeAccount(
   type: Account['type'],
   owner: Account['owner'] = 'primary',
): Account {
   return {
      id: `acc_${type}`,
      name: `${type} account`,
      balance: 100000,
      type,
      owner,
   };
}

describe('WithdrawalOrderEditor', () => {
   it('shows all categories when all account types present', () => {
      const order: WithdrawalCategory[] = [
         'cash',
         'brokerage',
         'pretax',
         'roth',
      ];
      const accounts = [
         makeAccount('cash_cd'),
         makeAccount('brokerage'),
         makeAccount('ira'),
         makeAccount('roth_ira'),
      ];
      render(WithdrawalOrderEditor, { order, accounts });
      expect(screen.getByText('Cash/CD')).toBeInTheDocument();
      expect(screen.getByText('Brokerage')).toBeInTheDocument();
      expect(screen.getByText('IRA/401K')).toBeInTheDocument();
      expect(screen.getByText('Roth IRA')).toBeInTheDocument();
   });

   it('hides pretax category when no pretax accounts', () => {
      const order: WithdrawalCategory[] = [
         'cash',
         'brokerage',
         'pretax',
         'roth',
      ];
      const accounts = [
         makeAccount('cash_cd'),
         makeAccount('brokerage'),
         makeAccount('roth_ira'),
      ];
      render(WithdrawalOrderEditor, { order, accounts });
      expect(screen.getByText('Cash/CD')).toBeInTheDocument();
      expect(screen.getByText('Brokerage')).toBeInTheDocument();
      expect(screen.queryByText('IRA/401K')).not.toBeInTheDocument();
      expect(screen.getByText('Roth IRA')).toBeInTheDocument();
   });

   it('hides roth category when no roth accounts', () => {
      const order: WithdrawalCategory[] = [
         'cash',
         'brokerage',
         'pretax',
         'roth',
      ];
      const accounts = [
         makeAccount('cash_cd'),
         makeAccount('brokerage'),
         makeAccount('ira'),
      ];
      render(WithdrawalOrderEditor, { order, accounts });
      expect(screen.getByText('Cash/CD')).toBeInTheDocument();
      expect(screen.getByText('Brokerage')).toBeInTheDocument();
      expect(screen.getByText('IRA/401K')).toBeInTheDocument();
      expect(screen.queryByText('Roth IRA')).not.toBeInTheDocument();
   });

   it('shows only categories matching account types', () => {
      const order: WithdrawalCategory[] = [
         'cash',
         'brokerage',
         'pretax',
         'roth',
      ];
      const accounts = [makeAccount('brokerage'), makeAccount('roth_ira')];
      render(WithdrawalOrderEditor, { order, accounts });
      expect(screen.queryByText('Cash/CD')).not.toBeInTheDocument();
      expect(screen.getByText('Brokerage')).toBeInTheDocument();
      expect(screen.queryByText('IRA/401K')).not.toBeInTheDocument();
      expect(screen.getByText('Roth IRA')).toBeInTheDocument();
   });

   it('shows all categories when accounts not provided', () => {
      const order: WithdrawalCategory[] = [
         'cash',
         'brokerage',
         'pretax',
         'roth',
      ];
      render(WithdrawalOrderEditor, { order });
      expect(screen.getByText('Cash/CD')).toBeInTheDocument();
      expect(screen.getByText('Brokerage')).toBeInTheDocument();
      expect(screen.getByText('IRA/401K')).toBeInTheDocument();
      expect(screen.getByText('Roth IRA')).toBeInTheDocument();
   });

   it('preserves drag order of displayed categories', () => {
      const order: WithdrawalCategory[] = [
         'roth',
         'brokerage',
         'pretax',
         'cash',
      ];
      const accounts = [
         makeAccount('brokerage'),
         makeAccount('roth_ira'),
         makeAccount('ira'),
         makeAccount('cash_cd'),
      ];
      render(WithdrawalOrderEditor, { order, accounts });
      const items = screen.getAllByRole('listitem');
      expect(items[0]).toHaveTextContent('Roth IRA');
      expect(items[1]).toHaveTextContent('Brokerage');
      expect(items[2]).toHaveTextContent('IRA/401K');
      expect(items[3]).toHaveTextContent('Cash/CD');
   });

   it('renders arrows between categories', () => {
      const order: WithdrawalCategory[] = [
         'cash',
         'brokerage',
         'pretax',
         'roth',
      ];
      const accounts = [
         makeAccount('cash_cd'),
         makeAccount('brokerage'),
         makeAccount('ira'),
         makeAccount('roth_ira'),
      ];
      render(WithdrawalOrderEditor, { order, accounts });
      const arrows = screen.getAllByText('→');
      expect(arrows).toHaveLength(3);
   });
});
