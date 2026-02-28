<script lang="ts">
   import type { TaxBracket } from '$lib/types';
   import { Calculator } from 'lucide-svelte';

   let {
      balance,
      stateTaxRate,
      federalBrackets,
      onapply,
   }: {
      balance: number;
      stateTaxRate: number;
      federalBrackets: TaxBracket[];
      onapply?: (drag: number) => void;
   } = $props();

   let open = $state(false);
   let popoverEl: HTMLDivElement | undefined = $state();
   let totalDividends = $state(0);
   let totalInterest = $state(0);

   function getMarginalRate(): number {
      if (federalBrackets.length === 0) return 0.22;
      for (const b of federalBrackets) {
         if (balance < b.limit) return b.rate;
      }
      return federalBrackets[federalBrackets.length - 1].rate;
   }

   let computedTax = $derived.by(() => {
      const divTax = totalDividends * 0.15;
      const intTax = totalInterest * (getMarginalRate() + stateTaxRate);
      return divTax + intTax;
   });

   let computedDrag = $derived(balance > 0 ? computedTax / balance : 0);

   function toggle(e: MouseEvent) {
      e.stopPropagation();
      open = !open;
      if (open) {
         totalDividends = 0;
         totalInterest = 0;
      }
   }

   function handleApply() {
      onapply?.(computedDrag);
      open = false;
   }

   function handleClickOutside(e: MouseEvent) {
      if (open && popoverEl && !popoverEl.contains(e.target as Node)) {
         open = false;
      }
   }

   $effect(() => {
      if (open) {
         document.addEventListener('click', handleClickOutside, true);
         return () =>
            document.removeEventListener('click', handleClickOutside, true);
      }
   });

   function formatMoney(n: number): string {
      return n.toLocaleString('en-US', {
         style: 'currency',
         currency: 'USD',
         maximumFractionDigits: 0,
      });
   }
</script>

<span class="relative inline-flex items-center">
   <button
      class="inline-flex items-center justify-center w-5 h-5 rounded text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 cursor-pointer"
      onclick={toggle}
      aria-label="Calculate tax drag"
      type="button"
   >
      <Calculator size={14} />
   </button>
   {#if open}
      <div
         bind:this={popoverEl}
         class="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 rounded-lg shadow-lg bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 text-sm space-y-2"
      >
         <div class="font-medium text-surface-700 dark:text-surface-300">
            1099 Tax Drag Calculator
         </div>
         <label
            class="flex flex-col gap-0.5 text-xs text-surface-600 dark:text-surface-400"
         >
            Total Dividends
            <input
               type="number"
               class="input w-full text-sm"
               bind:value={totalDividends}
               min="0"
               step="100"
               aria-label="Total Dividends"
            />
         </label>
         <label
            class="flex flex-col gap-0.5 text-xs text-surface-600 dark:text-surface-400"
         >
            Total Interest
            <input
               type="number"
               class="input w-full text-sm"
               bind:value={totalInterest}
               min="0"
               step="100"
               aria-label="Total Interest"
            />
         </label>
         <div class="text-xs text-surface-500 space-y-0.5">
            <div>Balance: {formatMoney(balance)}</div>
            {#if totalDividends > 0 || totalInterest > 0}
               <div>
                  Tax: {formatMoney(computedTax)} / {formatMoney(balance)} = {(
                     computedDrag * 100
                  ).toFixed(2)}%
               </div>
            {/if}
         </div>
         <button
            class="btn btn-sm preset-filled w-full"
            onclick={handleApply}
            disabled={totalDividends === 0 && totalInterest === 0}
         >
            Apply
         </button>
      </div>
   {/if}
</span>
