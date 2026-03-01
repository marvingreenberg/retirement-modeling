<script lang="ts">
   import {
      WITHDRAWAL_CATEGORY_LABELS,
      TAX_CATEGORY_MAP,
      type Account,
      type ConversionStrategy,
      type WithdrawalCategory,
   } from '$lib/types';
   import { recommendWithdrawalOrder } from '$lib/taxDrag';
   import InfoPopover from '$lib/components/InfoPopover.svelte';

   let {
      order = $bindable(),
      accounts,
      conversionStrategy,
   }: {
      order: WithdrawalCategory[];
      accounts?: Account[];
      conversionStrategy?: ConversionStrategy;
   } = $props();

   let activeCategories = $derived.by(() => {
      if (!accounts || accounts.length === 0) return null;
      return new Set(accounts.map((a) => TAX_CATEGORY_MAP[a.type]));
   });

   let displayOrder = $derived(
      activeCategories ? order.filter((c) => activeCategories.has(c)) : order,
   );

   $effect(() => {
      if (!activeCategories) return;
      const filtered = order.filter((c) => activeCategories.has(c));
      const inactive = order.filter((c) => !activeCategories.has(c));
      const newCats = [...activeCategories].filter((c) => !order.includes(c));
      const updated = [...filtered, ...newCats, ...inactive];
      if (JSON.stringify(updated) !== JSON.stringify(order)) {
         order = updated;
      }
   });

   let dragIdx = $state<number | null>(null);

   function handleDragStart(idx: number, e: DragEvent) {
      dragIdx = idx;
      if (e.dataTransfer) {
         e.dataTransfer.effectAllowed = 'move';
         e.dataTransfer.setData('text/plain', String(idx));
      }
   }

   function handleDragOver(e: DragEvent) {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
   }

   function handleDrop(targetIdx: number, e: DragEvent) {
      e.preventDefault();
      if (dragIdx == null || dragIdx === targetIdx) return;
      const displayed = [...displayOrder];
      const [moved] = displayed.splice(dragIdx, 1);
      displayed.splice(targetIdx, 0, moved);
      // Preserve any inactive categories in their original positions aren't shown
      const inactive = order.filter(
         (c) => !activeCategories || !activeCategories.has(c),
      );
      order = [...displayed, ...inactive];
      dragIdx = null;
   }

   function handleDragEnd() {
      dragIdx = null;
   }

   let recommendation = $derived.by(() => {
      if (!accounts || !conversionStrategy) return null;
      return recommendWithdrawalOrder(accounts, conversionStrategy);
   });

   let orderDiffers = $derived(
      recommendation != null &&
         JSON.stringify(order) !== JSON.stringify(recommendation.recommended),
   );

   function applyRecommendation() {
      if (recommendation) {
         order = [...recommendation.recommended];
      }
   }
</script>

<div class="flex flex-col gap-0.5">
   <span
      class="text-xs font-medium text-surface-600 dark:text-surface-400 flex items-center gap-1"
   >
      Withdrawal Order
      <InfoPopover
         text="Order in which account types are tapped for spending. Default: Cash → Brokerage → IRA/401K → Roth. This uses taxable accounts first to let tax-advantaged accounts keep growing. Drag to reorder."
      />
   </span>
   <div class="flex gap-1 items-center">
      {#each displayOrder as cat, i (cat)}
         {#if i > 0}
            <span class="text-surface-400 text-xs select-none">→</span>
         {/if}
         <button
            class="px-2 py-0.5 text-xs rounded cursor-grab border
               {dragIdx === i
               ? 'border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
               : 'border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 text-surface-700 dark:text-surface-300'}"
            draggable="true"
            role="listitem"
            ondragstart={(e) => handleDragStart(i, e)}
            ondragover={handleDragOver}
            ondrop={(e) => handleDrop(i, e)}
            ondragend={handleDragEnd}
         >
            {WITHDRAWAL_CATEGORY_LABELS[cat]}
         </button>
      {/each}
   </div>
   {#if recommendation && orderDiffers}
      <div
         class="text-xs text-warning-600 dark:text-warning-400 flex items-center gap-1 flex-wrap"
      >
         <span>{recommendation.reason}</span>
         <button
            class="btn btn-sm preset-tonal text-xs px-1.5 py-0"
            onclick={applyRecommendation}
         >
            Apply
         </button>
      </div>
   {/if}
</div>
