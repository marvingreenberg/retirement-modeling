<script lang="ts">
   import { comparisonSnapshots } from '$lib/stores';
   import { currency, pct } from '$lib/format';
   import type { ComparisonSnapshot } from '$lib/types';

   let snapshots = $derived($comparisonSnapshots);
   let singleRuns = $derived(snapshots.filter((s) => s.runType === 'single'));
   let mcRuns = $derived(snapshots.filter((s) => s.runType === 'monte_carlo'));

   function bestIn(
      snaps: ComparisonSnapshot[],
      key: keyof ComparisonSnapshot,
      mode: 'max' | 'min',
   ): number {
      const vals = snaps
         .map((s) => s[key] as number)
         .filter((v) => v != null && v > 0);
      if (vals.length === 0) return 0;
      return mode === 'max' ? Math.max(...vals) : Math.min(...vals);
   }

   let bestSingleBalance = $derived(bestIn(singleRuns, 'finalBalance', 'max'));
   let bestSingleTax = $derived(bestIn(singleRuns, 'totalTaxes', 'min'));
   let bestSingleIrmaa = $derived(bestIn(singleRuns, 'totalIrmaa', 'min'));
   let bestMcBalance = $derived(bestIn(mcRuns, 'finalBalance', 'max'));
   let bestMcSuccess = $derived(bestIn(mcRuns, 'successRate', 'max'));

   function removeSnapshot(id: string) {
      comparisonSnapshots.update((snaps) => snaps.filter((s) => s.id !== id));
   }
   function clearAll() {
      comparisonSnapshots.set([]);
   }
</script>

<div class="space-y-6">
   {#if snapshots.length === 0}
      <div class="text-center py-12 text-surface-500">
         <p class="text-lg font-medium mb-2">No comparisons yet</p>
         <p class="text-sm">
            Run a simulation from Overview — each run is automatically added
            here.
         </p>
      </div>
   {:else}
      <div class="flex justify-end">
         <button class="btn btn-sm preset-outlined" onclick={clearAll}
            >Clear All</button
         >
      </div>

      {#if singleRuns.length > 0}
         <div>
            <h3
               class="text-sm font-semibold mb-2 text-surface-600 dark:text-surface-400"
            >
               Single Run
            </h3>
            <div class="overflow-x-auto">
               <table class="table table-sm">
                  <thead>
                     <tr>
                        <th>Inflation</th>
                        <th>Growth</th>
                        <th class="text-left">Withdrawal</th>
                        <th class="text-left">Conversion</th>
                        <th>Final Balance</th>
                        <th>Total Taxes</th>
                        <th>Total IRMAA</th>
                        <th>Roth Conv Acct</th>
                        <th></th>
                     </tr>
                  </thead>
                  <tbody>
                     {#each singleRuns as snap (snap.id)}
                        <tr>
                           <td>{pct(snap.inflationRate)}</td>
                           <td>{pct(snap.growthRate)}</td>
                           <td class="text-left">{snap.spendingStrategy}</td>
                           <td class="text-left">{snap.conversionStrategy}</td>
                           <td
                              class:font-bold={snap.finalBalance ===
                                 bestSingleBalance}
                              class:text-success-600={snap.finalBalance ===
                                 bestSingleBalance}
                              >{currency(snap.finalBalance)}</td
                           >
                           <td
                              class:font-bold={snap.totalTaxes > 0 &&
                                 snap.totalTaxes === bestSingleTax}
                              class:text-success-600={snap.totalTaxes > 0 &&
                                 snap.totalTaxes === bestSingleTax}
                              >{snap.totalTaxes > 0
                                 ? currency(snap.totalTaxes)
                                 : '—'}</td
                           >
                           <td
                              class:font-bold={snap.totalIrmaa > 0 &&
                                 snap.totalIrmaa === bestSingleIrmaa}
                              class:text-success-600={snap.totalIrmaa > 0 &&
                                 snap.totalIrmaa === bestSingleIrmaa}
                              >{snap.totalIrmaa >= 0
                                 ? currency(snap.totalIrmaa)
                                 : '—'}</td
                           >
                           <td
                              >{snap.totalRothConversions > 0
                                 ? currency(snap.totalRothConversions)
                                 : '—'}</td
                           >
                           <td>
                              <button
                                 class="btn preset-outlined btn-sm"
                                 onclick={() => removeSnapshot(snap.id)}
                                 >✕</button
                              >
                           </td>
                        </tr>
                     {/each}
                  </tbody>
               </table>
            </div>
         </div>
      {/if}

      {#if mcRuns.length > 0}
         <div>
            <h3
               class="text-sm font-semibold mb-2 text-surface-600 dark:text-surface-400"
            >
               Monte Carlo
            </h3>
            <div class="overflow-x-auto">
               <table class="table table-sm">
                  <thead>
                     <tr>
                        <th class="text-left">Withdrawal</th>
                        <th class="text-left">Conversion</th>
                        <th>Simulations</th>
                        <th>Median Final Balance</th>
                        <th>Success Rate</th>
                        <th></th>
                     </tr>
                  </thead>
                  <tbody>
                     {#each mcRuns as snap (snap.id)}
                        <tr>
                           <td class="text-left">{snap.spendingStrategy}</td>
                           <td class="text-left">{snap.conversionStrategy}</td>
                           <td>{snap.numSimulations}</td>
                           <td
                              class:font-bold={snap.finalBalance ===
                                 bestMcBalance}
                              class:text-success-600={snap.finalBalance ===
                                 bestMcBalance}
                              >{currency(snap.finalBalance)}</td
                           >
                           <td
                              class:font-bold={snap.successRate != null &&
                                 snap.successRate === bestMcSuccess}
                              class:text-success-600={snap.successRate !=
                                 null && snap.successRate === bestMcSuccess}
                              >{snap.successRate != null
                                 ? pct(snap.successRate)
                                 : '—'}</td
                           >
                           <td>
                              <button
                                 class="btn preset-outlined btn-sm"
                                 onclick={() => removeSnapshot(snap.id)}
                                 >✕</button
                              >
                           </td>
                        </tr>
                     {/each}
                  </tbody>
               </table>
            </div>
         </div>
      {/if}
   {/if}
</div>
