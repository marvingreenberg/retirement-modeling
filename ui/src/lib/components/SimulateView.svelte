<script lang="ts">
   import { currency } from '$lib/format';
   import BalanceChart from './charts/BalanceChart.svelte';
   import SpendingChart from './charts/SpendingChart.svelte';
   import FanChart from './charts/FanChart.svelte';
   import { buildChartEvents } from '$lib/chartEvents';
   import type {
      SimulationResponse,
      MonteCarloResponse,
      SimulationConfig,
      ChartEvent,
   } from '$lib/types';
   import { ShieldCheck } from 'lucide-svelte';
   import { pvMode, portfolio } from '$lib/stores';
   import { toPV } from '$lib/presentValue';

   let {
      singleResult = null,
      mcResult = null,
      mcLoading = false,
      error = '',
      config = null,
   }: {
      singleResult: SimulationResponse | null;
      mcResult: MonteCarloResponse | null;
      mcLoading: boolean;
      error: string;
      config?: SimulationConfig | null;
   } = $props();

   let activeTab = $state<'single' | 'spending' | 'monte_carlo'>('single');
   let chartEvents: ChartEvent[] = $derived(
      config ? buildChartEvents(config) : [],
   );
   let desiredSpending: number[] = $derived.by(() => {
      if (!config || !singleResult) return [];
      const base = config.annual_spend_net ?? 0;
      const inf = config.inflation_rate ?? 0.03;
      return singleResult.result.years.map((y, i) => {
         const inflated = base * Math.pow(1 + inf, i);
         return inflated + y.planned_expense;
      });
   });

   let inflationRate = $derived(portfolio.value.config.inflation_rate ?? 0.03);

   let pvTotalTaxes = $derived.by(() => {
      if (!singleResult) return 0;
      return singleResult.result.years.reduce(
         (sum, yr, i) => sum + toPV(yr.total_tax, inflationRate, i),
         0,
      );
   });

   let pvTotalIrmaa = $derived.by(() => {
      if (!singleResult) return 0;
      return singleResult.result.years.reduce(
         (sum, yr, i) => sum + toPV(yr.irmaa_cost, inflationRate, i),
         0,
      );
   });

   let pvSpendingRange = $derived.by(() => {
      if (!singleResult) return null;
      const pvSpends = singleResult.result.years.map((yr, i) =>
         toPV(yr.spending_target, inflationRate, i),
      );
      return { min: Math.min(...pvSpends), max: Math.max(...pvSpends) };
   });

   let hasAnyResults = $derived(!!singleResult || !!mcResult);
</script>

<div class="space-y-4">
   {#if error}
      <div
         class="text-error-500 bg-error-50 dark:bg-error-950 p-3 rounded text-sm"
      >
         {error}
      </div>
   {/if}

   <!-- Summary bar (always visible when any results exist) -->
   {#if hasAnyResults}
      <div class="card bg-surface-100 dark:bg-surface-800 p-4">
         <div class="flex gap-6 flex-wrap items-end">
            <div class="flex flex-col gap-0.5">
               <span class="text-xs text-surface-500">Final Balance</span>
               <span
                  class="text-base font-bold text-surface-900 dark:text-surface-50"
               >
                  {singleResult
                     ? currency(singleResult.summary.final_balance)
                     : '—'}
               </span>
            </div>

            <div class="flex flex-col gap-0.5">
               <span class="text-xs text-surface-500">MC Balance Range</span>
               <span
                  class="text-base font-bold text-surface-900 dark:text-surface-50"
               >
                  {#if mcResult}
                     {currency(mcResult.final_balance_p5)}–{currency(
                        mcResult.final_balance_p95,
                     )}
                  {:else}
                     —
                  {/if}
               </span>
            </div>

            <div class="flex flex-col gap-0.5">
               <span class="text-xs text-surface-500">MC Success Rate</span>
               <span
                  class="text-base font-bold text-surface-900 dark:text-surface-50"
               >
                  {#if mcResult}
                     {@const rate = mcResult.success_rate}
                     {@const color =
                        rate >= 0.9
                           ? '#22c55e'
                           : rate >= 0.7
                             ? '#eab308'
                             : '#ef4444'}
                     <svg viewBox="0 0 12 12" class="inline-block w-3.5 h-3.5">
                        <circle cx="6" cy="6" r="5" fill={color} />
                     </svg>
                     <span style="color: {color}"
                        >{Math.round(rate * 100)}%</span
                     >
                  {:else}
                     —
                  {/if}
               </span>
            </div>

            <div class="flex flex-col gap-0.5">
               <span class="text-xs text-surface-500"
                  >Spending Range (PV $)</span
               >
               <span
                  class="text-base font-bold text-surface-900 dark:text-surface-50"
               >
                  {#if pvSpendingRange}
                     {currency(pvSpendingRange.min)}–{currency(
                        pvSpendingRange.max,
                     )}
                  {:else}
                     —
                  {/if}
               </span>
            </div>

            <div class="flex flex-col gap-0.5">
               <span class="text-xs text-surface-500">Total Taxes (PV $)</span>
               <span
                  class="text-base font-bold text-surface-900 dark:text-surface-50"
               >
                  {singleResult ? currency(pvTotalTaxes) : '—'}
               </span>
            </div>

            <div class="flex flex-col gap-0.5">
               <span class="text-xs text-surface-500"
                  >Total IRMAA Surcharges (PV $)</span
               >
               <span
                  class="text-base font-bold text-surface-900 dark:text-surface-50"
               >
                  {singleResult ? currency(pvTotalIrmaa) : '—'}
               </span>
            </div>

            {#if activeTab !== 'monte_carlo'}
               <div class="flex flex-col justify-end">
                  <label class="flex items-center gap-2 text-sm">
                     <input
                        type="checkbox"
                        class="checkbox"
                        bind:checked={pvMode.value}
                     />
                     Present Value $
                  </label>
               </div>
            {/if}
         </div>
      </div>
   {/if}

   <!-- Tab bar -->
   <div class="flex gap-1 border-b border-surface-300 dark:border-surface-700">
      <button
         class="px-4 py-2 text-sm font-medium transition-colors {activeTab ===
         'single'
            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
            : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}"
         onclick={() => (activeTab = 'single')}
      >
         Simulation
      </button>
      <button
         class="px-4 py-2 text-sm font-medium transition-colors {activeTab ===
         'spending'
            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
            : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}"
         onclick={() => (activeTab = 'spending')}
      >
         Spending
      </button>
      <button
         class="px-4 py-2 text-sm font-medium transition-colors {activeTab ===
         'monte_carlo'
            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
            : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}"
         onclick={() => (activeTab = 'monte_carlo')}
      >
         Monte Carlo
         {#if mcLoading}
            <span
               class="inline-block ml-1 animate-spin h-3 w-3 border-2 border-primary-500 border-t-transparent rounded-full align-middle"
            ></span>
         {/if}
      </button>
   </div>

   <!-- Single run tab -->
   {#if activeTab === 'single'}
      {#if singleResult}
         <BalanceChart
            years={singleResult.result.years}
            retirementAge={config?.retirement_age}
            startAge={config?.current_age_primary ?? 0}
            startYear={config?.start_year ?? 0}
            events={chartEvents}
         />

         <div class="flex items-center gap-4">
            <a
               href="/details"
               class="text-sm text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
               >View year-by-year details &rarr;</a
            >
         </div>
      {:else}
         <div class="flex flex-col items-center justify-center py-16 gap-3">
            <div
               class="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"
            ></div>
            <span class="text-surface-500">Running simulation...</span>
         </div>
      {/if}
   {/if}

   <!-- Spending tab -->
   {#if activeTab === 'spending'}
      {#if singleResult}
         <SpendingChart
            years={singleResult.result.years}
            retirementAge={config?.retirement_age}
            startAge={config?.current_age_primary ?? 0}
            startYear={config?.start_year ?? 0}
            events={chartEvents}
            {desiredSpending}
         />
      {:else}
         <div class="flex flex-col items-center justify-center py-16 gap-3">
            <div
               class="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"
            ></div>
            <span class="text-surface-500">Running simulation...</span>
         </div>
      {/if}
   {/if}

   <!-- Monte Carlo tab -->
   {#if activeTab === 'monte_carlo'}
      {#if mcLoading}
         <div class="flex flex-col items-center justify-center py-16 gap-3">
            <div
               class="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"
            ></div>
            <span class="text-surface-500"
               >Running Monte Carlo simulation...</span
            >
         </div>
      {:else if mcResult}
         <p class="text-xs italic text-surface-400 dark:text-surface-500 py-2">
            Monte Carlo uses historically-sampled inflation and growth, not the
            configured values.
         </p>

         {#if mcResult.yearly_percentiles.length > 0}
            <h4
               class="text-sm font-semibold text-surface-600 dark:text-surface-400 mt-2"
            >
               Balance Distribution
            </h4>
            <FanChart
               percentiles={mcResult.yearly_percentiles}
               metric="balance"
               retirementAge={config?.retirement_age}
               startAge={config?.current_age_primary ?? 0}
               startYear={config?.start_year ?? 0}
            />

            <h4
               class="text-sm font-semibold text-surface-600 dark:text-surface-400 mt-4"
            >
               Spending Distribution
            </h4>
            <FanChart
               percentiles={mcResult.yearly_percentiles}
               metric="spending"
               retirementAge={config?.retirement_age}
               startAge={config?.current_age_primary ?? 0}
               startYear={config?.start_year ?? 0}
               helpTopic="spending-strategies"
            />
         {/if}

         <div class="card bg-surface-100 dark:bg-surface-800 p-4">
            <h3
               class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-2"
            >
               <ShieldCheck size={18} class="text-warning-500" /> Portfolio Depletion
            </h3>
            {#if Math.round((1 - mcResult.success_rate) * mcResult.num_simulations) === 0}
               <p class="text-success-600 dark:text-success-400 text-sm">
                  No simulations resulted in portfolio depletion.
               </p>
            {:else}
               <div class="flex gap-6 flex-wrap">
                  <div class="flex flex-col gap-0.5">
                     <span class="text-xs text-surface-500">Depleted</span>
                     <span class="text-base font-bold"
                        >{Math.round(
                           (1 - mcResult.success_rate) *
                              mcResult.num_simulations,
                        )} of {mcResult.num_simulations}</span
                     >
                  </div>
               </div>
            {/if}
         </div>

         <div class="flex items-center gap-4">
            <a
               href="/details"
               class="text-sm text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
               >View yearly percentiles &rarr;</a
            >
         </div>
      {/if}
   {/if}
</div>
