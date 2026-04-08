<script lang="ts">
   import { onMount, untrack } from 'svelte';
   import { Chart, registerables } from 'chart.js';
   import annotationPlugin, {
      type AnnotationOptions,
   } from 'chartjs-plugin-annotation';
   import type { YearResult, ChartEvent } from '$lib/types';
   import ChartEventOverlay from './ChartEventOverlay.svelte';
   import HelpButton from '$lib/components/HelpButton.svelte';
   import { createDataMapper, type DataMapper } from '$lib/presentValue';
   import { pvMode, portfolio, profile } from '$lib/stores';

   const SECURE_ACT_BIRTH_YEAR_THRESHOLD = 1960;
   const RMD_AGE_POST_SECURE_ACT = 75;
   const RMD_AGE_PRE_SECURE_ACT = 73;

   export type ChartAnnotations = Record<string, AnnotationOptions>;

   type BuildChartFn = (
      canvas: HTMLCanvasElement,
      mapper: DataMapper,
      annotations: ChartAnnotations,
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
      // Generic "rebuild me" key. Charts that customize their rendering
      // based on a layout-mode flag (e.g. BalanceChart's `compact` for
      // side-by-side) include the relevant value in this key so that
      // changes trigger ChartBase's rebuild $effect. Defaults to a
      // constant when not used.
      rebuildKey = '',
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
      rebuildKey?: string;
   } = $props();

   let canvas: HTMLCanvasElement;
   let chart: Chart | undefined = $state();

   Chart.register(...registerables, annotationPlugin);

   function retirementAnnotation(): ChartAnnotations {
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
            type: 'line' as const,
            xMin: retirementIdx,
            xMax: retirementIdx,
            borderColor: 'rgba(100,100,100,0.6)',
            borderWidth: 2,
            borderDash: [6, 4],
            label: {
               display: true,
               content: 'Retires',
               position: 'start' as const,
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

   // Build a single dashed-line annotation at a given year index, with a
   // multiline label. Used for the per-spouse RMD lines below.
   function rmdLineAnnotation(
      yearIdx: number,
      labelLines: string[],
   ): AnnotationOptions {
      return {
         type: 'line' as const,
         xMin: yearIdx,
         xMax: yearIdx,
         borderColor: 'rgba(180,80,20,0.6)',
         borderWidth: 2,
         borderDash: [6, 4],
         label: {
            display: true,
            content: labelLines,
            position: 'start' as const,
            backgroundColor: 'rgba(180,80,20,0.7)',
            color: '#fff',
            font: { size: 11 },
         },
      };
   }

   function rmdAnnotation(): ChartAnnotations {
      if (startYear <= 0 || startAge <= 0) return {};
      const cfg = portfolio.value.config;
      const primaryName = profile.value.primaryName;
      const spName = profile.value.spouseName;
      const hasSpouse = cfg.current_age_spouse > 0;

      const primaryBirthYear = startYear - cfg.current_age_primary;
      const primaryRmdAge = rmdAgeForBirthYear(primaryBirthYear);
      const primaryRmdYear =
         startYear + (primaryRmdAge - cfg.current_age_primary);
      const primaryIdx = yearLabels.findIndex(
         (l) => l === String(primaryRmdYear),
      );

      // Strict per-spouse pretax check: only render a spouse's RMD line
      // if that spouse actually has pretax balance > 0 in the simulation
      // year that matches their RMD start age. With the new pretax
      // withdrawal ordering (older spouse first), it's possible for a
      // spouse's pretax to be fully drained before their RMD age — in
      // which case they have no RMD obligation and the line is omitted.
      function primaryHasPretaxAtRmd(): boolean {
         if (primaryIdx < 0 || primaryIdx >= years.length) return false;
         return (years[primaryIdx]?.pretax_balance_primary ?? 0) > 0;
      }
      function spouseHasPretaxAtRmd(spouseIdx: number): boolean {
         if (spouseIdx < 0 || spouseIdx >= years.length) return false;
         return (years[spouseIdx]?.pretax_balance_spouse ?? 0) > 0;
      }

      const annotations: ChartAnnotations = {};

      if (!hasSpouse) {
         if (primaryIdx >= 0 && primaryHasPretaxAtRmd()) {
            annotations.rmdLine = rmdLineAnnotation(primaryIdx, ['RMDs begin']);
         }
         return annotations;
      }

      const spouseBirthYear = startYear - cfg.current_age_spouse;
      const spouseRmdAge = rmdAgeForBirthYear(spouseBirthYear);
      const spouseRmdYear = startYear + (spouseRmdAge - cfg.current_age_spouse);
      const spouseIdx = yearLabels.findIndex(
         (l) => l === String(spouseRmdYear),
      );

      const showPrimary = primaryIdx >= 0 && primaryHasPretaxAtRmd();
      const showSpouse = spouseIdx >= 0 && spouseHasPretaxAtRmd(spouseIdx);

      // Same year + both qualify → single combined line.
      if (showPrimary && showSpouse && primaryRmdYear === spouseRmdYear) {
         const both = [primaryName, spName].filter(Boolean).join(' & ');
         annotations.rmdLine = rmdLineAnnotation(primaryIdx, [
            'RMDs begin',
            both ? `(${both})` : '',
         ]);
         return annotations;
      }

      if (showPrimary) {
         annotations.rmdLinePrimary = rmdLineAnnotation(primaryIdx, [
            'RMDs begin',
            primaryName ? `(${primaryName})` : '',
         ]);
      }
      if (showSpouse) {
         annotations.rmdLineSpouse = rmdLineAnnotation(spouseIdx, [
            'RMDs begin',
            spName ? `(${spName})` : '',
         ]);
      }
      return annotations;
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
      const _rebuildKey = rebuildKey;
      void _pv;
      void _data;
      void _rebuildKey;
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
