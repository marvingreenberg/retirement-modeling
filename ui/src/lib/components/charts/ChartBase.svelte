<script lang="ts">
   import { onMount, untrack } from 'svelte';
   import { Chart, registerables } from 'chart.js';
   import annotationPlugin from 'chartjs-plugin-annotation';
   import type { YearResult, ChartEvent } from '$lib/types';
   import ChartEventOverlay from './ChartEventOverlay.svelte';
   import HelpButton from '$lib/components/HelpButton.svelte';
   import { createDataMapper, type DataMapper } from '$lib/presentValue';
   import { pvMode, portfolio, profile } from '$lib/stores';

   const SECURE_ACT_BIRTH_YEAR_THRESHOLD = 1960;
   const RMD_AGE_POST_SECURE_ACT = 75;
   const RMD_AGE_PRE_SECURE_ACT = 73;

   type BuildChartFn = (
      canvas: HTMLCanvasElement,
      mapper: DataMapper,
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

   function rmdAgeForBirthYear(birthYear: number): number {
      return birthYear >= SECURE_ACT_BIRTH_YEAR_THRESHOLD
         ? RMD_AGE_POST_SECURE_ACT
         : RMD_AGE_PRE_SECURE_ACT;
   }

   function rmdAnnotation(): Record<string, unknown> {
      if (startYear <= 0 || startAge <= 0) return {};
      const cfg = portfolio.value.config;
      const primaryBirthYear = startYear - cfg.current_age_primary;
      const primaryRmdAge = rmdAgeForBirthYear(primaryBirthYear);
      const primaryRmdYear =
         startYear + (primaryRmdAge - cfg.current_age_primary);

      let rmdYear = primaryRmdYear;
      const primaryName = profile.value.primaryName;
      const spName = profile.value.spouseName;

      let labelParts: string[];
      const hasSpouse = cfg.current_age_spouse > 0;
      if (hasSpouse) {
         const spouseBirthYear = startYear - cfg.current_age_spouse;
         const spouseRmdAge = rmdAgeForBirthYear(spouseBirthYear);
         const spouseRmdYear =
            startYear + (spouseRmdAge - cfg.current_age_spouse);
         rmdYear = Math.min(primaryRmdYear, spouseRmdYear);
         if (primaryRmdYear === spouseRmdYear) {
            const names = [primaryName, spName].filter(Boolean);
            labelParts =
               names.length > 0
                  ? ['RMDs begin', names.join(' & ')]
                  : ['RMDs begin'];
         } else if (rmdYear === primaryRmdYear) {
            labelParts = primaryName
               ? ['RMDs begin', primaryName]
               : ['RMDs begin'];
         } else {
            labelParts = spName ? ['RMDs begin', spName] : ['RMDs begin'];
         }
      } else {
         labelParts = ['RMDs begin'];
      }

      const rmdIdx = yearLabels.findIndex((l) => l === String(rmdYear));
      if (rmdIdx < 0) return {};
      return {
         rmdLine: {
            type: 'line',
            xMin: rmdIdx,
            xMax: rmdIdx,
            borderColor: 'rgba(180,80,20,0.6)',
            borderWidth: 2,
            borderDash: [6, 4],
            label: {
               display: true,
               content: labelParts,
               position: 'start',
               backgroundColor: 'rgba(180,80,20,0.7)',
               color: '#fff',
               font: { size: 11 },
            },
         },
      };
   }

   function rebuild() {
      chart?.destroy();
      const mapper = createDataMapper(
         pvMode.value,
         portfolio.value.config.inflation_rate,
      );
      const annotations = {
         ...retirementAnnotation(),
         ...rmdAnnotation(),
      };
      chart = buildChartFn(canvas, mapper, annotations);
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
