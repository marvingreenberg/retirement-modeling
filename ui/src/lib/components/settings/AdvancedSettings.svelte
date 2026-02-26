<script lang="ts">
   import { portfolio, numSimulations, randomizeForDemo } from '$lib/stores';
   import InfoPopover from '$lib/components/InfoPopover.svelte';
   import { Shuffle } from 'lucide-svelte';

   let showRandomizeConfirm = $state(false);

   function toPct(v: number): number {
      return Math.round(v * 10000) / 100;
   }
   function setPct(e: Event, setter: (v: number) => void) {
      setter(+(e.target as HTMLInputElement).value / 100);
   }
</script>

<h2 class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-6">
   Advanced Settings
</h2>

<div class="space-y-4 max-w-md">
   <label
      class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300"
   >
      State/Local Tax %
      <input
         type="number"
         class="input text-sm"
         value={toPct($portfolio.config.tax_rate_state)}
         oninput={(e) =>
            setPct(e, (v) => ($portfolio.config.tax_rate_state = v))}
         min="0"
         max="20"
         step="0.25"
      />
   </label>

   <label
      class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300"
   >
      <span class="flex items-center gap-1"
         >RMD Age <InfoPopover
            text="Age at which Required Minimum Distributions from pre-tax accounts begin. Currently 73 under the SECURE 2.0 Act."
         /></span
      >
      <input
         type="number"
         class="input text-sm"
         bind:value={$portfolio.config.rmd_start_age}
         min="70"
         max="80"
      />
   </label>

   <label
      class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300"
   >
      <span class="flex items-center gap-1"
         >IRMAA Limit ($) <InfoPopover
            text="Income threshold above which Medicare Part B/D premiums increase. Roth conversions that push income above this trigger surcharges."
         /></span
      >
      <input
         type="number"
         class="input text-sm"
         bind:value={$portfolio.config.irmaa_limit_tier_1}
         min="0"
         step="1000"
      />
   </label>

   <label
      class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300"
   >
      <span class="flex items-center gap-1"
         >MC Iterations <InfoPopover
            text="Number of Monte Carlo simulations to run. More iterations give more stable results but take longer."
         /></span
      >
      <input
         type="number"
         class="input text-sm"
         bind:value={$numSimulations}
         min="1"
         max="10000"
      />
   </label>

   <label
      class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300"
   >
      <span class="flex items-center gap-1"
         >Excess Income Routing <InfoPopover
            text="When income exceeds spending, surplus is invested. Choose where: brokerage (default), IRA first (then brokerage), or Roth IRA first (then brokerage). IRA/Roth options require employment income."
         /></span
      >
      <select
         class="select text-sm"
         bind:value={$portfolio.config.excess_income_routing}
      >
         <option value="brokerage">Brokerage (default)</option>
         <option value="ira_first">IRA first, then brokerage</option>
         <option value="roth_ira_first">Roth IRA first, then brokerage</option>
      </select>
   </label>

   <div class="pt-4 border-t border-surface-300 dark:border-surface-700">
      <h3
         class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2"
      >
         Demo
      </h3>
      {#if showRandomizeConfirm}
         <p class="text-xs text-surface-500 mb-2">
            This will randomize all account balances and replace names.
            Continue?
         </p>
         <div class="flex gap-2">
            <button
               class="btn btn-sm preset-filled-warning"
               onclick={() => {
                  randomizeForDemo();
                  showRandomizeConfirm = false;
               }}
            >
               Yes, Randomize
            </button>
            <button
               class="btn btn-sm preset-tonal"
               onclick={() => (showRandomizeConfirm = false)}
            >
               Cancel
            </button>
         </div>
      {:else}
         <button
            class="btn btn-sm preset-tonal"
            onclick={() => (showRandomizeConfirm = true)}
         >
            <Shuffle size={14} />
            Randomize for Demo
         </button>
      {/if}
   </div>
</div>
