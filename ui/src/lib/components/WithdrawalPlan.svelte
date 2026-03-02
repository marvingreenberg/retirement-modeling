<script lang="ts">
   import type {
      YearResult,
      AccountWithdrawal,
      SpendingStrategy,
   } from '$lib/types';
   import { currency } from '$lib/format';
   import { ClipboardList } from 'lucide-svelte';

   let {
      years,
      spendingStrategy = 'fixed_dollar',
      withdrawalRate = 0.04,
   }: {
      years: YearResult[];
      spendingStrategy?: SpendingStrategy;
      withdrawalRate?: number;
   } = $props();

   let planYears = $derived(years.slice(0, 2));

   function byPurpose(
      details: AccountWithdrawal[] | undefined,
      purpose: string,
   ): AccountWithdrawal[] {
      return (details ?? []).filter((d) => d.purpose === purpose);
   }

   function totalForPurpose(
      details: AccountWithdrawal[] | undefined,
      purpose: string,
   ): number {
      return byPurpose(details, purpose).reduce((sum, d) => sum + d.amount, 0);
   }

   function strategyLabel(yr: YearResult): string {
      const hasConvTax = yr.conversion_tax > 0;
      const taxSuffix = hasConvTax ? ' + conv tax' : '';
      if (spendingStrategy === 'fixed_dollar') {
         return `Fixed Cash Flow + tax${taxSuffix}`;
      }
      if (spendingStrategy === 'percent_of_portfolio') {
         const rate = Math.round(withdrawalRate * 1000) / 10;
         const totalWD =
            yr.pretax_withdrawal + yr.roth_withdrawal + yr.brokerage_withdrawal;
         return `${rate}% \u2192 ${currency(totalWD)} (target ${currency(yr.spending_target)})`;
      }
      if (spendingStrategy === 'guardrails') {
         const totalWD =
            yr.pretax_withdrawal + yr.roth_withdrawal + yr.brokerage_withdrawal;
         return `Guardrails \u2192 ${currency(totalWD)} (target ${currency(yr.spending_target)})`;
      }
      return '';
   }

   function netCashFlow(yr: YearResult): number {
      const totalWD = totalForPurpose(yr.withdrawal_details, 'spending');
      return yr.total_income + totalWD + yr.rmd - yr.total_tax;
   }
</script>

<div class="card bg-surface-100 dark:bg-surface-800 p-4 mb-4">
   <h3
      class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-2"
   >
      <ClipboardList size={18} class="text-primary-500" /> Withdrawal Plan
   </h3>
   <div class="grid gap-4 {planYears.length > 1 ? 'md:grid-cols-2' : ''}">
      {#each planYears as yr (yr.year)}
         <div
            class="rounded-lg bg-surface-50 dark:bg-surface-700 p-3 space-y-2"
         >
            <div class="font-medium text-surface-900 dark:text-surface-100">
               {yr.year} &middot; Age {yr.age_primary}
            </div>

            {#if strategyLabel(yr)}
               <div
                  class="text-xs text-surface-500 dark:text-surface-400 italic"
               >
                  {strategyLabel(yr)}
               </div>
            {/if}

            <div class="text-sm space-y-1">
               <div class="flex justify-between">
                  <span class="text-surface-600 dark:text-surface-300"
                     >Spending Target</span
                  >
                  <span class="font-medium">{currency(yr.spending_target)}</span
                  >
               </div>

               {#if yr.surplus > 0}
                  <div class="flex justify-between">
                     <span class="text-surface-600 dark:text-surface-300"
                        >Income Surplus</span
                     >
                     <span class="text-success-600 dark:text-success-400"
                        >{currency(yr.surplus)}</span
                     >
                  </div>
               {/if}

               {#if (yr.income_details ?? []).length > 0}
                  <div
                     class="pt-1 border-t border-surface-200 dark:border-surface-600"
                  >
                     <div class="flex justify-between font-medium">
                        <span>Income</span>
                        <span>{currency(yr.total_income)}</span>
                     </div>
                     {#each yr.income_details ?? [] as inc (inc.name)}
                        <div
                           class="flex justify-between pl-3 text-surface-500 dark:text-surface-400"
                        >
                           <span>{inc.name}</span>
                           <span>{currency(inc.amount)}</span>
                        </div>
                     {/each}
                  </div>
               {/if}

               {#if byPurpose(yr.withdrawal_details, 'rmd').length > 0}
                  <div
                     class="pt-1 border-t border-surface-200 dark:border-surface-600"
                  >
                     <div class="flex justify-between font-medium">
                        <span>RMD</span>
                        <span>{currency(yr.rmd)}</span>
                     </div>
                     {#each byPurpose(yr.withdrawal_details, 'rmd') as d (d.account_name)}
                        <div
                           class="flex justify-between pl-3 text-surface-500 dark:text-surface-400"
                        >
                           <span>{d.account_name}</span>
                           <span>{currency(d.amount)}</span>
                        </div>
                     {/each}
                  </div>
               {/if}

               {#if byPurpose(yr.withdrawal_details, 'spending').length > 0}
                  <div
                     class="pt-1 border-t border-surface-200 dark:border-surface-600"
                  >
                     <div class="flex justify-between font-medium">
                        <span>Withdrawals</span>
                        <span
                           >{currency(
                              totalForPurpose(
                                 yr.withdrawal_details,
                                 'spending',
                              ),
                           )}</span
                        >
                     </div>
                     {#each byPurpose(yr.withdrawal_details, 'spending') as d (d.account_name)}
                        <div
                           class="flex justify-between pl-3 text-surface-500 dark:text-surface-400"
                        >
                           <span>{d.account_name}</span>
                           <span>{currency(d.amount)}</span>
                        </div>
                     {/each}
                  </div>
               {/if}

               {#if yr.roth_conversion > 0}
                  <div
                     class="pt-1 border-t border-surface-200 dark:border-surface-600"
                  >
                     <div class="flex justify-between font-medium">
                        <span>Roth Conversion</span>
                        <span>{currency(yr.roth_conversion)}</span>
                     </div>
                     {#each byPurpose(yr.withdrawal_details, 'conversion') as d (d.account_name)}
                        <div
                           class="flex justify-between pl-3 text-surface-500 dark:text-surface-400"
                        >
                           <span>{d.account_name}</span>
                           <span>{currency(d.amount)}</span>
                        </div>
                     {/each}
                  </div>
               {/if}

               <div
                  class="pt-1 border-t border-surface-200 dark:border-surface-600"
               >
                  <div class="flex justify-between font-medium">
                     <span>Taxes</span>
                     <span>{currency(yr.total_tax)}</span>
                  </div>
                  {#if yr.income_tax > 0 && (yr.irmaa_cost > 0 || yr.conversion_tax > 0)}
                     <div
                        class="flex justify-between pl-3 text-surface-500 dark:text-surface-400"
                     >
                        <span>Income Tax</span>
                        <span>{currency(yr.income_tax)}</span>
                     </div>
                  {/if}
                  {#if yr.irmaa_cost > 0}
                     <div
                        class="flex justify-between pl-3 text-surface-500 dark:text-surface-400"
                     >
                        <span>IRMAA Surcharge</span>
                        <span>{currency(yr.irmaa_cost)}</span>
                     </div>
                  {/if}
                  {#if yr.conversion_tax > 0}
                     <div
                        class="flex justify-between pl-3 text-surface-500 dark:text-surface-400"
                     >
                        <span>Conversion Tax</span>
                        <span>{currency(yr.conversion_tax)}</span>
                     </div>
                  {/if}
               </div>

               {#if true}
                  {@const ncf = netCashFlow(yr)}
                  <div
                     class="pt-1 border-t border-surface-200 dark:border-surface-600"
                  >
                     <div class="flex justify-between font-medium">
                        <span>Net Cash Flow</span>
                        <span
                           class={ncf < yr.spending_target
                              ? 'text-error-600 dark:text-error-400'
                              : ''}>{currency(ncf)}</span
                        >
                     </div>
                  </div>
               {/if}
            </div>
         </div>
      {/each}
   </div>
</div>
