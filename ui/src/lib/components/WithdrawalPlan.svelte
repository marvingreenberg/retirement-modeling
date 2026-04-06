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
   import { CURRENCY_EPSILON } from '$lib/columnVisibility';
   import { SvelteMap } from 'svelte/reactivity';
   import { ClipboardList } from 'lucide-svelte';

   let {
      years,
      yearIndex = 0,
      spendingStrategy = 'fixed_dollar',
      withdrawalRate = 0.04,
   }: {
      years: YearResult[];
      yearIndex?: number;
      spendingStrategy?: SpendingStrategy;
      withdrawalRate?: number;
   } = $props();

   let yr = $derived(years[yearIndex] ?? years[0]);
   let accounts = $derived((portfolio.value?.accounts ?? []) as Account[]);
   let hasSpouse = $derived(!!profile.value.spouseName?.trim());
   let annualSpendNet = $derived(
      portfolio.value?.config?.annual_spend_net ?? 0,
   );

   let rmdItems = $derived(rmdByPerson(yr?.withdrawal_details));
   let hasRmd = $derived(rmdItems.length > 0);
   let cashWDs = $derived(
      mergeByAccount(
         (yr?.withdrawal_details ?? []).filter(
            (d) => d.purpose === 'spending' || d.purpose === 'tax',
         ),
      ),
   );
   let hasIncome = $derived((yr?.income_details ?? []).length > 0);
   let expenses = $derived(yr ? activeExpenses(yr) : []);
   let hasExpenses = $derived(
      yr ? yr.planned_expense > CURRENCY_EPSILON : false,
   );
   let baseSpending = $derived(
      yr ? yr.spending_target - yr.planned_expense : 0,
   );
   let totalWithdrawals = $derived(cashWDs.reduce((s, d) => s + d.amount, 0));
   let hasWithdrawals = $derived(totalWithdrawals > CURRENCY_EPSILON);

   function byPurpose(
      details: AccountWithdrawal[] | undefined,
      purpose: string,
   ): AccountWithdrawal[] {
      return (details ?? []).filter((d) => d.purpose === purpose);
   }

   function mergeByAccount(
      entries: AccountWithdrawal[],
   ): { account_id: string; account_name: string; amount: number }[] {
      const map = new SvelteMap<
         string,
         { account_id: string; account_name: string; amount: number }
      >();
      for (const d of entries) {
         const existing = map.get(d.account_id);
         if (existing) existing.amount += d.amount;
         else map.set(d.account_id, { ...d });
      }
      return [...map.values()];
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
         return [
            { label: profile.value.primaryName || 'Primary', amount: total },
         ];
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
            label: profile.value.primaryName || 'Primary',
            amount: byOwner['primary'],
         });
      if (byOwner['spouse'])
         result.push({
            label: profile.value.spouseName || 'Spouse',
            amount: byOwner['spouse'],
         });
      return result;
   }

   function activeExpenses(y: YearResult): { name: string; amount: number }[] {
      const expenseList: PlannedExpense[] =
         portfolio.value?.config?.planned_expenses ?? [];
      return expenseList
         .filter((e) => {
            if (e.expense_type === 'one_time') return e.year === y.year;
            const start = e.start_year ?? 0;
            const end = e.end_year ?? 9999;
            return start <= y.year && y.year <= end;
         })
         .map((e) => ({ name: e.name, amount: e.amount }));
   }

   function strategyLabel(y: YearResult): string {
      const base = y.spending_target - y.planned_expense;
      if (spendingStrategy === 'fixed_dollar') {
         return `Fixed ${currency(base)}`;
      }
      if (spendingStrategy === 'percent_of_portfolio') {
         const rate = Math.round(withdrawalRate * 1000) / 10;
         return `${rate}% of Portfolio \u2192 ${currency(base)}   desired ${currency(annualSpendNet)}`;
      }
      if (spendingStrategy === 'guardrails') {
         const effectiveRate =
            y.total_balance > 0
               ? Math.round((base / y.total_balance) * 1000) / 10
               : 0;
         return `Guardrails ${effectiveRate}% \u2192 ${currency(base)}   desired ${currency(annualSpendNet)}`;
      }
      return '';
   }

   function yearHeader(y: YearResult): string {
      const primary = profile.value.primaryName || 'Primary';
      if (hasSpouse) {
         const spouse = profile.value.spouseName;
         return `${y.year} \u00b7 ${primary} ${y.age_primary}, ${spouse} ${y.age_spouse}`;
      }
      return `${y.year} \u00b7 ${primary} ${y.age_primary}`;
   }
</script>

<div class="card bg-surface-100 dark:bg-surface-800 p-4 mb-4">
   <h3
      class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-2"
   >
      <ClipboardList size={18} class="text-primary-500" /> Withdrawal Plan
   </h3>
   {#if yr}
      <div class="rounded-lg bg-surface-50 dark:bg-surface-700 p-3 space-y-2">
         <!-- Header -->
         <div class="font-medium text-surface-900 dark:text-surface-100">
            {yearHeader(yr)}
         </div>

         <!-- Strategy line -->
         {#if strategyLabel(yr)}
            <div class="text-xs text-surface-500 dark:text-surface-400 italic">
               {strategyLabel(yr)}
            </div>
         {/if}

         <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <!-- ═══ SOURCES (left column) ═══ -->
            <div class="space-y-1">
               <div
                  class="pt-1 border-t-2 border-surface-300 dark:border-surface-500 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400"
               >
                  Sources
               </div>
               <div
                  class="text-xs text-surface-500 dark:text-surface-400 italic"
               >
                  Withdrawals + Income = {currency(
                     yr.total_income + totalWithdrawals + yr.rmd,
                  )}
               </div>

               <!-- RMD -->
               {#if hasRmd}
                  <div>
                     <div class="flex justify-between font-medium">
                        <span>RMD</span>
                        <span>{currency(yr.rmd)}</span>
                     </div>
                     {#if hasSpouse}
                        {#each rmdItems as item, i (i)}
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
                     {#each yr.income_details ?? [] as inc, i (i)}
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
                     {#each cashWDs as d (d.account_id)}
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
            </div>

            <!-- ═══ USES + ROTH CONVERSION (right column) ═══ -->
            <div class="space-y-1">
               <div
                  class="pt-1 border-t-2 border-surface-300 dark:border-surface-500 text-xs font-semibold uppercase tracking-wide text-surface-500 dark:text-surface-400"
               >
                  Uses
               </div>
               <div
                  class="text-xs text-surface-500 dark:text-surface-400 italic"
               >
                  Spending + Taxes + Deposits = {currency(
                     yr.total_income + totalWithdrawals + yr.rmd,
                  )}
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
                  {#if yr.spending_limited}
                     <div
                        class="text-xs text-warning-600 dark:text-warning-400 pl-3"
                     >
                        (!) Spending limited to available income
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
                     {#each expenses as exp, i (i)}
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
                     <span>{currency(yr.total_tax + yr.conversion_tax)}</span>
                  </div>
                  {#if yr.income_tax > 0 && (yr.brokerage_gains_tax > 0 || yr.irmaa_cost > 0 || yr.conversion_tax > 0)}
                     <div
                        class="flex justify-between pl-3 text-surface-500 dark:text-surface-400"
                     >
                        <span>Income Tax</span>
                        <span>{currency(yr.income_tax)}</span>
                     </div>
                  {/if}
                  {#if yr.brokerage_gains_tax > 0}
                     <div
                        class="flex justify-between pl-3 text-surface-500 dark:text-surface-400"
                     >
                        <span>Capital Gains Tax</span>
                        <span>{currency(yr.brokerage_gains_tax)}</span>
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

               <!-- IRMAA Surcharge -->
               {#if yr.irmaa_cost > 0}
                  <div>
                     <div class="flex justify-between font-medium">
                        <span
                           >IRMAA Surcharge{yr.irmaa_estimated
                              ? ' (Est.)'
                              : ''}</span
                        >
                        <span>{currency(yr.irmaa_cost)}</span>
                     </div>
                  </div>
               {/if}

               <!-- 401k Deposits -->
               {#if yr.pretax_401k_deposit > 0}
                  <div>
                     <div class="flex justify-between font-medium">
                        <span>Emp. 401k Deposit</span>
                        <span>{currency(yr.pretax_401k_deposit)}</span>
                     </div>
                  </div>
               {/if}
               {#if yr.roth_401k_deposit > 0}
                  <div>
                     <div class="flex justify-between font-medium">
                        <span>Emp. Roth 401k Deposit</span>
                        <span>{currency(yr.roth_401k_deposit)}</span>
                     </div>
                  </div>
               {/if}

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
            </div>
         </div>

         <!-- ═══ ROTH CONVERSION (full width, below columns) ═══ -->
         {#if yr.roth_conversion > 0}
            <div
               class="pt-2 mt-1 border-t-2 border-surface-300 dark:border-surface-500 text-sm"
            >
               <div class="flex justify-between font-medium">
                  <span>Roth Conversion</span>
                  <span>{currency(yr.roth_conversion)}</span>
               </div>
               {#each byPurpose(yr.withdrawal_details, 'conversion') as d, i (i)}
                  <div
                     class="flex justify-between pl-3 text-surface-500 dark:text-surface-400"
                  >
                     <span>{d.account_name}</span>
                     <span>{currency(d.amount)}</span>
                  </div>
               {/each}
            </div>
         {/if}
      </div>
   {/if}
</div>
