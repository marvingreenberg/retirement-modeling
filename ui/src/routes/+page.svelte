<script lang="ts">
   import {
      portfolio,
      validationErrors,
      simulationResults,
      simulateBlockedSection,
      numSimulations as numSimsStore,
      comparisonSnapshots,
   } from '$lib/stores';
   import { validatePortfolio } from '$lib/validation';
   import { runSimulation, runMonteCarlo } from '$lib/api';
   import { currency } from '$lib/format';
   import PortfolioEditor from '$lib/components/portfolio/PortfolioEditor.svelte';
   import SimulateSettings from '$lib/components/SimulateSettings.svelte';
   import SimulateView from '$lib/components/SimulateView.svelte';
   import WelcomeState from '$lib/components/WelcomeState.svelte';
   import type {
      SimulationResponse,
      MonteCarloResponse,
      ComparisonSnapshot,
   } from '$lib/types';
   import { goto } from '$app/navigation';
   import { isNarrow } from '$lib/components/PortraitBlocker.svelte';

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

   function snapshotKey(
      s: Pick<
         ComparisonSnapshot,
         | 'runType'
         | 'inflationRate'
         | 'conservativeGrowth'
         | 'spendingStrategy'
         | 'conversionStrategy'
         | 'taxRateState'
         | 'withdrawalOrder'
      >,
   ): string {
      return `${s.runType}|${s.inflationRate}|${s.conservativeGrowth}|${s.spendingStrategy}|${s.conversionStrategy}|${s.taxRateState}|${s.withdrawalOrder ?? ''}`;
   }

   function addSnapshot(snap: ComparisonSnapshot) {
      const key = snapshotKey(snap);
      const filtered = comparisonSnapshots.value.filter(
         (s) => snapshotKey(s) !== key,
      );
      comparisonSnapshots.value = [...filtered, snap];
   }

   function buildSnapshotBase() {
      const c = portfolio.value.config;
      return {
         id: crypto.randomUUID(),
         name: '',
         inflationRate: c.inflation_rate,
         conservativeGrowth: c.conservative_growth,
         spendingStrategy: spendingLabel(),
         conversionStrategy: conversionLabels[c.strategy_target],
         taxRateState: c.tax_rate_state,
         withdrawalOrder: (c.withdrawal_order ?? []).indexOf('brokerage') <
            (c.withdrawal_order ?? []).indexOf('pretax')
            ? 'brk-first'
            : 'ira-first',
      };
   }

   let needsSetup = $derived(portfolio.value.config.current_age_primary === 0);

   $effect(() => {
      if (needsSetup && !isNarrow()) goto('/settings');
   });

   let loading = $state(false);
   let mcLoading = $state(false);
   let error = $state('');

   let singleResult = $state<SimulationResponse | null>(
      simulationResults.value.singleResult,
   );
   let mcResult = $state<MonteCarloResponse | null>(
      simulationResults.value.mcResult,
   );

   // Clear cached results when portfolio inputs change
   let lastPortfolioJson = $state(JSON.stringify(portfolio.value));
   let simRunning = $state(false);
   $effect(() => {
      const json = JSON.stringify(portfolio.value);
      if (json !== lastPortfolioJson) {
         lastPortfolioJson = json;
         if (!simRunning) {
            singleResult = null;
            mcResult = null;
            error = '';
            simulationResults.value = { singleResult: null, mcResult: null };
         }
      }
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

      simRunning = true;
      loading = true;
      mcLoading = true;
      error = '';
      singleResult = null;
      mcResult = null;
      simulationResults.value = { singleResult: null, mcResult: null };

      const numSims = numSimsStore.value;

      const singlePromise = runSimulation(p).then((res) => {
         singleResult = res;
         loading = false;
         simulationResults.value = {
            ...simulationResults.value,
            singleResult: res,
         };
         const spends = res.result.years.map((y) => y.spending_target);
         const minSpend = Math.min(...spends);
         const maxSpend = Math.max(...spends);
         addSnapshot({
            ...buildSnapshotBase(),
            runType: 'single',
            finalBalance: res.summary.final_balance,
            totalTaxes: res.summary.total_taxes_paid,
            totalIrmaa: res.summary.total_irmaa_paid,
            totalRothConversions: res.summary.total_roth_conversions,
            spendingRange: `${currency(minSpend)}–${currency(maxSpend)}`,
         });
      });

      const mcPromise = runMonteCarlo(p, numSims).then((res) => {
         mcResult = res;
         mcLoading = false;
         simulationResults.value = {
            ...simulationResults.value,
            mcResult: res,
         };
         const pcts = res.yearly_percentiles;
         const p5min =
            pcts.length > 0 ? Math.min(...pcts.map((p) => p.spending_p5)) : 0;
         const p95max =
            pcts.length > 0 ? Math.max(...pcts.map((p) => p.spending_p95)) : 0;
         addSnapshot({
            ...buildSnapshotBase(),
            runType: 'monte_carlo',
            numSimulations: res.num_simulations,
            finalBalance:
               res.median_simulation.years.at(-1)?.total_balance ?? 0,
            totalTaxes: 0,
            totalIrmaa: 0,
            totalRothConversions: 0,
            successRate: res.success_rate,
            spendingRange: `${currency(p5min)}–${currency(p95max)}`,
         });
      });

      try {
         await Promise.all([singlePromise, mcPromise]);
      } catch (e: unknown) {
         error = e instanceof Error ? e.message : 'Simulation failed';
         loading = false;
         mcLoading = false;
      } finally {
         simRunning = false;
         lastPortfolioJson = JSON.stringify(portfolio.value);
      }
   }

   let hasResults = $derived(singleResult !== null || mcResult !== null);
</script>

<div class="space-y-6">
   <PortfolioEditor />

   <SimulateSettings onrun={handleRun} {loading} />

   {#if hasResults || error}
      <SimulateView
         {singleResult}
         {mcResult}
         {mcLoading}
         {error}
         config={portfolio.value.config}
      />
   {:else if loading}
      <div class="flex flex-col items-center justify-center py-16 gap-3">
         <div
            class="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"
         ></div>
         <span class="text-surface-500">Running simulation...</span>
      </div>
   {:else}
      <WelcomeState />
   {/if}
</div>
