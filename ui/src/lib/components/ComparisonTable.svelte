<script lang="ts">
   import { currency } from '$lib/format';
   import TrafficLight from './TrafficLight.svelte';
   import HelpButton from './HelpButton.svelte';
   import { X } from 'lucide-svelte';
   import type { ComparisonEntry } from '$lib/types';

   let {
      entries,
      selectedIds,
      onselect,
      ondelete,
      onclear,
   }: {
      entries: ComparisonEntry[];
      selectedIds: string[];
      onselect: (id: string) => void;
      ondelete: (id: string) => void;
      onclear: () => void;
   } = $props();
</script>

<div class="card bg-surface-100 dark:bg-surface-800 p-4">
   <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-semibold text-surface-600 dark:text-surface-400">
         Scenarios
      </h3>
      {#if entries.length > 0}
         <button class="btn btn-sm preset-outlined" onclick={onclear}
            >Clear All</button
         >
      {/if}
   </div>

   {#if entries.length === 0}
      <p class="text-center py-6 text-surface-500 text-sm">
         No scenarios yet — run a simulation to add one.
      </p>
   {:else}
      <div class="overflow-x-auto">
         <table class="table table-sm">
            <thead>
               <tr>
                  <th class="w-8"></th>
                  <th>Infl</th>
                  <th>Growth</th>
                  <th class="text-left">Withdrawal</th>
                  <th class="text-left">Conversion</th>
                  <th
                     >After-Tax Balance <HelpButton
                        topic="after-tax-balance"
                     /></th
                  >
                  <th
                     ><div>Total Taxes</div>
                     <div class="font-normal text-xs">(PV $)</div></th
                  >
                  <th>MC</th>
                  <th class="w-8"></th>
               </tr>
            </thead>
            <tbody>
               {#each entries as entry (entry.id)}
                  {@const isSelected = selectedIds.includes(entry.id)}
                  {@const busy = entry.mcResult === null}
                  {@const singleDone = entry.singleResult !== null}
                  <tr
                     class="transition-colors {busy
                        ? ''
                        : 'cursor-pointer'} {isSelected
                        ? 'bg-primary-100/40 dark:bg-primary-900/30'
                        : busy
                          ? ''
                          : 'hover:bg-surface-200/50 dark:hover:bg-surface-700/50'}"
                     onclick={() => {
                        if (!busy) onselect(entry.id);
                     }}
                  >
                     <td>
                        {#if busy}
                           <div
                              class="w-4 h-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"
                              aria-label="Simulating"
                           ></div>
                        {:else}
                           <div
                              class="w-4 h-4 rounded-sm border-2 flex items-center justify-center {isSelected
                                 ? 'border-primary-500 bg-primary-500'
                                 : 'border-surface-400'}"
                           >
                              {#if isSelected}
                                 <svg
                                    viewBox="0 0 16 16"
                                    class="w-3 h-3 text-white"
                                    fill="currentColor"
                                 >
                                    <path
                                       d="M6.5 12.5L2 8l1.5-1.5L6.5 9.5 12.5 3.5 14 5z"
                                    />
                                 </svg>
                              {/if}
                           </div>
                        {/if}
                     </td>
                     <td class="text-sm"
                        >{(entry.inflationRate * 100).toFixed(1)}%</td
                     >
                     <td class="text-sm"
                        >{entry.conservativeGrowth ? 'Conserv.' : 'Normal'}</td
                     >
                     <td class="text-left text-sm">
                        <div class="font-medium">{entry.spendingStrategy}</div>
                        <div class="text-xs opacity-70">
                           {entry.withdrawalOrder === 'brk-first'
                              ? 'Brokerage first'
                              : 'IRA/401k first'}
                        </div>
                     </td>
                     <td class="text-left text-sm"
                        >{entry.conversionStrategy}</td
                     >
                     <td class="text-sm font-medium">
                        {#if singleDone}
                           {currency(entry.afterTaxFinalBalance)}
                        {:else}
                           <span class="text-surface-400">—</span>
                        {/if}
                     </td>
                     <td class="text-sm">
                        {#if singleDone}
                           {currency(entry.totalTaxesPV)}
                        {:else}
                           <span class="text-surface-400">—</span>
                        {/if}
                     </td>
                     <td>
                        {#if entry.mcSuccessRate != null}
                           <TrafficLight rate={entry.mcSuccessRate} />
                        {:else}
                           <span class="text-surface-400">—</span>
                        {/if}
                     </td>
                     <td>
                        {#if !busy}
                           <button
                              class="btn btn-sm p-0.5 preset-ghost text-surface-400 hover:text-error-500"
                              onclick={(e) => {
                                 e.stopPropagation();
                                 ondelete(entry.id);
                              }}
                              aria-label="Remove scenario"
                           >
                              <X size={14} />
                           </button>
                        {/if}
                     </td>
                  </tr>
               {/each}
            </tbody>
         </table>
      </div>
   {/if}
</div>
