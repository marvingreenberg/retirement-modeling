<script lang="ts">
	import { portfolio, validationErrors, simulationResults, simulateBlockedSection, formTouched, markFormTouched } from '$lib/stores';
	import { validatePortfolio } from '$lib/validation';
	import { runSimulation, runMonteCarlo } from '$lib/api';
	import { currency } from '$lib/format';
	import PortfolioEditor from '$lib/components/portfolio/PortfolioEditor.svelte';
	import SimulateSettings from '$lib/components/SimulateSettings.svelte';
	import SimulateView from '$lib/components/SimulateView.svelte';
	import WelcomeState from '$lib/components/WelcomeState.svelte';
	import SetupView from '$lib/components/SetupView.svelte';
	import type { SimulationResponse, MonteCarloResponse } from '$lib/types';
	import { AlertTriangle, ArrowRight, Wallet, GitCompareArrows, Table } from 'lucide-svelte';

	let needsSetup = $derived($portfolio.config.current_age_primary === 0);

	let loading = $state(false);
	let error = $state('');
	let runMode = $state<'single' | 'monte_carlo'>('single');
	let numSimulations = $state(1000);
	let settingsCollapsed = $state(false);

	let singleResult = $state<SimulationResponse | null>(null);
	let mcResult = $state<MonteCarloResponse | null>(null);
	let lastRunMode = $state<'single' | 'monte_carlo' | null>(null);

	let totalBalance = $derived($portfolio.accounts.reduce((sum, a) => sum + a.balance, 0));
	let spending = $derived($portfolio.config.annual_spend_net);

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
			error = 'Portfolio has validation errors. Check the portfolio sections.';
			return;
		}

		loading = true;
		error = '';
		singleResult = null;
		mcResult = null;
		simulationResults.set({ singleResult: null, mcResult: null, lastRunMode: null });

		try {
			if (runMode === 'single') {
				singleResult = await runSimulation(p);
			} else {
				mcResult = await runMonteCarlo(p, numSimulations);
			}
			lastRunMode = runMode;
			simulationResults.set({ singleResult, mcResult, lastRunMode });
			settingsCollapsed = true;
		} catch (e: any) {
			error = e.message || 'Simulation failed';
		} finally {
			loading = false;
		}
	}

	let hasResults = $derived(lastRunMode !== null);
</script>

{#if needsSetup}
	<SetupView />
{:else}
	<div class="space-y-6">
		<!-- Simulation controls + chart area (top) -->
		<SimulateSettings
			bind:runMode
			bind:numSimulations
			bind:collapsed={settingsCollapsed}
			onrun={handleRun}
			{loading}
		/>

		{#if hasResults || error}
			<SimulateView {singleResult} {mcResult} {lastRunMode} {error} />
		{:else if loading}
			<div class="flex flex-col items-center justify-center py-16 gap-3">
				<div class="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
				<span class="text-surface-500">Running simulation...</span>
			</div>
		{:else}
			<WelcomeState />
		{/if}

		<!-- Portfolio summary bar -->
		{#if $portfolio.accounts.length > 0}
			<div class="flex gap-6 flex-wrap items-center text-sm text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-800 rounded p-3">
				<div class="flex flex-col gap-0.5">
					<span class="text-xs text-surface-400">Portfolio</span>
					<span class="font-semibold text-surface-900 dark:text-surface-50">{currency(totalBalance)}</span>
				</div>
				<div class="flex flex-col gap-0.5">
					<span class="text-xs text-surface-400">Spending</span>
					<span class="font-semibold text-surface-900 dark:text-surface-50">{currency(spending)}/yr</span>
				</div>
				{#if $portfolio.config.spending_strategy && $portfolio.config.spending_strategy !== 'fixed_dollar'}
					<div class="flex flex-col gap-0.5">
						<span class="text-xs text-surface-400">Strategy</span>
						<span class="font-semibold text-surface-900 dark:text-surface-50 capitalize">{$portfolio.config.spending_strategy?.replace(/_/g, ' ')}</span>
					</div>
				{/if}
				<div class="flex-1"></div>
				<nav class="flex gap-2">
					<a href="/spending" class="btn btn-sm preset-ghost flex items-center gap-1"><Wallet size={14} /> Spending <ArrowRight size={12} /></a>
					<a href="/compare" class="btn btn-sm preset-ghost flex items-center gap-1"><GitCompareArrows size={14} /> Compare <ArrowRight size={12} /></a>
					<a href="/details" class="btn btn-sm preset-ghost flex items-center gap-1"><Table size={14} /> Details <ArrowRight size={12} /></a>
				</nav>
			</div>
		{/if}

		<!-- Accounts + Income (below) -->
		<PortfolioEditor />
	</div>
{/if}
