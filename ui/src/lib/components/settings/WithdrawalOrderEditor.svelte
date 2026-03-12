<script lang="ts">
   import type { WithdrawalCategory } from '$lib/types';
   import HelpButton from '$lib/components/HelpButton.svelte';

   let {
      order = $bindable(),
   }: {
      order: WithdrawalCategory[];
   } = $props();

   let isBrokerageFirst = $derived(
      order.indexOf('brokerage') < order.indexOf('pretax'),
   );

   function setOrder(brokerageFirst: boolean) {
      order = brokerageFirst
         ? ['cash', 'brokerage', 'pretax', 'roth']
         : ['cash', 'pretax', 'brokerage', 'roth'];
   }
</script>

<fieldset class="flex flex-col gap-2">
   <legend class="text-sm font-medium text-surface-700-200">
      Withdrawal Order
      <HelpButton topic="withdrawal-order" />
   </legend>
   <label class="flex items-center gap-2 text-sm">
      <input
         type="radio"
         name="withdrawal-order"
         checked={!isBrokerageFirst}
         onchange={() => setOrder(false)}
         class="radio"
      />
      IRA/401k first
   </label>
   <label class="flex items-center gap-2 text-sm">
      <input
         type="radio"
         name="withdrawal-order"
         checked={isBrokerageFirst}
         onchange={() => setOrder(true)}
         class="radio"
      />
      Brokerage first
   </label>
   {#if isBrokerageFirst}
      <p class="text-xs text-warning-600">
         Withdrawing from brokerage first MAY allow more Roth conversion, which
         MAY be advantageous
         <HelpButton topic="withdrawal-order" />
      </p>
   {/if}
</fieldset>
