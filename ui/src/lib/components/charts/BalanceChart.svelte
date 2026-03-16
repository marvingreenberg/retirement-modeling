<script lang="ts">
   import { Chart } from 'chart.js';
   import type { YearResult, ChartEvent } from '$lib/types';
   import type { DataMapper } from '$lib/presentValue';
   import ChartBase from './ChartBase.svelte';
   import { formatTick } from './formatTick';

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

   function hasNonZero(data: number[]): boolean {
      return data.some((v) => v > 0);
   }

   function buildChart(
      canvas: HTMLCanvasElement,
      mapper: DataMapper,
      annotations: Record<string, unknown>,
   ): Chart {
      const labels = years.map((y) => `${y.year}`);
      const { map: pv, suffix } = mapper;
      const areaStyle = {
         borderWidth: 1.5,
         pointRadius: 0,
         pointStyle: 'rectRounded' as const,
         fill: true,
         yAxisID: 'y',
         order: 2,
      };
      const datasets = [
         {
            label: 'Pre-tax',
            data: years.map((yr, i) => pv(yr.pretax_balance, i)),
            borderColor: '#dc2626',
            backgroundColor: 'rgba(220,38,38,0.55)',
            ...areaStyle,
         },
         {
            label: 'Roth Conv Acct',
            data: years.map((yr, i) => pv(yr.roth_conversion_balance ?? 0, i)),
            borderColor: '#7c3aed',
            backgroundColor: 'rgba(124,58,237,0.3)',
            ...areaStyle,
         },
         {
            label: 'Roth',
            data: years.map((yr, i) => pv(yr.roth_balance, i)),
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22,163,74,0.3)',
            ...areaStyle,
         },
         {
            label: 'Brokerage',
            data: years.map((yr, i) => pv(yr.brokerage_balance, i)),
            borderColor: '#ca8a04',
            backgroundColor: 'rgba(202,138,4,0.3)',
            ...areaStyle,
         },
      ].filter((ds) => hasNonZero(ds.data));

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
                     display: true,
                     text: `Balance${suffix}`,
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
   helpTopic="balance-chart"
   {events}
   {years}
   getYValue={(idx) => years[idx]?.total_balance ?? 0}
/>
