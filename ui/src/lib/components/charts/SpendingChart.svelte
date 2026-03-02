<script lang="ts">
   import { onMount, untrack } from 'svelte';
   import { Chart, registerables } from 'chart.js';
   import annotationPlugin from 'chartjs-plugin-annotation';
   import type { YearResult, ChartEvent } from '$lib/types';
   import ChartEventOverlay from './ChartEventOverlay.svelte';

   function cashFlowForYear(y: YearResult): number {
      return y.spending_target + y.surplus;
   }

   let {
      years,
      retirementAge = null,
      startAge = 0,
      startYear = 0,
      events = [],
   }: {
      years: YearResult[];
      retirementAge?: number | null;
      startAge?: number;
      startYear?: number;
      events?: ChartEvent[];
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

      const taxData = years.map((y) =>
         Math.max(0, y.total_tax - y.conversion_tax),
      );
      const convTaxData = years.map((y) => y.conversion_tax);
      const cashFlowData = years.map(cashFlowForYear);
      const budgetPlusTax = years.map(
         (y) => y.spending_target + Math.max(0, y.total_tax - y.conversion_tax),
      );

      // Stacked areas drawn top-to-bottom (highest order draws first as background).
      // Cash Flow is the largest area drawn first, then conv tax, then taxes on top.
      const stackedDatasets = [
         {
            label: 'Cash Flow',
            data: cashFlowData,
            borderColor: '#0e7490',
            backgroundColor: '#cffafe',
            order: 3,
            ...areaStyle,
         },
         {
            label: 'Conversion Tax',
            data: convTaxData,
            borderColor: '#c2410c',
            backgroundColor: '#fed7aa',
            order: 2,
            ...areaStyle,
         },
         {
            label: 'Est. Taxes',
            data: taxData,
            borderColor: '#404040',
            backgroundColor: '#a3a3a3',
            order: 1,
            ...areaStyle,
         },
      ].filter((ds) => hasNonZero(ds.data));

      const lineDatasets = [
         {
            label: 'Budget + Taxes',
            data: budgetPlusTax,
            borderColor: '#6366f1',
            borderDash: [6, 3],
            borderWidth: 2,
            pointRadius: 0,
            pointStyle: 'line' as const,
            fill: false,
            yAxisID: 'y',
            order: 0,
         },
      ].filter((ds) => hasNonZero(ds.data));

      const datasets = [...stackedDatasets, ...lineDatasets];

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
                     callback: (v) => `$${(Number(v) / 1000).toFixed(0)}K`,
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
   <canvas bind:this={canvas}></canvas>
   <ChartEventOverlay
      {chart}
      {events}
      {years}
      getYValue={(idx) => cashFlowForYear(years[idx] ?? years[0])}
   />
</div>
