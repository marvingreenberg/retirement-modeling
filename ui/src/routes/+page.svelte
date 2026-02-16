<script lang="ts">
	import { portfolio, validationErrors, simulationResults, simulateBlockedSection, numSimulations as numSimsStore, formTouched, markFormTouched } from '$lib/stores';
	import { validatePortfolio } from '$lib/validation';
	import { runSimulation, runMonteCarlo } from '$lib/api';
	import PortfolioEditor from '$lib/components/portfolio/PortfolioEditor.svelte';
	import SimulateSettings from '$lib/components/SimulateSettings.svelte';
	import SimulateView from '$lib/components/SimulateView.svelte';
	import WelcomeState from '$lib/components/WelcomeState.svelte';
	import SetupView from '$lib/components/SetupView.svelte';
	import type { SimulationResponse, MonteCarloResponse } from '$lib/types';
	import { get } from 'svelte/store';

	let needsSetup = $derived($portfolio.config.current_age_primary === 0);

	let loading = $state(false);
	let mcLoading = $state(false);
	let error = $state('');
	let settingsCollapsed = $state(false);

	let singleResult = $state<SimulationResponse | null>(null);
	let mcResult = $state<MonteCarloResponse | null>(null);

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
		});

		const mcPromise = runMonteCarlo(p, numSims).then((res) => {
			mcResult = res;
			mcLoading = false;
			simulationResults.update((s) => ({ ...s, mcResult: res }));
		});

		try {
			await Promise.all([singlePromise, mcPromise]);
		} catch (e: any) {
			error = e.message || 'Simulation failed';
			loading = false;
			mcLoading = false;
		}
	}

	let hasResults = $derived(singleResult !== null || mcResult !== null);
</script>

{#if needsSetup}
	<SetupView />
{:else}
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
				<div class="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
				<span class="text-surface-500">Running simulation...</span>
			</div>
		{:else}
			<WelcomeState />
		{/if}
	</div>
{/if}
