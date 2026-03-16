<script lang="ts">
   import { onMount, untrack } from 'svelte';
   import { Chart, registerables } from 'chart.js';
   import annotationPlugin from 'chartjs-plugin-annotation';
   import type { YearResult, ChartEvent } from '$lib/types';
   import ChartEventOverlay from './ChartEventOverlay.svelte';
   import HelpButton from '$lib/components/HelpButton.svelte';
   import { pvMapper } from '$lib/presentValue';
   import { pvMode, portfolio } from '$lib/stores';

   type PVFn = (value: number, yearIndex: number) => number;
   type BuildChartFn = (
      canvas: HTMLCanvasElement,
      pv: PVFn,
      isPV: boolean,
      annotations: Record<string, unknown>,
   ) => Chart;

   let {
      buildChart: buildChartFn,
      data,
      retirementAge = null,
      startAge = 0,
      startYear = 0,
      yearLabels = [],
      helpTopic = 'balance-chart',
      events = [],
      years = [],
      getYValue = () => 0,
   }: {
      buildChart: BuildChartFn;
      data: unknown;
      retirementAge?: number | null;
      startAge?: number;
      startYear?: number;
      yearLabels?: string[];
      helpTopic?: string;
      events?: ChartEvent[];
      years?: YearResult[];
      getYValue?: (idx: number) => number;
   } = $props();

   let canvas: HTMLCanvasElement;
   let chart: Chart | undefined = $state();

   Chart.register(...registerables, annotationPlugin);

   function retirementAnnotation(): Record<string, unknown> {
      const retirementYear =
         retirementAge != null && startYear > 0 && startAge > 0
            ? startYear + (retirementAge - startAge)
            : null;
      const retirementIdx =
         retirementYear != null
            ? yearLabels.findIndex((l) => l === String(retirementYear))
            : -1;
      if (retirementIdx < 0) return {};
      return {
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
      };
   }

   function rebuild() {
      chart?.destroy();
      const isPV = pvMode.value;
      const pv = pvMapper(isPV, portfolio.value.config.inflation_rate);
      const annotations = retirementAnnotation();
      chart = buildChartFn(canvas, pv, isPV, annotations);
   }

   onMount(() => rebuild());

   $effect(() => {
      const _pv = pvMode.value;
      const _data = data;
      void _pv;
      void _data;
      if (canvas) untrack(() => rebuild());
   });
</script>

<div class="relative w-full max-h-[400px]">
   <div class="absolute top-0 right-0 z-10 p-1">
      <HelpButton topic={helpTopic} />
   </div>
   <canvas bind:this={canvas}></canvas>
   {#if events.length > 0 && years.length > 0}
      <ChartEventOverlay {chart} {events} {years} {getYValue} />
   {/if}
</div>
