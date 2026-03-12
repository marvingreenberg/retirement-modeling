<script lang="ts">
   import { onMount, untrack } from 'svelte';
   import { Chart, registerables } from 'chart.js';
   import annotationPlugin from 'chartjs-plugin-annotation';
   import type { YearResult, ChartEvent } from '$lib/types';
   import ChartEventOverlay from './ChartEventOverlay.svelte';
   import HelpButton from '$lib/components/HelpButton.svelte';
   import { formatTick } from './formatTick';

   function totalAvailableForYear(y: YearResult): number {
      return y.spending_target + y.surplus + y.total_tax + y.irmaa_cost;
   }

   let {
      years,
      retirementAge = null,
      startAge = 0,
      startYear = 0,
      events = [],
      desiredSpending = [],
   }: {
      years: YearResult[];
      retirementAge?: number | null;
      startAge?: number;
      startYear?: number;
      events?: ChartEvent[];
      desiredSpending?: number[];
   } = $props();
   let canvas: HTMLCanvasElement;
   let chart: Chart | undefined = $state();

   Chart.register(...registerables, annotationPlugin);

   function hasNonZero(data: number[]): boolean {
      return data.some((v) => v > 0);
   }

   function buildChart() {
      chart?.destroy();
      const labels = years.map((y) => `${y.year}`);

      const areaStyle = {
         borderWidth: 1.5,
         pointRadius: 0,
         fill: true,
         yAxisID: 'y',
         stack: 'spending',
      };

      const baseSpendingData = years.map(
         (y) => y.spending_target - y.planned_expense,
      );
      const expenseData = years.map((y) => y.planned_expense);
      const incomeTaxData = years.map((y) =>
         Math.max(0, y.total_tax - y.conversion_tax - y.irmaa_cost),
      );
      const irmaaData = years.map((y) => y.irmaa_cost);
      const convTaxData = years.map((y) => y.conversion_tax);
      const surplusData = years.map((y) => y.surplus);

      // Bottom to top: spending, expenses, income tax, conv tax, IRMAA, surplus
      // order controls legend sorting (lower = listed first) and draw z-order
      const stackedDatasets = [
         {
            label: 'Spending',
            data: baseSpendingData,
            borderColor: '#0e7490',
            backgroundColor: '#cffafe',
            order: 2,
            ...areaStyle,
         },
         {
            label: 'Planned Expenses',
            data: expenseData,
            borderColor: '#0d9488',
            backgroundColor: '#99f6e4',
            order: 3,
            ...areaStyle,
         },
         {
            label: 'Income Tax',
            data: incomeTaxData,
            borderColor: '#404040',
            backgroundColor: '#a3a3a3',
            order: 4,
            ...areaStyle,
         },
         {
            label: 'Conversion Tax',
            data: convTaxData,
            borderColor: '#c2410c',
            backgroundColor: '#fed7aa',
            order: 5,
            ...areaStyle,
         },
         {
            label: 'IRMAA',
            data: irmaaData,
            borderColor: '#b45309',
            backgroundColor: '#fde68a',
            order: 6,
            ...areaStyle,
         },
         {
            label: 'Surplus \u2192 Reinvested',
            data: surplusData,
            borderColor: '#15803d',
            backgroundColor: '#bbf7d0',
            order: 7,
            ...areaStyle,
         },
      ].filter((ds) => hasNonZero(ds.data));

      const lineDatasets = hasNonZero(desiredSpending)
         ? [
              {
                 label: 'Desired Spending',
                 data: desiredSpending,
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

      // Line first for legend ordering (Desired Spending at top of key)
      const datasets = [...lineDatasets, ...stackedDatasets];

      // Retirement marker annotation
      const retirementYear =
         retirementAge != null && startYear > 0 && startAge > 0
            ? startYear + (retirementAge - startAge)
            : null;
      const retirementIdx =
         retirementYear != null
            ? years.findIndex((y) => y.year === retirementYear)
            : -1;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const annotations: Record<string, any> =
         retirementIdx >= 0
            ? {
                 retirementLine: {
                    type: 'line',
                    xMin: retirementIdx,
                    xMax: retirementIdx,
                    borderColor: 'rgba(100,100,100,0.6)',
                    borderWidth: 2,
                    borderDash: [6, 4],
                    label: {
                       display: true,
                       content: 'Retires',
                       position: 'start',
                       backgroundColor: 'rgba(100,100,100,0.7)',
                       color: '#fff',
                       font: { size: 11 },
                    },
                 },
              }
            : {};

      chart = new Chart(canvas, {
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
                        const yr = years[idx];
                        return `${yr.year} (Age ${yr.age_primary})`;
                     },
                     label: (ctx) =>
                        `${ctx.dataset.label}: $${Math.round(ctx.parsed.y ?? 0).toLocaleString()}`,
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
                  ticks: {
                     callback: (v) => formatTick(v as number),
                  },
               },
            },
         },
      });
   }

   onMount(() => buildChart());

   $effect(() => {
      if (canvas && years) untrack(() => buildChart());
   });
</script>

<div class="relative w-full max-h-[400px]">
   <div class="absolute top-0 right-0 z-10 p-1">
      <HelpButton topic="spending-chart" />
   </div>
   <canvas bind:this={canvas}></canvas>
   <ChartEventOverlay
      {chart}
      {events}
      {years}
      getYValue={(idx) => totalAvailableForYear(years[idx] ?? years[0])}
   />
</div>
