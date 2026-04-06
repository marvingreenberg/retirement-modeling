<script lang="ts">
   import BalanceChart from './charts/BalanceChart.svelte';
   import SpendingChart from './charts/SpendingChart.svelte';
   import FanChart from './charts/FanChart.svelte';
   import { buildChartEvents } from '$lib/chartEvents';
   import { profile } from '$lib/stores';
   import type { ResultPaneTab } from '$lib/stores.svelte';
   import type {
      ComparisonEntry,
      SimulationConfig,
      ChartEvent,
   } from '$lib/types';

   let {
      entry,
      activeTab,
      config = null,
   }: {
      entry: ComparisonEntry;
      activeTab: ResultPaneTab;
      config?: SimulationConfig | null;
   } = $props();

   let years = $derived(entry.singleResult?.result.years ?? []);
   let chartEvents: ChartEvent[] = $derived(
      config
         ? buildChartEvents(
              config,
              profile.value.primaryName,
              profile.value.spouseName,
           )
         : [],
   );
   let desiredSpending: number[] = $derived.by(() => {
      if (!config || !entry.singleResult) return [];
      const base = config.annual_spend_net ?? 0;
      const inf = config.inflation_rate ?? 0.03;
      return entry.singleResult.result.years.map((y, i) => {
         const inflated = base * Math.pow(1 + inf, i);
         return inflated + y.planned_expense;
      });
   });

   let depletionIdx = $derived(
      years.findIndex((yr, i) => yr.total_balance <= 0 && i > 0),
   );
   let displayYears = $derived(
      depletionIdx >= 0 ? years.slice(0, depletionIdx + 1) : years,
   );

   let paneLabel = $derived(
      `${entry.conversionStrategy} \u00b7 ${entry.withdrawalOrder === 'brk-first' ? 'Brokerage first' : 'IRA/401k first'}`,
   );
</script>

<div
   class="card bg-surface-50 dark:bg-surface-900 p-3 border border-surface-200 dark:border-surface-700"
>
   <div
      class="text-xs font-semibold text-surface-500 dark:text-surface-400 mb-2 pb-1 border-b border-surface-200 dark:border-surface-700"
   >
      {paneLabel}
   </div>

   {#if entry.singleResult === null && activeTab !== 'monte_carlo'}
      <!-- Single sim hasn't returned yet — show nothing (sim is fast) -->
   {:else if activeTab === 'balance'}
      <BalanceChart
         years={displayYears}
         retirementAge={config?.retirement_age}
         startAge={config?.current_age_primary ?? 0}
         startYear={config?.start_year ?? 0}
         events={chartEvents}
      />
   {:else if activeTab === 'spending'}
      <SpendingChart
         years={displayYears}
         retirementAge={config?.retirement_age}
         startAge={config?.current_age_primary ?? 0}
         startYear={config?.start_year ?? 0}
         events={chartEvents}
         {desiredSpending}
      />
   {:else if activeTab === 'monte_carlo'}
      {#if entry.mcResult}
         <FanChart
            percentiles={entry.mcResult.yearly_percentiles}
            metric="balance"
            retirementAge={config?.retirement_age}
            startAge={config?.current_age_primary ?? 0}
            startYear={config?.start_year ?? 0}
         />
      {:else}
         <div
            class="flex flex-col items-center justify-center text-center py-12 gap-3 text-surface-500"
         >
            <div
               class="w-8 h-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"
            ></div>
            <span class="text-sm">Running Monte Carlo\u2026</span>
         </div>
      {/if}
   {:else if activeTab === 'details'}
      <!-- Details tab is rendered by the parent for layout alignment -->
   {/if}
</div>
