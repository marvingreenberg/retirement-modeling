<script lang="ts">
   import { onMount } from 'svelte';
   import { Chart, registerables } from 'chart.js';
   import annotationPlugin from 'chartjs-plugin-annotation';
   import type { YearlyResultPercentiles } from '$lib/types';

   let {
      percentiles,
      retirementAge = null,
      startAge = 0,
      startYear = 0,
   }: {
      percentiles: YearlyResultPercentiles[];
      retirementAge?: number | null;
      startAge?: number;
      startYear?: number;
   } = $props();
   let canvas: HTMLCanvasElement;
   let chart: Chart | undefined;

   Chart.register(...registerables, annotationPlugin);

   function buildChart() {
      chart?.destroy();
      const labels = percentiles.map((p) => `${p.year}`);

      // Retirement marker annotation
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
                  data: percentiles.map((p) => p.balance_p95),
                  borderColor: 'rgba(30,64,175,0.2)',
                  backgroundColor: 'rgba(30,64,175,0.08)',
                  fill: '+4',
                  borderWidth: 1,
                  pointRadius: 0,
               },
               {
                  label: '75th percentile',
                  data: percentiles.map((p) => p.balance_p75),
                  borderColor: 'rgba(30,64,175,0.3)',
                  backgroundColor: 'rgba(30,64,175,0.12)',
                  fill: '+2',
                  borderWidth: 1,
                  pointRadius: 0,
               },
               {
                  label: 'Median',
                  data: percentiles.map((p) => p.balance_median),
                  borderColor: '#1e40af',
                  borderWidth: 2.5,
                  fill: false,
                  pointRadius: 0,
               },
               {
                  label: '25th percentile',
                  data: percentiles.map((p) => p.balance_p25),
                  borderColor: 'rgba(30,64,175,0.3)',
                  borderWidth: 1,
                  fill: false,
                  pointRadius: 0,
               },
               {
                  label: '5th percentile',
                  data: percentiles.map((p) => p.balance_p5),
                  borderColor: 'rgba(30,64,175,0.2)',
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
      if (canvas && percentiles) buildChart();
   });
</script>

<div class="relative w-full max-h-[400px]">
   <canvas bind:this={canvas}></canvas>
</div>
