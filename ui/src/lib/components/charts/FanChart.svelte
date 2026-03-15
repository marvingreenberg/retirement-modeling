<script lang="ts">
   import { onMount } from 'svelte';
   import { Chart, registerables } from 'chart.js';
   import annotationPlugin from 'chartjs-plugin-annotation';
   import type { YearlyResultPercentiles } from '$lib/types';
   import HelpButton from '$lib/components/HelpButton.svelte';
   import { formatTick } from './formatTick';
   import { pvDivisor } from '$lib/presentValue';
   import { pvMode, portfolio } from '$lib/stores';

   type FanMetric = 'balance' | 'spending';

   const COLORS: Record<FanMetric, { base: string; solid: string }> = {
      balance: { base: '59,130,246', solid: '#3b82f6' },
      spending: { base: '16,185,129', solid: '#10b981' },
   };

   let {
      percentiles,
      metric = 'balance',
      retirementAge = null,
      startAge = 0,
      startYear = 0,
      helpTopic = 'outcome-distribution',
   }: {
      percentiles: YearlyResultPercentiles[];
      metric?: FanMetric;
      retirementAge?: number | null;
      startAge?: number;
      startYear?: number;
      helpTopic?: string;
   } = $props();
   let canvas: HTMLCanvasElement;
   let chart: Chart | undefined;

   Chart.register(...registerables, annotationPlugin);

   function getData(
      p: YearlyResultPercentiles,
      level: string,
      idx: number,
   ): number {
      const key = `${metric}_${level}` as keyof YearlyResultPercentiles;
      const raw = (p[key] as number) ?? 0;
      const divisor = pvMode.value
         ? pvDivisor(portfolio.value.config.inflation_rate, idx)
         : 1;
      return raw / divisor;
   }

   function buildChart() {
      const isPV = pvMode.value;
      chart?.destroy();
      const labels = percentiles.map((p) => `${p.year}`);
      const { base, solid } = COLORS[metric];

      const retirementYear =
         retirementAge != null && startYear > 0 && startAge > 0
            ? startYear + (retirementAge - startAge)
            : null;
      const retirementIdx =
         retirementYear != null
            ? percentiles.findIndex((p) => p.year === retirementYear)
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
         data: {
            labels,
            datasets: [
               {
                  label: '95th percentile',
                  data: percentiles.map((p, i) => getData(p, 'p95', i)),
                  borderColor: `rgba(${base},0.35)`,
                  backgroundColor: `rgba(${base},0.15)`,
                  fill: '+4',
                  borderWidth: 1,
                  pointRadius: 0,
               },
               {
                  label: '75th percentile',
                  data: percentiles.map((p, i) => getData(p, 'p75', i)),
                  borderColor: `rgba(${base},0.5)`,
                  backgroundColor: `rgba(${base},0.2)`,
                  fill: '+2',
                  borderWidth: 1,
                  pointRadius: 0,
               },
               {
                  label: 'Median',
                  data: percentiles.map((p, i) => getData(p, 'median', i)),
                  borderColor: solid,
                  borderWidth: 2.5,
                  fill: false,
                  pointRadius: 0,
               },
               {
                  label: '25th percentile',
                  data: percentiles.map((p, i) => getData(p, 'p25', i)),
                  borderColor: `rgba(${base},0.5)`,
                  borderWidth: 1,
                  fill: false,
                  pointRadius: 0,
               },
               {
                  label: '5th percentile',
                  data: percentiles.map((p, i) => getData(p, 'p5', i)),
                  borderColor: `rgba(${base},0.35)`,
                  borderWidth: 1,
                  fill: false,
                  pointRadius: 0,
               },
            ],
         },
         options: {
            responsive: true,
            plugins: {
               annotation: { annotations },
               tooltip: {
                  callbacks: {
                     title: (items) => {
                        const idx = items[0]?.dataIndex;
                        if (idx == null || !percentiles[idx]) return '';
                        const p = percentiles[idx];
                        return `${p.year} (Age ${p.age})`;
                     },
                     label: (ctx) =>
                        `${ctx.dataset.label}: $${Math.round(ctx.parsed.y ?? 0).toLocaleString()}`,
                  },
               },
            },
            scales: {
               y: {
                  title: {
                     display: isPV,
                     text: isPV ? 'Amount (PV $)' : '',
                  },
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
      if (canvas && percentiles) buildChart();
   });
</script>

<div class="relative w-full max-h-[400px]">
   <div class="absolute top-0 right-0 z-10 p-1">
      <HelpButton topic={helpTopic} />
   </div>
   <canvas bind:this={canvas}></canvas>
</div>
