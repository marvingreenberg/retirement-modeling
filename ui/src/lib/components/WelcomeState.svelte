<script lang="ts">
   import { portfolio } from '$lib/stores';
   import { currency } from '$lib/format';
   import { BarChart3 } from 'lucide-svelte';

   let totalBalance = $derived(
      portfolio.value.accounts.reduce((sum, a) => sum + a.balance, 0),
   );
   let spending = $derived(portfolio.value.config.annual_spend_net);
   let coverageYears = $derived(
      spending > 0 ? Math.round(totalBalance / spending) : null,
   );
   let hasAccounts = $derived(portfolio.value.accounts.length > 0);
</script>

<div
   class="flex flex-col items-center justify-center text-center py-16 px-8 space-y-4"
>
   <div class="text-surface-300 dark:text-surface-600">
      <BarChart3 size={64} strokeWidth={1.5} />
   </div>
   <h2 class="text-xl font-semibold text-surface-700 dark:text-surface-300">
      Ready to simulate
   </h2>
   <p class="text-surface-500 max-w-md">
      Add your accounts and income on the left, then click <strong
         >Simulate</strong
      > to see projected outcomes here.
   </p>

   {#if hasAccounts}
      <div
         class="flex gap-6 text-sm text-surface-600 dark:text-surface-400 mt-2"
      >
         <div class="flex flex-col gap-0.5">
            <span class="text-xs text-surface-400">Total Balance</span>
            <span class="font-semibold">{currency(totalBalance)}</span>
         </div>
         <div class="flex flex-col gap-0.5">
            <span class="text-xs text-surface-400">Annual Spending</span>
            <span class="font-semibold">{currency(spending)}</span>
         </div>
         {#if coverageYears !== null}
            <div class="flex flex-col gap-0.5">
               <span class="text-xs text-surface-400">Est. Coverage</span>
               <span class="font-semibold">~{coverageYears} years</span>
            </div>
         {/if}
      </div>
   {/if}
</div>
