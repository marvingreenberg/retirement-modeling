<script lang="ts">
   import { Chart } from 'chart.js';
   import type { YearResult, ChartEvent } from '$lib/types';
   import type { DataMapper } from '$lib/presentValue';
   import ChartBase, { type ChartAnnotations } from './ChartBase.svelte';
   import { formatTick } from './formatTick';

   function totalAvailableForYear(y: YearResult): number {
      return y.spending_target + y.surplus + y.total_tax + y.irmaa_cost;
   }

   function hasNonZero(data: number[]): boolean {
      return data.some((v) => v > 0);
   }

   // Build a year/ages title that shows both ages older-first when there's
   // a spouse. Mirrors the BalanceChart helper.
   //
   // Spouse detection uses years[0].age_spouse rather than yr.age_spouse:
   // the simulator increments age_spouse year-by-year from
   // current_age_spouse, so for a single-person portfolio (where
   // current_age_spouse = 0) the value drifts up to whatever the
   // simulation length is — making per-year checks falsely positive.
   // years[0].age_spouse is 0 IFF the portfolio has no spouse.
   function yearAgesTitle(yr: YearResult): string {
      const hasSpouse = (years[0]?.age_spouse ?? 0) > 0;
      if (hasSpouse) {
         const older = Math.max(yr.age_primary, yr.age_spouse);
         const younger = Math.min(yr.age_primary, yr.age_spouse);
         return `${yr.year} (Ages ${older}, ${younger})`;
      }
      return `${yr.year} (Age ${yr.age_primary})`;
   }

   let {
      years,
      retirementAge = null,
      startAge = 0,
      startYear = 0,
      events = [],
      desiredSpending = [],
      compact = false,
   }: {
      years: YearResult[];
      retirementAge?: number | null;
      startAge?: number;
      startYear?: number;
      events?: ChartEvent[];
      desiredSpending?: number[];
      compact?: boolean;
   } = $props();

   function buildChart(
      canvas: HTMLCanvasElement,
      mapper: DataMapper,
      annotations: ChartAnnotations,
   ): Chart {
      const labels = years.map((y) => `${y.year}`);
      const { map: pv, suffix } = mapper;

      const areaStyle = {
         borderWidth: 1.5,
         pointRadius: 0,
         fill: true,
         yAxisID: 'y',
         stack: 'spending',
      };

      const baseSpendingData = years.map((y, idx) =>
         pv(y.spending_target - y.planned_expense, idx),
      );
      const expenseData = years.map((y, idx) => pv(y.planned_expense, idx));
      const incomeTaxData = years.map((y, idx) =>
         pv(Math.max(0, y.total_tax - y.conversion_tax - y.irmaa_cost), idx),
      );
      const irmaaData = years.map((y, idx) => pv(y.irmaa_cost, idx));
      const convTaxData = years.map((y, idx) => pv(y.conversion_tax, idx));
      const surplusData = years.map((y, idx) => pv(y.surplus, idx));

      const stackedDatasets = [
         {
            label: 'Spending',
            data: baseSpendingData,
            borderColor: '#06b6d4',
            backgroundColor: '#06b6d4',
            order: 2,
            ...areaStyle,
         },
         {
            label: 'Planned Expenses',
            data: expenseData,
            borderColor: '#14b8a6',
            backgroundColor: '#14b8a6',
            order: 3,
            ...areaStyle,
         },
         {
            label: 'Income Tax',
            data: incomeTaxData,
            borderColor: '#737373',
            backgroundColor: '#737373',
            order: 4,
            ...areaStyle,
         },
         {
            label: 'Conversion Tax',
            data: convTaxData,
            borderColor: '#a78bfa',
            backgroundColor: '#a78bfa',
            order: 5,
            ...areaStyle,
         },
         {
            label: 'IRMAA',
            data: irmaaData,
            borderColor: '#f87171',
            backgroundColor: '#f87171',
            order: 6,
            ...areaStyle,
         },
         {
            label: 'Surplus \u2192 Reinvested',
            data: surplusData,
            borderColor: '#4ade80',
            backgroundColor: '#4ade80',
            order: 7,
            ...areaStyle,
         },
      ].filter((ds) => hasNonZero(ds.data));

      const lineDatasets = hasNonZero(desiredSpending)
         ? [
              {
                 label: 'Desired Spending',
                 data: desiredSpending.map((v, idx) => pv(v, idx)),
                 borderColor: '#6366f1',
                 borderDash: [6, 3],
                 borderWidth: 2,
                 pointRadius: 0,
                 pointStyle: 'line' as const,
                 fill: false,
                 yAxisID: 'y',
                 order: 1,
              },
           ]
         : [];

      const datasets = [...lineDatasets, ...stackedDatasets];

      return new Chart(canvas, {
         type: 'line',
         data: { labels, datasets },
         options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
               annotation: { annotations },
               tooltip: {
                  filter: (item) => Math.round(item.parsed.y ?? 0) >= 100,
                  callbacks: {
                     title: (items) => {
                        const idx = items[0]?.dataIndex;
                        if (idx == null || !years[idx]) return '';
                        return yearAgesTitle(years[idx]);
                     },
                     label: (ctx) => {
                        let lbl = ctx.dataset.label ?? '';
                        const idx = ctx.dataIndex;
                        if (lbl === 'IRMAA' && years[idx]?.irmaa_estimated) {
                           lbl = 'IRMAA (Est.)';
                        }
                        return `${lbl}: ${formatTick(ctx.parsed.y ?? 0)}`;
                     },
                  },
               },
               legend: {
                  labels: { usePointStyle: true },
               },
            },
            scales: {
               x: { stacked: true },
               y: {
                  stacked: true,
                  title: {
                     display: true,
                     text: `Annual Spending${suffix}`,
                  },
                  ticks: {
                     callback: (v) => formatTick(v as number),
                  },
               },
            },
         },
      });
   }
</script>

<ChartBase
   {buildChart}
   data={years}
   {retirementAge}
   {startAge}
   {startYear}
   yearLabels={years.map((y) => `${y.year}`)}
   helpTopic="spending-chart"
   {events}
   {years}
   getYValue={(idx) => totalAvailableForYear(years[idx] ?? years[0])}
   rebuildKey={compact ? 'compact' : 'wide'}
/>
