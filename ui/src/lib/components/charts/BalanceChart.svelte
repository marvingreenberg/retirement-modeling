<script lang="ts">
   import { onMount, untrack } from 'svelte';
   import { Chart, registerables } from 'chart.js';
   import annotationPlugin from 'chartjs-plugin-annotation';
   import type { YearResult, ChartEvent } from '$lib/types';
   import ChartEventOverlay from './ChartEventOverlay.svelte';
   import HelpButton from '$lib/components/HelpButton.svelte';
   import { formatTick } from './formatTick';
   import { pvDivisor } from '$lib/presentValue';
   import { pvMode, portfolio } from '$lib/stores';

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

   function buildChart(usePV: boolean) {
      chart?.destroy();
      const labels = years.map((y) => `${y.year}`);
      const inflationRate = portfolio.value.config.inflation_rate;

      const areaStyle = {
         borderWidth: 1.5,
         pointRadius: 0,
         pointStyle: 'rectRounded' as const,
         fill: true,
         yAxisID: 'y',
         order: 2,
      };
      const balanceDatasets = [
         {
            label: 'Pre-tax',
            data: years.map((yr, idx) => {
               const divisor = usePV ? pvDivisor(inflationRate, idx) : 1;
               return yr.pretax_balance / divisor;
            }),
            borderColor: '#dc2626',
            backgroundColor: 'rgba(220,38,38,0.55)',
            ...areaStyle,
         },
         {
            label: 'Roth Conv Acct',
            data: years.map((yr, idx) => {
               const divisor = usePV ? pvDivisor(inflationRate, idx) : 1;
               return (yr.roth_conversion_balance ?? 0) / divisor;
            }),
            borderColor: '#7c3aed',
            backgroundColor: 'rgba(124,58,237,0.3)',
            ...areaStyle,
         },
         {
            label: 'Roth',
            data: years.map((yr, idx) => {
               const divisor = usePV ? pvDivisor(inflationRate, idx) : 1;
               return yr.roth_balance / divisor;
            }),
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22,163,74,0.3)',
            ...areaStyle,
         },
         {
            label: 'Brokerage',
            data: years.map((yr, idx) => {
               const divisor = usePV ? pvDivisor(inflationRate, idx) : 1;
               return yr.brokerage_balance / divisor;
            }),
            borderColor: '#ca8a04',
            backgroundColor: 'rgba(202,138,4,0.3)',
            ...areaStyle,
         },
      ];

      const datasets = balanceDatasets.filter((ds) => hasNonZero(ds.data));

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
                     footer: (items) => {
                        if (items.length === 0) return '';
                        const total = items.reduce(
                           (sum, item) => sum + (item.parsed.y ?? 0),
                           0,
                        );
                        return `Total Balance: $${Math.round(total).toLocaleString()}`;
                     },
                  },
               },
               legend: {
                  labels: {
                     usePointStyle: true,
                  },
               },
            },
            scales: {
               x: { stacked: true },
               y: {
                  stacked: true,
                  position: 'left',
                  title: {
                     display: usePV,
                     text: 'Balance (PV $)',
                  },
                  ticks: {
                     callback: (v) => formatTick(v as number),
                  },
               },
            },
         },
      });
   }

   onMount(() => buildChart(pvMode.value));

   $effect(() => {
      const usePV = pvMode.value;
      if (canvas && years) untrack(() => buildChart(usePV));
   });
</script>

<div class="relative w-full max-h-[400px]">
   <div class="absolute top-0 right-0 z-10 p-1">
      <HelpButton topic="balance-chart" />
   </div>
   <canvas bind:this={canvas}></canvas>
   <ChartEventOverlay
      {chart}
      {events}
      {years}
      getYValue={(idx) => years[idx]?.total_balance ?? 0}
   />
</div>
