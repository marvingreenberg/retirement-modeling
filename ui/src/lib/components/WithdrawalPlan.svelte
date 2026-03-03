<script lang="ts">
   import type {
      YearResult,
      AccountWithdrawal,
      SpendingStrategy,
      Account,
      PlannedExpense,
   } from '$lib/types';
   import { currency } from '$lib/format';
   import { portfolio, profile } from '$lib/stores';
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
   let accounts = $derived(($portfolio?.accounts ?? []) as Account[]);
   let hasSpouse = $derived(!!$profile.spouseName?.trim());
   let annualSpendNet = $derived($portfolio?.config?.annual_spend_net ?? 0);

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

   function ownerOf(accountId: string): string {
      return accounts.find((a) => a.id === accountId)?.owner ?? 'primary';
   }

   function rmdByPerson(
      details: AccountWithdrawal[] | undefined,
   ): { label: string; amount: number }[] {
      const rmdEntries = byPurpose(details, 'rmd');
      if (rmdEntries.length === 0) return [];
      if (!hasSpouse) {
         const total = rmdEntries.reduce((s, d) => s + d.amount, 0);
         return [{ label: $profile.primaryName || 'Primary', amount: total }];
      }
      const byOwner: Record<string, number> = {};
      for (const d of rmdEntries) {
         const owner = ownerOf(d.account_id);
         const key = owner === 'spouse' ? 'spouse' : 'primary';
         byOwner[key] = (byOwner[key] ?? 0) + d.amount;
      }
      const result: { label: string; amount: number }[] = [];
      if (byOwner['primary'])
         result.push({
            label: $profile.primaryName || 'Primary',
            amount: byOwner['primary'],
         });
      if (byOwner['spouse'])
         result.push({
            label: $profile.spouseName || 'Spouse',
            amount: byOwner['spouse'],
         });
      return result;
   }

   function activeExpenses(yr: YearResult): { name: string; amount: number }[] {
      const expenses: PlannedExpense[] =
         $portfolio?.config?.planned_expenses ?? [];
      return expenses
         .filter((e) => {
            if (e.expense_type === 'one_time') return e.year === yr.year;
            const start = e.start_year ?? 0;
            const end = e.end_year ?? 9999;
            return start <= yr.year && yr.year <= end;
         })
         .map((e) => ({ name: e.name, amount: e.amount }));
   }

   function strategyLabel(yr: YearResult): string {
      const baseSpending = yr.spending_target - yr.planned_expense;
      if (spendingStrategy === 'fixed_dollar') {
         return `Fixed ${currency(baseSpending)}`;
      }
      if (spendingStrategy === 'percent_of_portfolio') {
         const rate = Math.round(withdrawalRate * 1000) / 10;
         return `${rate}% of Portfolio \u2192 ${currency(baseSpending)}   desired ${currency(annualSpendNet)}`;
      }
      if (spendingStrategy === 'guardrails') {
         const effectiveRate =
            yr.total_balance > 0
               ? Math.round((baseSpending / yr.total_balance) * 1000) / 10
               : 0;
         return `Guardrails ${effectiveRate}% \u2192 ${currency(baseSpending)}   desired ${currency(annualSpendNet)}`;
      }
      return '';
   }

   function yearHeader(yr: YearResult): string {
      const primary = $profile.primaryName || 'Primary';
      if (hasSpouse) {
         const spouse = $profile.spouseName;
         return `${yr.year} \u00b7 ${primary} ${yr.age_primary}, ${spouse} ${yr.age_spouse}`;
      }
      return `${yr.year} \u00b7 ${primary} ${yr.age_primary}`;
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
         {@const rmdItems = rmdByPerson(yr.withdrawal_details)}
         {@const hasRmd = rmdItems.length > 0}
         {@const spendingWDs = byPurpose(yr.withdrawal_details, 'spending')}
         {@const hasIncome = (yr.income_details ?? []).length > 0}
         {@const expenses = activeExpenses(yr)}
         {@const hasExpenses = yr.planned_expense > 0}
         {@const baseSpending = yr.spending_target - yr.planned_expense}
         {@const taxWDs = byPurpose(yr.withdrawal_details, 'tax')}
         {@const totalWithdrawals =
            totalForPurpose(yr.withdrawal_details, 'spending') +
            totalForPurpose(yr.withdrawal_details, 'tax')}
         {@const hasWithdrawals = totalWithdrawals > 0}
         <div
            class="rounded-lg bg-surface-50 dark:bg-surface-700 p-3 space-y-2"
         >
            <!-- Header -->
            <div class="font-medium text-surface-900 dark:text-surface-100">
               {yearHeader(yr)}
            </div>

            <!-- Strategy line -->
            {#if strategyLabel(yr)}
               <div
                  class="text-xs text-surface-500 dark:text-surface-400 italic"
               >
                  {strategyLabel(yr)}
               </div>
            {/if}

            <div class="text-sm space-y-1">
               <!-- ═══ SOURCES ═══ -->
               <div
                  class="pt-1 border-t-2 border-surface-300 dark:border-surface-500 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400"
               >
                  Sources
               </div>

               <!-- RMD -->
               {#if hasRmd}
                  <div>
                     <div class="flex justify-between font-medium">
                        <span>RMD</span>
                        <span>{currency(yr.rmd)}</span>
                     </div>
                     {#if hasSpouse}
                        {#each rmdItems as item (item.label)}
                           <div
                              class="flex justify-between pl-3 text-surface-500 dark:text-surface-400"
                           >
                              <span>{item.label}</span>
                              <span>{currency(item.amount)}</span>
                           </div>
                        {/each}
                     {/if}
                  </div>
               {/if}

               <!-- Income -->
               {#if hasIncome}
                  <div>
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

               <!-- Withdrawals -->
               {#if hasWithdrawals}
                  <div>
                     <div class="flex justify-between font-medium">
                        <span
                           >{hasRmd
                              ? 'Additional Withdrawals'
                              : 'Withdrawals'}</span
                        >
                        <span>{currency(totalWithdrawals)}</span>
                     </div>
                     {#each [...spendingWDs, ...taxWDs] as d (d.account_name + d.purpose)}
                        <div
                           class="flex justify-between pl-3 text-surface-500 dark:text-surface-400"
                        >
                           <span>{d.account_name}</span>
                           <span>{currency(d.amount)}</span>
                        </div>
                     {/each}
                  </div>
               {/if}

               <!-- Italic placeholders for missing sources -->
               {#if !hasRmd || !hasIncome || !hasWithdrawals}
                  <div
                     class="text-xs italic text-surface-400 dark:text-surface-500"
                  >
                     {[
                        ...(!hasRmd ? ['No RMD'] : []),
                        ...(!hasIncome ? ['No Income'] : []),
                        ...(!hasWithdrawals
                           ? [hasRmd ? 'No Additional WD' : '']
                           : []),
                     ]
                        .filter(Boolean)
                        .join(', ')}
                  </div>
               {/if}

               <!-- ═══ USES ═══ -->
               <div
                  class="pt-1 border-t-2 border-surface-300 dark:border-surface-500 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400"
               >
                  Uses
               </div>

               <!-- Spending -->
               <div>
                  <div class="flex justify-between font-medium">
                     <span>Spending</span>
                     <span>{currency(baseSpending)}</span>
                  </div>
                  {#if spendingStrategy !== 'fixed_dollar' && annualSpendNet > 0 && baseSpending < annualSpendNet * 0.95}
                     <div
                        class="text-xs text-warning-600 dark:text-warning-400 pl-3"
                     >
                        Below desired {currency(annualSpendNet)}
                     </div>
                  {/if}
               </div>

               <!-- Planned Expenses -->
               {#if hasExpenses}
                  <div>
                     <div class="flex justify-between font-medium">
                        <span>Planned Expenses</span>
                        <span>{currency(yr.planned_expense)}</span>
                     </div>
                     {#each expenses as exp (exp.name)}
                        <div
                           class="flex justify-between pl-3 text-surface-500 dark:text-surface-400"
                        >
                           <span>{exp.name}</span>
                           <span>{currency(exp.amount)}</span>
                        </div>
                     {/each}
                  </div>
               {/if}

               <!-- Taxes -->
               <div>
                  <div class="flex justify-between font-medium">
                     <span>Taxes</span>
                     <span>{currency(yr.total_tax + yr.irmaa_cost)}</span>
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
                        <span>IRMAA</span>
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

               <!-- Surplus -->
               {#if yr.surplus > 0}
                  <div>
                     <div class="flex justify-between font-medium">
                        <span>Surplus &rarr; Reinvested</span>
                        <span class="text-success-600 dark:text-success-400"
                           >{currency(yr.surplus)}</span
                        >
                     </div>
                  </div>
               {/if}

               <!-- ═══ ROTH CONVERSION ═══ -->

               {#if yr.roth_conversion > 0}
                  <div
                     class="pt-1 border-t-2 border-surface-300 dark:border-surface-500"
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
               {:else}
                  <div
                     class="pt-1 border-t-2 border-surface-300 dark:border-surface-500 text-xs italic text-surface-400 dark:text-surface-500"
                  >
                     No Roth Conversion
                  </div>
               {/if}
            </div>
         </div>
      {/each}
   </div>
</div>
