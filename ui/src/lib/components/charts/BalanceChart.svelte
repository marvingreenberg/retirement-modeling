<script lang="ts">
   import { Chart } from 'chart.js';
   import type { AnnotationOptions } from 'chartjs-plugin-annotation';
   import type { YearResult, ChartEvent } from '$lib/types';
   import type { DataMapper } from '$lib/presentValue';
   import ChartBase, { type ChartAnnotations } from './ChartBase.svelte';
   import { formatTick } from './formatTick';

   let {
      years,
      retirementAge = null,
      startAge = 0,
      startYear = 0,
      events = [],
      compact = false,
   }: {
      years: YearResult[];
      retirementAge?: number | null;
      startAge?: number;
      startYear?: number;
      events?: ChartEvent[];
      compact?: boolean;
   } = $props();

   function hasNonZero(data: number[]): boolean {
      return data.some((v) => v > 0);
   }

   // Build a year/ages title that shows both ages older-first when there's
   // a spouse. Used by the tooltip's title callback.
   //
   // The "is there a spouse" check looks at years[0].age_spouse rather
   // than yr.age_spouse: the simulator increments age_spouse year-by-year
   // from current_age_spouse, so for a single-person portfolio
   // (current_age_spouse = 0) the value drifts up to whatever the
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

   // Build a chartjs-plugin-annotation 'label' annotation pinned with its
   // bottom-right corner on the stacked total line at this year. Anchoring
   // at total_balance (the visible top of the stacked area) gives a clean
   // right-angle marker on the chart trace itself.
   //
   // The bottom-right corner is rendered as a square (no border-radius)
   // so it forms a clean right-angle marker at the data point. No callout
   // line is drawn — the corner itself IS the marker.
   //
   // The yValue is scriptable so we can clamp it down to keep the box
   // inside the chart area: if anchoring at total_balance would push the
   // box off the top, drop the anchor by exactly the box height in pixels
   // (converted back to data units via the y-scale).
   //
   // `compactMode` shrinks font and padding for side-by-side display
   // where the chart canvas is roughly half-width.
   function buildBalanceLabelAnnotation(
      idx: number,
      yr: YearResult,
      pv: DataMapper['map'],
      compactMode: boolean,
   ): AnnotationOptions {
      const afterTax = pv(yr.after_tax_value, idx);
      const inherited = pv(yr.inherited_value, idx);
      const total = pv(yr.total_balance, idx);
      // Approximate rendered box height: 2 monospace lines + padding +
      // border. Tuned to match the font/padding settings below.
      const boxHeightPx = compactMode ? 32 : 44;
      return {
         type: 'label',
         xValue: idx,
         yValue: (ctx) => {
            const yScale = ctx.chart.scales.y;
            // yScale.top is the pixel of the chart area's top edge
            // (small pixel = visually up). Moving boxHeightPx down in
            // pixels lands us at the highest data value where the box
            // still fits entirely inside the chart area.
            const maxSafe = yScale.getValueForPixel(yScale.top + boxHeightPx);
            return maxSafe == null ? total : Math.min(total, maxSafe);
         },
         xAdjust: 0,
         yAdjust: 0,
         content: [
            `Year: ${yr.year}`,
            `After Tax value: ${formatTick(afterTax)}`,
            `Inherited value: ${formatTick(inherited)}`,
         ],
         backgroundColor: 'rgba(38, 50, 56, 0.85)',
         color: '#f5f5f4',
         borderColor: 'rgba(120, 130, 140, 0.4)',
         borderWidth: 1,
         // Square bottom-right corner (the corner that sits on the data
         // point); other corners stay rounded for the rest of the box.
         borderRadius: {
            topLeft: 4,
            topRight: 4,
            bottomLeft: 4,
            bottomRight: 0,
         },
         font: {
            size: compactMode ? 7 : 9,
            family: 'monospace',
         },
         padding: compactMode ? 2 : 4,
         textAlign: 'left',
         // Anchor the label box's bottom-right corner at (xValue, yValue).
         // The box extends up-and-left from there.
         position: { x: 'end', y: 'end' },
      };
   }

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

      // Static label annotations: one at year-end, one 10 years before
      // (only when the simulation is long enough). Built here in
      // buildChart so the closure captures the current `mapper` (PV mode).
      const labelAnnotations: ChartAnnotations = {};
      const lastIdx = years.length - 1;
      if (lastIdx >= 0) {
         labelAnnotations.endLabel = buildBalanceLabelAnnotation(
            lastIdx,
            years[lastIdx],
            pv,
            compact,
         );
         if (lastIdx >= 11) {
            const midIdx = lastIdx - 10;
            labelAnnotations.midLabel = buildBalanceLabelAnnotation(
               midIdx,
               years[midIdx],
               pv,
               compact,
            );
         }
      }
      const allAnnotations = { ...annotations, ...labelAnnotations };

      return new Chart(canvas, {
         type: 'line',
         data: { labels, datasets },
         options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
               annotation: { annotations: allAnnotations },
               tooltip: {
                  filter: (item) => Math.round(item.parsed.y ?? 0) >= 100,
                  callbacks: {
                     title: (items) => {
                        const idx = items[0]?.dataIndex;
                        if (idx == null || !years[idx]) return '';
                        return yearAgesTitle(years[idx]);
                     },
                     label: (ctx) =>
                        `${ctx.dataset.label}: ${formatTick(ctx.parsed.y ?? 0)}`,
                     footer: (items) => {
                        if (items.length === 0) return '';
                        const idx = items[0]?.dataIndex;
                        if (
                           idx == null ||
                           years[idx]?.after_tax_value == null
                        ) {
                           return '';
                        }
                        const adj = pv(years[idx].after_tax_value, idx);
                        return `After Tax value: ${formatTick(adj)}`;
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
   rebuildKey={compact ? 'compact' : 'wide'}
/>
