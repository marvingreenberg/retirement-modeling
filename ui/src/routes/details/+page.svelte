<script lang="ts">
   import { simulationResults, profile, portfolio } from '$lib/stores';
   import { currency } from '$lib/format';
   import { TableProperties, TrendingUp, Download } from 'lucide-svelte';
   import WithdrawalPlan from '$lib/components/WithdrawalPlan.svelte';
   import { generateTextReport } from '$lib/textReport';
   import { saveTextFile, generateFilename } from '$lib/fileIO';
   import { effectiveTaxRate, taxRateColor } from '$lib/effectiveTaxRate';
   import { getVisibleColumns } from '$lib/columnVisibility';

   let activeTab = $state<'single' | 'monte_carlo'>('single');
   let hasAny = $derived(
      simulationResults.value.singleResult !== null ||
         simulationResults.value.mcResult !== null,
   );

   async function downloadReport() {
      if (!simulationResults.value.singleResult) return;
      const text = generateTextReport(simulationResults.value.singleResult);
      const base = generateFilename(
         profile.value.primaryName,
         profile.value.spouseName,
      ).replace(/\.json$/, '');
      await saveTextFile(text, `${base}-Report.txt`);
   }
</script>

<h2 class="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-4">
   Detailed Results
</h2>

{#if hasAny}
   <div
      class="flex gap-1 border-b border-surface-300 dark:border-surface-700 mb-4"
   >
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
         'monte_carlo'
            ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
            : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}"
         onclick={() => (activeTab = 'monte_carlo')}
      >
         Monte Carlo
      </button>
   </div>

   {#if activeTab === 'single'}
      {#if simulationResults.value.singleResult}
         {@const allYears = simulationResults.value.singleResult.result.years}
         {@const depletionIdx = allYears.findIndex(
            (yr, i) => yr.total_balance <= 0 && i > 0,
         )}
         {@const years =
            depletionIdx >= 0 ? allYears.slice(0, depletionIdx + 1) : allYears}
         {@const columnVis = getVisibleColumns(years)}
         {@const inflationRate = portfolio.value.config.inflation_rate}
         {@const cumTaxPV = years.reduce<number[]>((acc, yr, i) => {
            const pvTax = yr.total_tax / Math.pow(1 + inflationRate, i);
            acc.push((acc[i - 1] ?? 0) + pvTax);
            return acc;
         }, [])}
         <WithdrawalPlan
            {years}
            spendingStrategy={portfolio.value.config.spending_strategy}
            withdrawalRate={portfolio.value.config.withdrawal_rate}
         />
         <div class="card bg-surface-100 dark:bg-surface-800 p-4">
            <div class="flex items-center justify-between mb-3">
               <h3
                  class="text-base font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2"
               >
                  <TableProperties size={18} class="text-primary-500" /> Year-by-Year
                  Detail
               </h3>
               <button
                  class="btn btn-sm preset-tonal flex items-center gap-1"
                  onclick={downloadReport}
               >
                  <Download size={14} /> Download Report
               </button>
            </div>
            <div class="overflow-x-auto">
               <table class="table table-sm">
                  <thead>
                     <tr>
                        <th>Year</th>
                        <th
                           ><div>Total</div>
                           <div>Balance</div></th
                        >
                        <th>AGI</th>
                        <th
                           ><div>Eff Tax</div>
                           <div>Rate</div></th
                        >
                        <th>Spending</th>
                        {#if columnVis.dep401k}<th
                              ><div>401k</div>
                              <div>Dep</div></th
                           >{/if}
                        <th
                           ><div>Income</div>
                           <div>Tax</div></th
                        >
                        {#if columnVis.capGainsTax}<th
                              ><div>Cap Gains</div>
                              <div>Tax</div></th
                           >{/if}
                        {#if columnVis.convTax}<th
                              ><div>Conv</div>
                              <div>Tax</div></th
                           >{/if}
                        <th
                           ><div>∑ Tax</div>
                           <div>PV</div></th
                        >
                        {#if columnVis.rothConv}<th
                              ><div>Roth</div>
                              <div>Conv</div></th
                           >{/if}
                        {#if columnVis.irmaa}<th>IRMAA</th>{/if}
                        {#if columnVis.income}<th>Income</th>{/if}
                        {#if columnVis.brokerageWd}<th
                              ><div>Brokerage</div>
                              <div>WD</div></th
                           >{/if}
                        {#if columnVis.pretaxWd}<th
                              ><div>PreTax</div>
                              <div>WD</div></th
                           >{/if}
                        {#if columnVis.rothWd}<th
                              ><div>Roth</div>
                              <div>WD</div></th
                           >{/if}
                     </tr>
                  </thead>
                  <tbody>
                     {#each years as yr, i (yr.year)}
                        {@const rate = effectiveTaxRate(yr)}
                        <tr
                           class={yr.total_balance <= 0
                              ? 'text-error-500 dark:text-error-400'
                              : ''}
                        >
                           <td>{yr.year}</td>
                           <td>{currency(yr.total_balance)}</td>
                           <td>{currency(yr.agi)}</td>
                           <td style="color: {taxRateColor(rate)}"
                              >{(rate * 100).toFixed(1)}%</td
                           >
                           <td>{currency(yr.spending_target)}</td>
                           {#if columnVis.dep401k}<td
                                 >{currency(
                                    yr.pretax_401k_deposit +
                                       yr.roth_401k_deposit,
                                 )}</td
                              >{/if}
                           <td>{currency(yr.income_tax)}</td>
                           {#if columnVis.capGainsTax}<td
                                 >{currency(yr.brokerage_gains_tax)}</td
                              >{/if}
                           {#if columnVis.convTax}<td
                                 >{currency(yr.conversion_tax)}</td
                              >{/if}
                           <td>{currency(cumTaxPV[i])}</td>
                           {#if columnVis.rothConv}<td
                                 >{currency(yr.roth_conversion)}</td
                              >{/if}
                           {#if columnVis.irmaa}<td
                                 >{currency(yr.irmaa_cost)}</td
                              >{/if}
                           {#if columnVis.income}<td
                                 >{currency(yr.total_income)}</td
                              >{/if}
                           {#if columnVis.brokerageWd}<td
                                 >{currency(yr.brokerage_withdrawal)}</td
                              >{/if}
                           {#if columnVis.pretaxWd}<td
                                 >{currency(yr.pretax_withdrawal)}</td
                              >{/if}
                           {#if columnVis.rothWd}<td
                                 >{currency(yr.roth_withdrawal)}</td
                              >{/if}
                        </tr>
                     {/each}
                  </tbody>
               </table>
            </div>
            {#if depletionIdx >= 0}
               <p
                  class="text-error-600 dark:text-error-400 font-semibold text-sm mt-3 text-center"
               >
                  Portfolio depleted at age {allYears[depletionIdx].age_primary} —
                  remaining years omitted
               </p>
            {/if}
         </div>
      {:else}
         <p class="text-surface-500">
            Single simulation results not yet available.
         </p>
      {/if}
   {:else if activeTab === 'monte_carlo'}
      {#if simulationResults.value.mcResult}
         {@const percentiles =
            simulationResults.value.mcResult.yearly_percentiles}
         <div class="card bg-surface-100 dark:bg-surface-800 p-4">
            <h3
               class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-2"
            >
               <TrendingUp size={18} class="text-tertiary-500" /> Yearly Balance Percentiles
            </h3>
            {#if percentiles.length > 0}
               <div class="overflow-x-auto">
                  <table class="table table-sm">
                     <thead>
                        <tr>
                           <th>Age</th><th>5th</th><th>25th</th><th>Median</th
                           ><th>75th</th><th>95th</th>
                        </tr>
                     </thead>
                     <tbody>
                        {#each percentiles as p (p.age)}
                           <tr>
                              <td>{p.age}</td>
                              <td>{currency(p.balance_p5)}</td>
                              <td>{currency(p.balance_p25)}</td>
                              <td>{currency(p.balance_median)}</td>
                              <td>{currency(p.balance_p75)}</td>
                              <td>{currency(p.balance_p95)}</td>
                           </tr>
                        {/each}
                     </tbody>
                  </table>
               </div>
            {:else}
               <p class="text-surface-500 text-sm">
                  No yearly percentile data available.
               </p>
            {/if}
         </div>

         <div class="card bg-surface-100 dark:bg-surface-800 p-4">
            <h3
               class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-2"
            >
               <TrendingUp size={18} class="text-success-500" /> Yearly Spending Percentiles
            </h3>
            {#if percentiles.length > 0}
               <div class="overflow-x-auto">
                  <table class="table table-sm">
                     <thead>
                        <tr>
                           <th>Age</th><th>5th</th><th>25th</th><th>Median</th
                           ><th>75th</th><th>95th</th>
                        </tr>
                     </thead>
                     <tbody>
                        {#each percentiles as p (p.age)}
                           <tr>
                              <td>{p.age}</td>
                              <td>{currency(p.spending_p5)}</td>
                              <td>{currency(p.spending_p25)}</td>
                              <td>{currency(p.spending_median)}</td>
                              <td>{currency(p.spending_p75)}</td>
                              <td>{currency(p.spending_p95)}</td>
                           </tr>
                        {/each}
                     </tbody>
                  </table>
               </div>
            {:else}
               <p class="text-surface-500 text-sm">
                  No yearly percentile data available.
               </p>
            {/if}
         </div>
      {:else}
         <p class="text-surface-500">Monte Carlo results not yet available.</p>
      {/if}
   {/if}
{:else}
   <p class="text-surface-500">Run a simulation to see detailed results.</p>
{/if}
