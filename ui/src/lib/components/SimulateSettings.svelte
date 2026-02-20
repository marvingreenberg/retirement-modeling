<script lang="ts">
   import {
      portfolio,
      validationErrors,
      formTouched,
      markFormTouched,
   } from '$lib/stores';
   import InfoPopover from './InfoPopover.svelte';

   let inflError = $derived(
      $formTouched ? ($validationErrors['config.inflation_rate'] ?? '') : '',
   );
   let growthError = $derived(
      $formTouched
         ? ($validationErrors['config.investment_growth_rate'] ?? '')
         : '',
   );

   let {
      onrun,
      loading = false,
   }: {
      onrun: () => void;
      loading: boolean;
   } = $props();

   function toPct(v: number): number {
      return Math.round(v * 10000) / 100;
   }
   function setPct(e: Event, setter: (v: number) => void) {
      setter(+(e.target as HTMLInputElement).value / 100);
   }

   function strategySummary(): string {
      const c = $portfolio.config;
      const s = c.spending_strategy ?? 'fixed_dollar';
      if (s === 'fixed_dollar') {
         const spend =
            c.annual_spend_net >= 1000
               ? `$${Math.round(c.annual_spend_net / 1000)}K`
               : `$${c.annual_spend_net}`;
         return `Fixed ${spend}`;
      }
      if (s === 'percent_of_portfolio')
         return `${toPct(c.withdrawal_rate ?? 0.04).toFixed(1)}% of Portfolio`;
      if (s === 'guardrails' && c.guardrails_config) {
         const g = c.guardrails_config;
         return `Guardrails ${toPct(g.initial_withdrawal_rate).toFixed(1)}%, (${Math.round(g.floor_percent * 100)}/${Math.round(g.ceiling_percent * 100)})`;
      }
      return 'RMD-Based';
   }

   let strategyOpen = $state(false);

   function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
         markFormTouched();
         portfolio.update((p) => ({ ...p }));
      }
   }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
   class="bg-surface-100 dark:bg-surface-800 rounded p-2 space-y-1.5"
   onkeydown={handleKeydown}
   role="group"
>
   <div class="flex gap-4 flex-wrap items-end">
      <button
         class="btn btn-md preset-tonal self-end"
         color="#443300"
         onclick={onrun}
         disabled={loading}
         aria-label="Run simulation"
      >
         {#if loading}<span class="inline-block animate-spin">⏳</span
            >{:else}Simulate{/if}
      </button>
      <label
         class="flex flex-col gap-0.5 text-xs font-medium {inflError
            ? 'text-error-600 dark:text-error-400'
            : 'text-surface-600 dark:text-surface-400'}"
      >
         <span class="flex items-center gap-1"
            >Inflation % <InfoPopover
               text="Assumed annual rate at which prices increase, reducing the purchasing power of fixed withdrawals over time."
            /></span
         >
         <input
            type="number"
            class="input w-20 text-sm {inflError
               ? 'ring-2 ring-error-500 border-error-500'
               : ''}"
            value={toPct($portfolio.config.inflation_rate)}
            oninput={(e) =>
               setPct(e, (v) => ($portfolio.config.inflation_rate = v))}
            min="0"
            max="50"
            step="0.5"
         />
         {#if inflError}<span class="text-[10px] text-error-500"
               >{inflError}</span
            >{/if}
      </label>
      <label
         class="flex flex-col gap-0.5 text-xs font-medium {growthError
            ? 'text-error-600 dark:text-error-400'
            : 'text-surface-600 dark:text-surface-400'}"
      >
         <span class="flex items-center gap-1"
            >Growth % <InfoPopover
               text="Assumed annual return on investments before inflation. Monte Carlo uses historically-sampled returns instead."
            /></span
         >
         <input
            type="number"
            class="input w-20 text-sm {growthError
               ? 'ring-2 ring-error-500 border-error-500'
               : ''}"
            value={toPct($portfolio.config.investment_growth_rate)}
            oninput={(e) =>
               setPct(e, (v) => ($portfolio.config.investment_growth_rate = v))}
            min="-50"
            max="50"
            step="0.5"
         />
         {#if growthError}<span class="text-[10px] text-error-500"
               >{growthError}</span
            >{/if}
      </label>
      <label
         class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
      >
         <span class="flex items-center gap-1"
            >Conversion <InfoPopover
               text="Controls Roth conversion aggressiveness. No Conversion skips conversions. Other strategies convert pre-tax to Roth up to a tax bracket or IRMAA threshold to reduce future taxes."
            /></span
         >
         <select
            class="select w-40 text-sm"
            bind:value={$portfolio.config.strategy_target}
         >
            <option value="standard">No Conversion</option>
            <option value="irmaa_tier_1">IRMAA Tier 1</option>
            <option value="22_percent_bracket">22% Bracket</option>
            <option value="24_percent_bracket">24% Bracket</option>
         </select>
      </label>
   </div>

   <!-- Withdrawal Strategy: collapsible -->
   <button
      class="text-md text-surface-700 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100 cursor-pointer w-full text-left font-medium"
      onclick={() => {
         strategyOpen = !strategyOpen;
      }}
   >
      {strategyOpen ? '▾' : '▸'} Withdrawal Strategy{#if !strategyOpen}
         <span class="text-surface-500 font-normal">— {strategySummary()}</span
         >{/if}
   </button>

   {#if strategyOpen}
      <div class="pl-3 space-y-2">
         {#if $portfolio.config.spending_strategy === 'percent_of_portfolio'}
            <div class="flex gap-4 flex-wrap items-end">
               <label
                  class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
               >
                  <span class="flex items-center gap-1"
                     >Strategy <InfoPopover
                        text="How annual withdrawals are calculated. Fixed Dollar adjusts for inflation. % of Portfolio takes a fixed percentage each year. Guardrails adjusts spending when withdrawal rate drifts. RMD-Based uses IRS Required Minimum Distribution tables."
                     /></span
                  >
                  <select
                     class="select w-44 text-sm"
                     bind:value={$portfolio.config.spending_strategy}
                  >
                     <option value="fixed_dollar">Fixed Dollar</option>
                     <option value="percent_of_portfolio">% of Portfolio</option
                     >
                     <option value="guardrails">Guardrails</option>
                     <option value="rmd_based">RMD-Based</option>
                  </select>
               </label>
               <label
                  class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
               >
                  Withdrawal Rate
                  <input
                     type="number"
                     class="input w-24 text-sm"
                     value={toPct($portfolio.config.withdrawal_rate ?? 0.04)}
                     oninput={(e) =>
                        setPct(
                           e,
                           (v) => ($portfolio.config.withdrawal_rate = v),
                        )}
                     min="1"
                     max="15"
                     step="0.5"
                  />
               </label>
            </div>
         {:else if $portfolio.config.spending_strategy === 'guardrails' && $portfolio.config.guardrails_config}
            <div class="flex gap-4 flex-wrap items-end">
               <label
                  class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
               >
                  <span class="flex items-center gap-1"
                     >Strategy <InfoPopover
                        text="How annual withdrawals are calculated. Fixed Dollar adjusts for inflation. % of Portfolio takes a fixed percentage each year. Guardrails adjusts spending when withdrawal rate drifts. RMD-Based uses IRS Required Minimum Distribution tables."
                     /></span
                  >
                  <select
                     class="select w-44 text-sm"
                     bind:value={$portfolio.config.spending_strategy}
                  >
                     <option value="fixed_dollar">Fixed Dollar</option>
                     <option value="percent_of_portfolio">% of Portfolio</option
                     >
                     <option value="guardrails">Guardrails</option>
                     <option value="rmd_based">RMD-Based</option>
                  </select>
               </label>
               <label
                  class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
               >
                  Init. WD Rate
                  <input
                     type="number"
                     class="input w-24 text-sm"
                     value={toPct(
                        $portfolio.config.guardrails_config
                           .initial_withdrawal_rate,
                     )}
                     oninput={(e) =>
                        setPct(
                           e,
                           (v) =>
                              ($portfolio.config.guardrails_config!.initial_withdrawal_rate =
                                 v),
                        )}
                     min="1"
                     max="15"
                     step="0.5"
                  />
               </label>
            </div>
            <div class="flex gap-4 flex-wrap items-end">
               <label
                  class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
               >
                  Floor %
                  <input
                     type="number"
                     class="input w-20 text-sm"
                     value={toPct(
                        $portfolio.config.guardrails_config.floor_percent,
                     )}
                     oninput={(e) =>
                        setPct(
                           e,
                           (v) =>
                              ($portfolio.config.guardrails_config!.floor_percent =
                                 v),
                        )}
                     min="50"
                     max="100"
                     step="5"
                  />
               </label>
               <label
                  class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
               >
                  Ceiling %
                  <input
                     type="number"
                     class="input w-20 text-sm"
                     value={toPct(
                        $portfolio.config.guardrails_config.ceiling_percent,
                     )}
                     oninput={(e) =>
                        setPct(
                           e,
                           (v) =>
                              ($portfolio.config.guardrails_config!.ceiling_percent =
                                 v),
                        )}
                     min="100"
                     max="200"
                     step="5"
                  />
               </label>
               <label
                  class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
               >
                  Adjust %
                  <input
                     type="number"
                     class="input w-20 text-sm"
                     value={toPct(
                        $portfolio.config.guardrails_config.adjustment_percent,
                     )}
                     oninput={(e) =>
                        setPct(
                           e,
                           (v) =>
                              ($portfolio.config.guardrails_config!.adjustment_percent =
                                 v),
                        )}
                     min="1"
                     max="25"
                     step="1"
                  />
               </label>
            </div>
         {:else}
            <div class="flex gap-4 flex-wrap items-end">
               <label
                  class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
               >
                  <span class="flex items-center gap-1"
                     >Strategy <InfoPopover
                        text="How annual withdrawals are calculated. Fixed Dollar adjusts for inflation. % of Portfolio takes a fixed percentage each year. Guardrails adjusts spending when withdrawal rate drifts. RMD-Based uses IRS Required Minimum Distribution tables."
                     /></span
                  >
                  <select
                     class="select w-44 text-sm"
                     bind:value={$portfolio.config.spending_strategy}
                  >
                     <option value="fixed_dollar">Fixed Dollar</option>
                     <option value="percent_of_portfolio">% of Portfolio</option
                     >
                     <option value="guardrails">Guardrails</option>
                     <option value="rmd_based">RMD-Based</option>
                  </select>
               </label>
            </div>
         {/if}
      </div>
   {/if}
</div>
