<script lang="ts">
   import {
      portfolio,
      validationErrors,
      simulateBlockedSection,
      numSimulations as numSimsStore,
      comparisonEntries,
      selectedEntryIds,
      resultPaneTab,
      selectedYearIdx,
      portfolioFingerprint,
   } from '$lib/stores';
   import type { ResultPaneTab } from '$lib/stores.svelte';
   import { validatePortfolio } from '$lib/validation';
   import { runSimulation, runMonteCarlo } from '$lib/api';
   import { currency, uniqueId } from '$lib/format';
   import { pvTotalTaxes } from '$lib/presentValue';
   import { effectiveTaxRate, taxRateColor } from '$lib/effectiveTaxRate';
   import { getVisibleColumns } from '$lib/columnVisibility';
   import PortfolioEditor from '$lib/components/portfolio/PortfolioEditor.svelte';
   import SimulateSettings from '$lib/components/SimulateSettings.svelte';
   import ComparisonTable from '$lib/components/ComparisonTable.svelte';
   import ResultPane from '$lib/components/ResultPane.svelte';
   import WithdrawalPlan from '$lib/components/WithdrawalPlan.svelte';
   import WelcomeState from '$lib/components/WelcomeState.svelte';
   import HelpButton from '$lib/components/HelpButton.svelte';
   import { Info } from 'lucide-svelte';
   import type { ComparisonEntry } from '$lib/types';
   import { goto } from '$app/navigation';
   import { isNarrow } from '$lib/components/PortraitBlocker.svelte';

   // ── Labels ────────────────────────────────────────────────────────

   function spendingLabel(): string {
      const c = portfolio.value.config;
      const s = c.spending_strategy ?? 'fixed_dollar';
      if (s === 'fixed_dollar') {
         const spend =
            c.annual_spend_net >= 1000
               ? `$${Math.round(c.annual_spend_net / 1000)}K`
               : `$${c.annual_spend_net}`;
         return `Fixed ${spend}`;
      }
      if (s === 'percent_of_portfolio') {
         const rate = Math.round((c.withdrawal_rate ?? 0.04) * 1000) / 10;
         return `${rate}% of Portfolio`;
      }
      if (s === 'guardrails' && c.guardrails_config) {
         const g = c.guardrails_config;
         const init = g.initial_withdrawal_rate;
         const floor = Math.round(init * g.floor_percent * 1000) / 10;
         const ceil = Math.round(init * g.ceiling_percent * 1000) / 10;
         const adj = Math.round(g.adjustment_percent * 1000) / 10;
         return `Guardrails ${floor}-${ceil}% Adj ${adj}%`;
      }
      return 'RMD-Based';
   }

   const conversionLabels: Record<string, string> = {
      standard: 'No Conversion',
      irmaa_tier_1: 'IRMAA Tier 1',
      '22_percent_bracket': '22% Bracket',
      '24_percent_bracket': '24% Bracket',
   };

   // ── Entry key for deduplication ───────────────────────────────────

   function entryKey(e: ComparisonEntry): string {
      return `${e.inflationRate}|${e.conservativeGrowth}|${e.spendingStrategy}|${e.conversionStrategy}|${e.withdrawalOrder}`;
   }

   // ── Selection logic ───────────────────────────────────────────────

   function toggleSelect(id: string) {
      const ids = selectedEntryIds.value;
      const idx = ids.indexOf(id);
      if (idx >= 0) {
         selectedEntryIds.value = ids.filter((x) => x !== id);
      } else if (ids.length < 2) {
         selectedEntryIds.value = [...ids, id];
      } else {
         selectedEntryIds.value = [ids[1], id];
      }
   }

   function removeEntry(id: string) {
      comparisonEntries.value = comparisonEntries.value.filter(
         (e) => e.id !== id,
      );
      selectedEntryIds.value = selectedEntryIds.value.filter((x) => x !== id);
      if (comparisonEntries.value.length === 0) topTab = 'approach';
   }

   function clearAll() {
      comparisonEntries.value = [];
      selectedEntryIds.value = [];
      topTab = 'approach';
   }

   let selectedEntries = $derived(
      selectedEntryIds.value
         .map((id) => comparisonEntries.value.find((e) => e.id === id))
         .filter((e): e is ComparisonEntry => e != null),
   );

   let isSideBySide = $derived(selectedEntries.length === 2);

   // ── Scroll sync for detail tables ─────────────────────────────────

   let isSyncing = false;
   function syncScroll(e: Event, sourceId: string) {
      if (isSyncing || !isSideBySide) return;
      isSyncing = true;
      const source = e.target as HTMLElement;
      const otherId = selectedEntryIds.value.find((id) => id !== sourceId);
      if (otherId) {
         const other = document.querySelector(
            `[data-scroll-id="${otherId}"]`,
         ) as HTMLElement | null;
         if (other) {
            other.scrollTop = source.scrollTop;
            other.scrollLeft = source.scrollLeft;
         }
      }
      requestAnimationFrame(() => (isSyncing = false));
   }

   // ── Tabs ──────────────────────────────────────────────────────────

   const tabs: { id: ResultPaneTab; label: string }[] = [
      { id: 'balance', label: 'Balance' },
      { id: 'spending', label: 'Spending' },
      { id: 'monte_carlo', label: 'Monte Carlo' },
      { id: 'details', label: 'Details' },
   ];

   // ── Setup redirect ────────────────────────────────────────────────

   let needsSetup = $derived(portfolio.value.config.current_age_primary === 0);
   $effect(() => {
      if (needsSetup && !isNarrow()) goto('/settings');
   });

   // ── Simulation run ────────────────────────────────────────────────

   let loading = $state(false);
   let _mcLoading = $state(false);
   let error = $state('');

   // Top-level tab: Approach (settings) | Scenarios (comparison table)
   type TopTab = 'approach' | 'scenarios';
   let topTab = $state<TopTab>('approach');

   // Clear entries when structural portfolio inputs change
   let lastFingerprint = $state(portfolioFingerprint(portfolio.value));
   let comparisonClearedMsg = $state('');
   $effect(() => {
      const fp = portfolioFingerprint(portfolio.value);
      if (fp !== lastFingerprint && comparisonEntries.value.length > 0) {
         comparisonEntries.value = [];
         selectedEntryIds.value = [];
         topTab = 'approach';
         comparisonClearedMsg =
            'Comparisons cleared — portfolio inputs changed';
         setTimeout(() => (comparisonClearedMsg = ''), 5000);
      }
      lastFingerprint = fp;
   });

   async function handleRun() {
      if (portfolio.value.accounts.length === 0) {
         simulateBlockedSection.value = 'accounts';
         return;
      }
      if (portfolio.value.config.annual_spend_net === 0) {
         simulateBlockedSection.value = 'budget';
         return;
      }
      simulateBlockedSection.value = null;

      const p = portfolio.value;
      const errors = validatePortfolio(p);
      validationErrors.value = errors;
      if (Object.keys(errors).length > 0) {
         error =
            'Portfolio has validation errors. Check the portfolio sections.';
         return;
      }

      loading = true;
      _mcLoading = true;
      error = '';

      const newId = uniqueId();
      const c = p.config;

      // 1. Build pending entry — both results null, metrics zeroed.
      const pending: ComparisonEntry = {
         id: newId,
         inflationRate: c.inflation_rate,
         conservativeGrowth: c.conservative_growth,
         spendingStrategy: spendingLabel(),
         conversionStrategy: conversionLabels[c.strategy_target],
         withdrawalOrder:
            (c.withdrawal_order ?? []).indexOf('brokerage') <
            (c.withdrawal_order ?? []).indexOf('pretax')
               ? 'brk-first'
               : 'ira-first',
         afterTaxFinalBalance: 0,
         totalTaxesPV: 0,
         mcSuccessRate: undefined,
         singleResult: null,
         mcResult: null,
      };

      // 2. Dedupe by entryKey (remove any prior entry matching the new
      //    config), append pending, select it, switch to Scenarios view.
      const pendingKey = entryKey(pending);
      comparisonEntries.value = [
         ...comparisonEntries.value.filter((e) => entryKey(e) !== pendingKey),
         pending,
      ];
      selectedEntryIds.value = [newId];
      topTab = 'scenarios';

      const numSims = numSimsStore.value;

      // Patch the pending entry in place by id (copy-on-write for reactivity).
      const patchEntry = (fields: Partial<ComparisonEntry>) => {
         comparisonEntries.value = comparisonEntries.value.map((e) =>
            e.id === newId ? { ...e, ...fields } : e,
         );
      };
      // Rollback on failure: remove pending entry, reopen Approach if empty.
      const rollback = (msg: string) => {
         comparisonEntries.value = comparisonEntries.value.filter(
            (e) => e.id !== newId,
         );
         selectedEntryIds.value = selectedEntryIds.value.filter(
            (x) => x !== newId,
         );
         if (comparisonEntries.value.length === 0) topTab = 'approach';
         error = msg;
      };

      // 3. Fire both calls; each one patches the entry as soon as it returns.
      const singlePromise = runSimulation(p)
         .then((sResult) => {
            const inf = c.inflation_rate ?? 0.03;
            const years = sResult.result.years;
            const lastYear = years.at(-1);
            patchEntry({
               singleResult: sResult,
               afterTaxFinalBalance: lastYear?.tax_adjusted_balance ?? 0,
               totalTaxesPV: pvTotalTaxes(years, inf),
            });
            loading = false;
         })
         .catch((e: unknown) => {
            loading = false;
            throw e;
         });

      const mcPromise = runMonteCarlo(p, numSims)
         .then((mResult) => {
            patchEntry({
               mcResult: mResult,
               mcSuccessRate: mResult.success_rate,
            });
            _mcLoading = false;
         })
         .catch((e: unknown) => {
            _mcLoading = false;
            throw e;
         });

      // 4. Wait for both. allSettled lets us roll back on partial failure
      //    without losing track of either call's state.
      const [sOut, mOut] = await Promise.allSettled([singlePromise, mcPromise]);
      if (sOut.status === 'rejected' || mOut.status === 'rejected') {
         const reason =
            sOut.status === 'rejected'
               ? sOut.reason
               : (mOut as PromiseRejectedResult).reason;
         rollback(
            reason instanceof Error ? reason.message : 'Simulation failed',
         );
      }
   }

   let hasEntries = $derived(comparisonEntries.value.length > 0);
</script>

<div class="space-y-6">
   {#if comparisonClearedMsg}
      <div
         class="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300 bg-surface-300/60 dark:bg-surface-600/60 rounded px-3 py-2"
      >
         <Info size={16} class="shrink-0 text-surface-500" />
         {comparisonClearedMsg}
      </div>
   {/if}

   <PortfolioEditor />

   <!-- Approach / Scenarios tabbed pane -->
   <div class="card bg-surface-100 dark:bg-surface-800">
      <div
         class="flex gap-1 border-b border-surface-300 dark:border-surface-700 px-2 pt-2"
      >
         <button
            class="px-4 py-2 text-sm font-medium transition-colors {topTab ===
            'approach'
               ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
               : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}"
            onclick={() => (topTab = 'approach')}
         >
            Approach
            <HelpButton topic="simulation-parameters" />
         </button>
         <button
            class="px-4 py-2 text-sm font-medium transition-colors {topTab ===
            'scenarios'
               ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
               : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'} {!hasEntries
               ? 'opacity-50 cursor-not-allowed'
               : ''}"
            onclick={() => {
               if (hasEntries) topTab = 'scenarios';
            }}
            disabled={!hasEntries}
         >
            Scenarios
            {#if hasEntries}
               <span class="ml-1 text-xs text-surface-500 dark:text-surface-400"
                  >({comparisonEntries.value.length})</span
               >
            {/if}
         </button>
      </div>
      <div class="p-4">
         {#if topTab === 'approach'}
            <SimulateSettings onrun={handleRun} {loading} />
         {:else if topTab === 'scenarios' && hasEntries}
            <ComparisonTable
               entries={comparisonEntries.value}
               selectedIds={selectedEntryIds.value}
               onselect={toggleSelect}
               ondelete={removeEntry}
               onclear={clearAll}
            />
         {/if}
      </div>
   </div>

   {#if error}
      <div
         class="text-error-500 bg-error-50 dark:bg-error-950 p-3 rounded text-sm"
      >
         {error}
      </div>
   {/if}

   {#if !hasEntries}
      <WelcomeState />
   {:else if selectedEntries.length > 0}
      <!-- Tab bar (shared between panes) -->
      <div
         class="flex gap-1 border-b border-surface-300 dark:border-surface-700"
      >
         {#each tabs as tab (tab.id)}
            <button
               class="px-4 py-2 text-sm font-medium transition-colors {resultPaneTab.value ===
               tab.id
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}"
               onclick={() => (resultPaneTab.value = tab.id)}
            >
               {tab.label}
            </button>
         {/each}
      </div>

      <!-- Result panes -->
      {#if resultPaneTab.value !== 'details'}
         <div class="grid gap-4 {isSideBySide ? 'grid-cols-2' : 'grid-cols-1'}">
            {#each selectedEntries as entry (entry.id)}
               <ResultPane
                  {entry}
                  activeTab={resultPaneTab.value}
                  config={portfolio.value.config}
               />
            {/each}
         </div>
      {:else}
         <!-- Details: withdrawal cards row (aligned heights) -->
         <div class="grid gap-4 {isSideBySide ? 'grid-cols-2' : 'grid-cols-1'}">
            {#each selectedEntries as entry (entry.id)}
               {@const allYears = entry.singleResult?.result.years ?? []}
               {@const depIdx = allYears.findIndex(
                  (yr, i) => yr.total_balance <= 0 && i > 0,
               )}
               {@const years =
                  depIdx >= 0 ? allYears.slice(0, depIdx + 1) : allYears}
               <div
                  class="card bg-surface-50 dark:bg-surface-900 p-3 border border-surface-200 dark:border-surface-700"
               >
                  <div
                     class="text-xs font-semibold text-surface-500 dark:text-surface-400 mb-2 pb-1 border-b border-surface-200 dark:border-surface-700"
                  >
                     {entry.conversionStrategy} &middot;
                     {entry.withdrawalOrder === 'brk-first'
                        ? 'Brokerage first'
                        : 'IRA/401k first'}
                  </div>
                  <WithdrawalPlan
                     {years}
                     yearIndex={selectedYearIdx.value}
                     spendingStrategy={portfolio.value.config.spending_strategy}
                     withdrawalRate={portfolio.value.config.withdrawal_rate}
                  />
               </div>
            {/each}
         </div>

         <!-- Details: year tables (scroll-synced) -->
         <div class="grid gap-4 {isSideBySide ? 'grid-cols-2' : 'grid-cols-1'}">
            {#each selectedEntries as entry (entry.id)}
               {@const allYears = entry.singleResult?.result.years ?? []}
               {@const depIdx = allYears.findIndex(
                  (yr, i) => yr.total_balance <= 0 && i > 0,
               )}
               {@const years =
                  depIdx >= 0 ? allYears.slice(0, depIdx + 1) : allYears}
               {@const columnVis = getVisibleColumns(years)}
               <div
                  class="detail-scroll card bg-surface-50 dark:bg-surface-900 p-2 border border-surface-200 dark:border-surface-700 overflow-auto max-h-[400px]"
                  onscroll={(e) => syncScroll(e, entry.id)}
                  data-scroll-id={entry.id}
               >
                  <table
                     class="table table-sm text-xs"
                     style="min-width: max-content;"
                  >
                     <thead>
                        <tr>
                           <th>Year</th>
                           <th
                              ><div>Total</div>
                              <div>Balance</div></th
                           >
                           <th>AGI</th>
                           <th
                              ><div>Eff Tax</div>
                              <div>Rate</div></th
                           >
                           <th>Spending</th>
                           {#if columnVis.dep401k}<th
                                 ><div>401k</div>
                                 <div>Dep</div></th
                              >{/if}
                           <th
                              ><div>Income</div>
                              <div>Tax</div></th
                           >
                           {#if columnVis.capGainsTax}<th
                                 ><div>Cap Gains</div>
                                 <div>Tax</div></th
                              >{/if}
                           {#if columnVis.convTax}<th
                                 ><div>Conv</div>
                                 <div>Tax</div></th
                              >{/if}
                           {#if columnVis.rothConv}<th
                                 ><div>Roth</div>
                                 <div>Conv</div></th
                              >{/if}
                           {#if columnVis.irmaa}<th>IRMAA</th>{/if}
                           {#if columnVis.income}<th>Income</th>{/if}
                           {#if columnVis.brokerageWd}<th
                                 ><div>Brok</div>
                                 <div>WD</div></th
                              >{/if}
                           {#if columnVis.pretaxWd}<th
                                 ><div>PreTax</div>
                                 <div>WD</div></th
                              >{/if}
                           {#if columnVis.rmd}<th>RMD</th>{/if}
                           {#if columnVis.rothWd}<th
                                 ><div>Roth</div>
                                 <div>WD</div></th
                              >{/if}
                        </tr>
                     </thead>
                     <tbody>
                        {#each years as yr, i (yr.year)}
                           {@const rate = effectiveTaxRate(yr)}
                           <tr
                              class="cursor-pointer {i === selectedYearIdx.value
                                 ? 'bg-primary-100/30 dark:bg-primary-800/30'
                                 : ''} {yr.total_balance <= 0
                                 ? 'text-error-500 dark:text-error-400'
                                 : ''}"
                              onclick={() => (selectedYearIdx.value = i)}
                           >
                              <td>{yr.year}</td>
                              <td>{currency(yr.total_balance)}</td>
                              <td>{currency(yr.agi)}</td>
                              <td style="color: {taxRateColor(rate)}"
                                 >{(rate * 100).toFixed(1)}%</td
                              >
                              <td>{currency(yr.spending_target)}</td>
                              {#if columnVis.dep401k}<td
                                    >{currency(
                                       yr.pretax_401k_deposit +
                                          yr.roth_401k_deposit,
                                    )}</td
                                 >{/if}
                              <td>{currency(yr.income_tax)}</td>
                              {#if columnVis.capGainsTax}<td
                                    >{currency(yr.brokerage_gains_tax)}</td
                                 >{/if}
                              {#if columnVis.convTax}<td
                                    >{currency(yr.conversion_tax)}</td
                                 >{/if}
                              {#if columnVis.rothConv}<td
                                    >{currency(yr.roth_conversion)}</td
                                 >{/if}
                              {#if columnVis.irmaa}<td
                                    >{currency(yr.irmaa_cost)}</td
                                 >{/if}
                              {#if columnVis.income}<td
                                    >{currency(yr.total_income)}</td
                                 >{/if}
                              {#if columnVis.brokerageWd}<td
                                    >{currency(yr.brokerage_withdrawal)}</td
                                 >{/if}
                              {#if columnVis.pretaxWd}<td
                                    >{currency(yr.pretax_withdrawal)}</td
                                 >{/if}
                              {#if columnVis.rmd}<td>{currency(yr.rmd)}</td
                                 >{/if}
                              {#if columnVis.rothWd}<td
                                    >{currency(yr.roth_withdrawal)}</td
                                 >{/if}
                           </tr>
                        {/each}
                     </tbody>
                  </table>
               </div>
            {/each}
         </div>
      {/if}
   {/if}
</div>
