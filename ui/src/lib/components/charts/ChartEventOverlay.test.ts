import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import type { ChartEvent, YearResult } from '$lib/types';

// jsdom doesn't provide ResizeObserver
globalThis.ResizeObserver ??= class {
   observe() {}
   unobserve() {}
   disconnect() {}
} as unknown as typeof ResizeObserver;

const { default: ChartEventOverlay } =
   await import('./ChartEventOverlay.svelte');

function makeYears(count: number, startYear = 2026): YearResult[] {
   return Array.from({ length: count }, (_, i) => ({
      year: startYear + i,
      age_primary: 65 + i,
      age_spouse: 62 + i,
      agi: 0,
      bracket: '22%',
      rmd: 0,
      surplus: 0,
      roth_conversion: 0,
      conversion_tax: 0,
      conversion_tax_from_brokerage: 0,
      pretax_withdrawal: 0,
      roth_withdrawal: 0,
      brokerage_withdrawal: 0,
      total_tax: 0,
      irmaa_cost: 0,
      irmaa_estimated: false,
      total_balance: 1_000_000 - i * 30_000,
      spending_target: 60_000,
      planned_expense: 0,
      total_income: 0,
      income_tax: 0,
      state_income_tax: 0,
      pretax_balance: 400_000,
      pretax_balance_primary: 400_000,
      pretax_balance_spouse: 0,
      roth_balance: 300_000,
      roth_conversion_balance: 0,
      brokerage_balance: 300_000,
      tax_adjusted_balance: 950_000 - i * 25_000,
      after_tax_value: 950_000 - i * 25_000,
      pretax_401k_deposit: 0,
      roth_401k_deposit: 0,
      brokerage_gains_tax: 0,
      spending_limited: false,
      withdrawal_details: [],
      income_details: [],
   }));
}

function makeChart() {
   return {
      canvas: document.createElement('canvas'),
      scales: {
         x: { getPixelForValue: vi.fn((idx: number) => 50 + idx * 20) },
         y: { getPixelForValue: vi.fn((val: number) => 300 - val / 5000) },
      },
   } as any;
}

const events: ChartEvent[] = [
   {
      year: 2028,
      label: 'Pension $30K',
      tooltip: 'Pension $30K/yr begins',
      type: 'start',
      kind: 'income_pension',
   },
   {
      year: 2031,
      label: 'Job ends',
      tooltip: 'Job $120K/yr ends',
      type: 'end',
      kind: 'income_end',
   },
];

describe('ChartEventOverlay', () => {
   beforeEach(() => {
      vi.restoreAllMocks();
   });

   it('renders correct number of icon buttons', () => {
      const years = makeYears(10);
      render(ChartEventOverlay, {
         props: {
            chart: makeChart(),
            events,
            years,
            getYValue: (i: number) => years[i].total_balance,
         },
      });
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
   });

   it('each button has appropriate aria-label', () => {
      const years = makeYears(10);
      render(ChartEventOverlay, {
         props: {
            chart: makeChart(),
            events,
            years,
            getYValue: (i: number) => years[i].total_balance,
         },
      });
      expect(
         screen.getByLabelText('Pension $30K/yr begins'),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Job $120K/yr ends')).toBeInTheDocument();
   });

   it('hovering shows popover with year/age but no balance', async () => {
      const years = makeYears(10);
      render(ChartEventOverlay, {
         props: {
            chart: makeChart(),
            events,
            years,
            getYValue: (i: number) => years[i].total_balance,
         },
      });
      const btn = screen.getByLabelText('Pension $30K/yr begins');
      await fireEvent.mouseEnter(btn);
      expect(screen.getByText('2028 (Age 67)')).toBeInTheDocument();
      expect(screen.getByText('Pension $30K/yr begins')).toBeInTheDocument();
      expect(screen.queryByText('$940K')).not.toBeInTheDocument();
   });

   it('popover hides on mouseleave', async () => {
      const years = makeYears(10);
      render(ChartEventOverlay, {
         props: {
            chart: makeChart(),
            events,
            years,
            getYValue: (i: number) => years[i].total_balance,
         },
      });
      const btn = screen.getByLabelText('Pension $30K/yr begins');
      await fireEvent.mouseEnter(btn);
      expect(screen.getByText('2028 (Age 67)')).toBeInTheDocument();
      await fireEvent.mouseLeave(btn);
      expect(screen.queryByText('2028 (Age 67)')).not.toBeInTheDocument();
   });

   it('renders no markers when chart is undefined', () => {
      const years = makeYears(10);
      const { container } = render(ChartEventOverlay, {
         props: {
            chart: undefined,
            events,
            years,
            getYValue: (i: number) => years[i].total_balance,
         },
      });
      expect(container.querySelectorAll('button')).toHaveLength(0);
   });

   it('renders no markers when events are empty', () => {
      const years = makeYears(10);
      const { container } = render(ChartEventOverlay, {
         props: {
            chart: makeChart(),
            events: [],
            years,
            getYValue: (i: number) => years[i].total_balance,
         },
      });
      expect(container.querySelectorAll('button')).toHaveLength(0);
   });

   it('staggers same-year events vertically', () => {
      const years = makeYears(10);
      const sameYearEvents: ChartEvent[] = [
         {
            year: 2028,
            label: 'A',
            tooltip: 'Event A',
            type: 'start',
            kind: 'income_pension',
         },
         {
            year: 2028,
            label: 'B',
            tooltip: 'Event B',
            type: 'start',
            kind: 'income_employment',
         },
      ];
      render(ChartEventOverlay, {
         props: {
            chart: makeChart(),
            events: sameYearEvents,
            years,
            getYValue: (i: number) => years[i].total_balance,
         },
      });
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      // Both rendered at same x but different y — match "top: Npx" with optional spaces
      const style0 = buttons[0].getAttribute('style') ?? '';
      const style1 = buttons[1].getAttribute('style') ?? '';
      const topMatch0 = style0.match(/top:\s*([-\d.]+)px/);
      const topMatch1 = style1.match(/top:\s*([-\d.]+)px/);
      expect(topMatch0, `style0="${style0}"`).not.toBeNull();
      expect(topMatch1, `style1="${style1}"`).not.toBeNull();
      expect(Number(topMatch0![1])).not.toBe(Number(topMatch1![1]));
   });
});
