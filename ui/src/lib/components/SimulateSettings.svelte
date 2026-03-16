<script lang="ts">
   import {
      portfolio,
      validationErrors,
      formTouched,
      markFormTouched,
   } from '$lib/stores';
   import { hasPretaxAccounts, TAX_CATEGORY_MAP } from '$lib/types';
   import { currency } from '$lib/format';
   import HelpButton from './HelpButton.svelte';
   import WithdrawalOrderEditor from './settings/WithdrawalOrderEditor.svelte';

   let inflError = $derived(
      formTouched.value
         ? (validationErrors.value['config.inflation_rate'] ?? '')
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

   function guardrailFloor(): number {
      const g = portfolio.value.config.guardrails_config;
      if (!g) return 4;
      return (
         Math.round(g.initial_withdrawal_rate * g.floor_percent * 1000) / 10
      );
   }
   function guardrailCeiling(): number {
      const g = portfolio.value.config.guardrails_config;
      if (!g) return 6;
      return (
         Math.round(g.initial_withdrawal_rate * g.ceiling_percent * 1000) / 10
      );
   }
   function setGuardrailRange(floor: number, ceiling: number) {
      const g = portfolio.value.config.guardrails_config;
      if (!g) return;
      const init = (floor + ceiling) / 2 / 100;
      g.initial_withdrawal_rate = init;
      g.floor_percent = init > 0 ? floor / 100 / init : 0.8;
      g.ceiling_percent = init > 0 ? ceiling / 100 / init : 1.2;
   }

   let fixedDollarDiagnostic = $derived(
      `Fixed ${currency(portfolio.value.config.annual_spend_net)}`,
   );

   const DIAGNOSTIC_THRESHOLD_PCT = 0.05;

   let strategyDiagnostic = $derived.by(() => {
      const c = portfolio.value.config;
      const s = c.spending_strategy ?? 'fixed_dollar';
      if (s === 'fixed_dollar') return null;
      const totalBalance = portfolio.value.accounts.reduce(
         (sum, a) => sum + a.balance,
         0,
      );
      const desired = c.annual_spend_net ?? 0;
      if (desired <= 0 || totalBalance <= 0) return null;
      let rate: number;
      if (s === 'percent_of_portfolio') rate = c.withdrawal_rate ?? 0.04;
      else if (s === 'guardrails' && c.guardrails_config)
         rate = c.guardrails_config.initial_withdrawal_rate;
      else return null;
      const strategySpend = totalBalance * rate;
      if (strategySpend > desired * (1 + DIAGNOSTIC_THRESHOLD_PCT))
         return {
            text: `Rate supports ~${currency(strategySpend)}/yr (above ${currency(desired)} target)`,
            warn: false,
         };
      if (strategySpend < desired * (1 - DIAGNOSTIC_THRESHOLD_PCT))
         return {
            text: `\u26A0\uFE0F Rate only supports ~${currency(strategySpend)}/yr (below ${currency(desired)} target)`,
            warn: true,
         };
      return {
         text: `Rate supports ~${currency(strategySpend)}/yr (about ${currency(desired)} target)`,
         warn: false,
      };
   });

   let showConversion = $derived(hasPretaxAccounts(portfolio.value.accounts));

   let showWithdrawalOrder = $derived.by(() => {
      const accounts = portfolio.value.accounts;
      const hasBrokerage = accounts.some(
         (a) => TAX_CATEGORY_MAP[a.type] === 'brokerage',
      );
      const hasPretax = accounts.some(
         (a) => TAX_CATEGORY_MAP[a.type] === 'pretax',
      );
      return hasBrokerage && hasPretax;
   });

   $effect(() => {
      if (
         !showConversion &&
         portfolio.value.config.strategy_target !== 'standard'
      ) {
         portfolio.value.config.strategy_target = 'standard';
      }
   });

   function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
         markFormTouched();
         portfolio.value = { ...portfolio.value };
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
         class="btn btn-md preset-tonal self-end border-2 border-primary-500"
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
            >Inflation % <HelpButton
               topic="simulation-parameters"
               anchor="inflation"
            /></span
         >
         <input
            type="number"
            class="input w-20 text-sm {inflError
               ? 'ring-2 ring-error-500 border-error-500'
               : ''}"
            value={toPct(portfolio.value.config.inflation_rate)}
            oninput={(e) =>
               setPct(e, (v) => (portfolio.value.config.inflation_rate = v))}
            min="0"
            max="50"
            step="0.5"
         />
         {#if inflError}<span class="text-[10px] text-error-500"
               >{inflError}</span
            >{/if}
      </label>
      <label
         class="flex items-center gap-2 text-xs font-medium text-surface-600 dark:text-surface-400"
      >
         <input
            type="checkbox"
            class="checkbox"
            bind:checked={portfolio.value.config.conservative_growth}
         />
         Conservative growth
         <HelpButton
            topic="simulation-parameters"
            anchor="conservative-growth"
         />
      </label>
      {#if showConversion}
         <label
            class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
         >
            <span class="flex items-center gap-1"
               >Conversion <HelpButton
                  topic="roth-conversions"
                  anchor="conversion-strategy"
               /></span
            >
            <select
               class="select w-40 text-sm"
               bind:value={portfolio.value.config.strategy_target}
            >
               <option value="standard">No Conversion</option>
               <option value="irmaa_tier_1">IRMAA Tier 1</option>
               <option value="22_percent_bracket">22% Bracket</option>
               <option value="24_percent_bracket">24% Bracket</option>
            </select>
         </label>
      {/if}
   </div>

   <!-- Withdrawal Strategy -->
   <div class="space-y-2">
      <div class="flex gap-4 flex-wrap items-end">
         <label
            class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
         >
            <span class="flex items-center gap-1"
               >Strategy <HelpButton
                  topic="spending-strategies"
                  anchor="strategy-selection"
               /></span
            >
            <select
               class="select w-44 text-sm"
               bind:value={portfolio.value.config.spending_strategy}
            >
               <option value="fixed_dollar">Fixed Dollar</option>
               <option value="percent_of_portfolio">% of Portfolio</option>
               <option value="guardrails">Guardrails</option>
            </select>
         </label>
         {#if portfolio.value.config.spending_strategy === 'percent_of_portfolio'}
            <label
               class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
            >
               Withdrawal Rate
               <input
                  type="number"
                  class="input w-24 text-sm"
                  value={toPct(portfolio.value.config.withdrawal_rate ?? 0.04)}
                  oninput={(e) =>
                     setPct(
                        e,
                        (v) => (portfolio.value.config.withdrawal_rate = v),
                     )}
                  min="1"
                  max="15"
                  step="0.5"
               />
            </label>
         {:else if portfolio.value.config.spending_strategy === 'guardrails' && portfolio.value.config.guardrails_config}
            <label
               class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
            >
               <span class="flex items-center gap-1"
                  >Floor Rate % <HelpButton
                     topic="spending-strategies"
                     anchor="guardrail-floor"
                  /></span
               >
               <input
                  type="number"
                  class="input w-20 text-sm"
                  value={guardrailFloor()}
                  oninput={(e) =>
                     setGuardrailRange(
                        +(e.target as HTMLInputElement).value,
                        guardrailCeiling(),
                     )}
                  min="1"
                  max="10"
                  step="0.5"
               />
            </label>
            <label
               class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400"
            >
               <span class="flex items-center gap-1"
                  >Ceiling Rate % <HelpButton
                     topic="spending-strategies"
                     anchor="guardrail-ceiling"
                  /></span
               >
               <input
                  type="number"
                  class="input w-20 text-sm"
                  value={guardrailCeiling()}
                  oninput={(e) =>
                     setGuardrailRange(
                        guardrailFloor(),
                        +(e.target as HTMLInputElement).value,
                     )}
                  min="2"
                  max="15"
                  step="0.5"
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
                     portfolio.value.config.guardrails_config
                        .adjustment_percent,
                  )}
                  oninput={(e) =>
                     setPct(
                        e,
                        (v) =>
                           (portfolio.value.config.guardrails_config!.adjustment_percent =
                              v),
                     )}
                  min="1"
                  max="25"
                  step="0.5"
               />
            </label>
            <span class="text-xs text-surface-500 self-end pb-1.5"
               >Initial rate: {toPct(
                  portfolio.value.config.guardrails_config
                     .initial_withdrawal_rate,
               ).toFixed(1)}%</span
            >
         {/if}
      </div>
      {#if portfolio.value.config.spending_strategy === 'fixed_dollar'}
         <div class="text-xs text-surface-500 dark:text-surface-400">
            {fixedDollarDiagnostic}
         </div>
      {:else if strategyDiagnostic}
         <div class="text-xs text-surface-600 dark:text-surface-400">
            {strategyDiagnostic.text}
         </div>
      {/if}
      {#if showWithdrawalOrder}
         <WithdrawalOrderEditor
            bind:order={portfolio.value.config.withdrawal_order}
         />
      {/if}
   </div>
</div>
