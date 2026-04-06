<script lang="ts">
   import { Chart } from 'chart.js';
   import type { YearlyResultPercentiles } from '$lib/types';
   import type { DataMapper } from '$lib/presentValue';
   import ChartBase, { type ChartAnnotations } from './ChartBase.svelte';
   import { formatTick } from './formatTick';

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

   function getData(p: YearlyResultPercentiles, level: string): number {
      const key = `${metric}_${level}` as keyof YearlyResultPercentiles;
      return (p[key] as number) ?? 0;
   }

   function buildChart(
      canvas: HTMLCanvasElement,
      mapper: DataMapper,
      annotations: ChartAnnotations,
   ): Chart {
      const labels = percentiles.map((p) => `${p.year}`);
      const { map: pv, suffix } = mapper;
      const { base, solid } = COLORS[metric];

      return new Chart(canvas, {
         type: 'line',
         data: {
            labels,
            datasets: [
               {
                  label: '95th percentile',
                  data: percentiles.map((p, i) => pv(getData(p, 'p95'), i)),
                  borderColor: `rgba(${base},0.35)`,
                  backgroundColor: `rgba(${base},0.15)`,
                  fill: '+4',
                  borderWidth: 1,
                  pointRadius: 0,
               },
               {
                  label: '75th percentile',
                  data: percentiles.map((p, i) => pv(getData(p, 'p75'), i)),
                  borderColor: `rgba(${base},0.5)`,
                  backgroundColor: `rgba(${base},0.2)`,
                  fill: '+2',
                  borderWidth: 1,
                  pointRadius: 0,
               },
               {
                  label: 'Median',
                  data: percentiles.map((p, i) => pv(getData(p, 'median'), i)),
                  borderColor: solid,
                  borderWidth: 2.5,
                  fill: false,
                  pointRadius: 0,
               },
               {
                  label: '25th percentile',
                  data: percentiles.map((p, i) => pv(getData(p, 'p25'), i)),
                  borderColor: `rgba(${base},0.5)`,
                  borderWidth: 1,
                  fill: false,
                  pointRadius: 0,
               },
               {
                  label: '5th percentile',
                  data: percentiles.map((p, i) => pv(getData(p, 'p5'), i)),
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
                     display: true,
                     text: `Amount${suffix}`,
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
   data={percentiles}
   {retirementAge}
   {startAge}
   {startYear}
   yearLabels={percentiles.map((p) => `${p.year}`)}
   {helpTopic}
/>
