import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import TaxDragCalculator from './TaxDragCalculator.svelte';

describe('TaxDragCalculator', () => {
   const baseProps = {
      balance: 400000,
      stateTaxRate: 0.05,
      federalBrackets: [] as { limit: number; rate: number }[],
   };

   it('renders calculator icon button', () => {
      render(TaxDragCalculator, baseProps);
      expect(
         screen.getByRole('button', { name: 'Calculate tax drag' }),
      ).toBeInTheDocument();
   });

   it('opens popover on click', async () => {
      render(TaxDragCalculator, baseProps);
      await fireEvent.click(
         screen.getByRole('button', { name: 'Calculate tax drag' }),
      );
      expect(screen.getByLabelText('Total Dividends')).toBeInTheDocument();
      expect(screen.getByLabelText('Total Interest')).toBeInTheDocument();
   });

   it('computes drag from dividend and interest inputs', async () => {
      render(TaxDragCalculator, baseProps);
      await fireEvent.click(
         screen.getByRole('button', { name: 'Calculate tax drag' }),
      );
      const divInput = screen.getByLabelText('Total Dividends');
      const intInput = screen.getByLabelText('Total Interest');
      await fireEvent.input(divInput, { target: { value: '6000' } });
      await fireEvent.input(intInput, { target: { value: '4000' } });
      // Div tax: 6000 * 0.15 = 900; Int tax: 4000 * (0.22 + 0.05) = 1080
      // Total: 1980 / 400000 = 0.00495 = 0.50%
      expect(screen.getByText(/0\.50%/)).toBeInTheDocument();
   });

   it('calls onapply with computed drag on Apply click', async () => {
      const onapply = vi.fn();
      render(TaxDragCalculator, { ...baseProps, onapply });
      await fireEvent.click(
         screen.getByRole('button', { name: 'Calculate tax drag' }),
      );
      await fireEvent.input(screen.getByLabelText('Total Dividends'), {
         target: { value: '6000' },
      });
      await fireEvent.input(screen.getByLabelText('Total Interest'), {
         target: { value: '4000' },
      });
      await fireEvent.click(screen.getByText('Apply'));
      expect(onapply).toHaveBeenCalledWith(expect.closeTo(0.00495, 4));
   });

   it('uses federal bracket rate when provided', async () => {
      const props = {
         ...baseProps,
         federalBrackets: [
            { limit: 23200, rate: 0.1 },
            { limit: 94300, rate: 0.12 },
         ],
      };
      render(TaxDragCalculator, props);
      await fireEvent.click(
         screen.getByRole('button', { name: 'Calculate tax drag' }),
      );
      await fireEvent.input(screen.getByLabelText('Total Interest'), {
         target: { value: '4000' },
      });
      // Int tax: 4000 * (0.12 + 0.05) = 680; drag = 680/400000 = 0.0017
      expect(screen.getByText(/0\.17%/)).toBeInTheDocument();
   });
});
