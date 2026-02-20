<script lang="ts">
   import {
      portfolio,
      validationErrors,
      simulationResults,
      simulateBlockedSection,
      numSimulations as numSimsStore,
      comparisonSnapshots,
      formTouched,
      markFormTouched,
   } from '$lib/stores';
   import { validatePortfolio } from '$lib/validation';
   import { runSimulation, runMonteCarlo } from '$lib/api';
   import PortfolioEditor from '$lib/components/portfolio/PortfolioEditor.svelte';
   import SimulateSettings from '$lib/components/SimulateSettings.svelte';
   import SimulateView from '$lib/components/SimulateView.svelte';
   import WelcomeState from '$lib/components/WelcomeState.svelte';
   import type {
      SimulationResponse,
      MonteCarloResponse,
      ComparisonSnapshot,
   } from '$lib/types';
   import { get } from 'svelte/store';
   import { goto } from '$app/navigation';

   const spendingLabels: Record<string, string> = {
      fixed_dollar: 'Fixed Dollar',
      percent_of_portfolio: '% of Portfolio',
      guardrails: 'Guardrails',
      rmd_based: 'RMD-Based',
   };
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
         | 'growthRate'
         | 'spendingStrategy'
         | 'conversionStrategy'
         | 'taxRateState'
      >,
   ): string {
      return `${s.runType}|${s.inflationRate}|${s.growthRate}|${s.spendingStrategy}|${s.conversionStrategy}|${s.taxRateState}`;
   }

   function addSnapshot(snap: ComparisonSnapshot) {
      const key = snapshotKey(snap);
      comparisonSnapshots.update((snaps) => {
         const filtered = snaps.filter((s) => snapshotKey(s) !== key);
         return [...filtered, snap];
      });
   }

   function buildSnapshotBase() {
      const c = $portfolio.config;
      return {
         id: crypto.randomUUID(),
         name: '',
         inflationRate: c.inflation_rate,
         growthRate: c.investment_growth_rate,
         spendingStrategy:
            spendingLabels[c.spending_strategy ?? 'fixed_dollar'],
         conversionStrategy: conversionLabels[c.strategy_target],
         taxRateState: c.tax_rate_state,
      };
   }

   let needsSetup = $derived($portfolio.config.current_age_primary === 0);

   $effect(() => {
      if (needsSetup) goto('/settings');
   });

   let loading = $state(false);
   let mcLoading = $state(false);
   let error = $state('');

   let stored = get(simulationResults);
   let singleResult = $state<SimulationResponse | null>(stored.singleResult);
   let mcResult = $state<MonteCarloResponse | null>(stored.mcResult);
   let settingsCollapsed = $state(stored.singleResult !== null);

   // Clear cached results when portfolio inputs change
   let lastPortfolioJson = $state(JSON.stringify($portfolio));
   let simRunning = $state(false);
   $effect(() => {
      const json = JSON.stringify($portfolio);
      if (json !== lastPortfolioJson) {
         lastPortfolioJson = json;
         if (!simRunning) {
            singleResult = null;
            mcResult = null;
            settingsCollapsed = false;
            error = '';
            simulationResults.set({ singleResult: null, mcResult: null });
            comparisonSnapshots.set([]);
         }
      }
   });

   async function handleRun() {
      if ($portfolio.accounts.length === 0) {
         simulateBlockedSection.set('accounts');
         return;
      }
      if ($portfolio.config.annual_spend_net === 0) {
         simulateBlockedSection.set('budget');
         return;
      }
      simulateBlockedSection.set(null);

      const p = $portfolio;
      const errors = validatePortfolio(p);
      validationErrors.set(errors);
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
      simulationResults.set({ singleResult: null, mcResult: null });

      const numSims = get(numSimsStore);

      const singlePromise = runSimulation(p).then((res) => {
         singleResult = res;
         loading = false;
         settingsCollapsed = true;
         simulationResults.update((s) => ({ ...s, singleResult: res }));
         addSnapshot({
            ...buildSnapshotBase(),
            runType: 'single',
            finalBalance: res.summary.final_balance,
            totalTaxes: res.summary.total_taxes_paid,
            totalIrmaa: res.summary.total_irmaa_paid,
            totalRothConversions: res.summary.total_roth_conversions,
         });
      });

      const mcPromise = runMonteCarlo(p, numSims).then((res) => {
         mcResult = res;
         mcLoading = false;
         simulationResults.update((s) => ({ ...s, mcResult: res }));
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
         });
      });

      try {
         await Promise.all([singlePromise, mcPromise]);
      } catch (e: any) {
         error = e.message || 'Simulation failed';
         loading = false;
         mcLoading = false;
      } finally {
         simRunning = false;
         lastPortfolioJson = JSON.stringify($portfolio);
      }
   }

   let hasResults = $derived(singleResult !== null || mcResult !== null);
</script>

<div class="space-y-6">
   <PortfolioEditor />

   <SimulateSettings
      bind:collapsed={settingsCollapsed}
      onrun={handleRun}
      {loading}
   />

   {#if hasResults || error}
      <SimulateView {singleResult} {mcResult} {mcLoading} {error} />
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
