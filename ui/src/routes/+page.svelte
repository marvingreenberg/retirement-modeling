<script lang="ts">
	import { portfolio, validationErrors } from '$lib/stores';
	import { validatePortfolio } from '$lib/validation';
	import { runSimulation, runMonteCarlo } from '$lib/api';
	import PortfolioEditor from '$lib/components/portfolio/PortfolioEditor.svelte';
	import SimulateSettings from '$lib/components/SimulateSettings.svelte';
	import SimulateView from '$lib/components/SimulateView.svelte';
	import WelcomeState from '$lib/components/WelcomeState.svelte';
	import SetupView from '$lib/components/SetupView.svelte';
	import type { SimulationResponse, MonteCarloResponse } from '$lib/types';

	let needsSetup = $derived($portfolio.accounts.length === 0 && $portfolio.config.current_age_primary === 0);

	let loading = $state(false);
	let error = $state('');
	let runMode = $state<'single' | 'monte_carlo'>('single');
	let numSimulations = $state(1000);
	let settingsCollapsed = $state(false);

	let singleResult = $state<SimulationResponse | null>(null);
	let mcResult = $state<MonteCarloResponse | null>(null);
	let lastRunMode = $state<'single' | 'monte_carlo' | null>(null);

	async function handleRun() {
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

		try {
			if (runMode === 'single') {
				singleResult = await runSimulation(p);
			} else {
				mcResult = await runMonteCarlo(p, numSimulations);
			}
			lastRunMode = runMode;
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
	<div class="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
		<section class="space-y-4">
			<PortfolioEditor />
			<SimulateSettings
				bind:runMode
				bind:numSimulations
				bind:collapsed={settingsCollapsed}
				onrun={handleRun}
				{loading}
			/>
		</section>
		<section>
			{#if hasResults || error}
				<SimulateView {singleResult} {mcResult} {lastRunMode} {error} />
			{:else if loading}
				<div class="flex items-center justify-center py-16">
					<span class="text-surface-500">Running simulation...</span>
				</div>
			{:else}
				<WelcomeState />
			{/if}
		</section>
	</div>
{/if}
