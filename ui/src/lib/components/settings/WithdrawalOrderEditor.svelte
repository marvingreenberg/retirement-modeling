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

<label
   class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
>
   <span class="flex items-center gap-1"
      >Withdrawal Order <HelpButton topic="withdrawal-order" /></span
   >
   <select
      class="select w-40 text-sm"
      value={isBrokerageFirst ? 'brokerage' : 'pretax'}
      onchange={(e) =>
         setOrder((e.target as HTMLSelectElement).value === 'brokerage')}
   >
      <option value="pretax">IRA/401k first</option>
      <option value="brokerage">Brokerage first</option>
   </select>
</label>
