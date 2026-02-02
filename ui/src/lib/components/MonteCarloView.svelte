<script lang="ts">
	import { portfolio, validationErrors } from '$lib/stores';
	import { validatePortfolio } from '$lib/validation';
	import { runMonteCarlo } from '$lib/api';
	import { currency, pct } from '$lib/format';
	import FanChart from './charts/FanChart.svelte';
	import type { MonteCarloResponse } from '$lib/types';

	let loading = $state(false);
	let error = $state('');
	let result = $state<MonteCarloResponse | null>(null);
	let numSimulations = $state(1000);
	let seed = $state<number | undefined>(undefined);

	async function handleRun() {
		let p = $portfolio;
		const errors = validatePortfolio(p);
		validationErrors.set(errors);
		if (Object.keys(errors).length > 0) {
			error = 'Portfolio has validation errors. Check the Portfolio tab.';
			return;
		}

		loading = true;
		error = '';
		try {
			result = await runMonteCarlo(p, numSimulations, seed);
		} catch (e: any) {
			error = e.message || 'Monte Carlo failed';
		} finally {
			loading = false;
		}
	}

	function medianDepletion(ages: number[]): number {
		const sorted = [...ages].sort((a, b) => a - b);
		return sorted[Math.floor(sorted.length / 2)];
	}
</script>

<div class="space-y-4">
	<div class="flex gap-4 items-end">
		<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
			Simulations
			<input type="number" class="input w-28" bind:value={numSimulations} min="1" max="10000" />
		</label>
		<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
			Seed (optional)
			<input type="number" class="input w-28" bind:value={seed} placeholder="random" />
		</label>
		<button class="btn preset-filled" onclick={handleRun} disabled={loading}>
			{loading ? 'Running...' : 'Run Monte Carlo'}
		</button>
	</div>

	{#if error}
		<div class="text-error-500 bg-error-50 dark:bg-error-950 p-3 rounded text-sm">{error}</div>
	{/if}

	{#if result}
		<div class="text-center p-4 rounded-lg text-2xl font-bold"
			class:bg-success-100={result.success_rate >= 0.9}
			class:dark:bg-success-900={result.success_rate >= 0.9}
			class:text-success-700={result.success_rate >= 0.9}
			class:dark:text-success-300={result.success_rate >= 0.9}
			class:bg-warning-100={result.success_rate >= 0.7 && result.success_rate < 0.9}
			class:dark:bg-warning-900={result.success_rate >= 0.7 && result.success_rate < 0.9}
			class:text-warning-700={result.success_rate >= 0.7 && result.success_rate < 0.9}
			class:dark:text-warning-300={result.success_rate >= 0.7 && result.success_rate < 0.9}
			class:bg-error-100={result.success_rate < 0.7}
			class:dark:bg-error-900={result.success_rate < 0.7}
			class:text-error-700={result.success_rate < 0.7}
			class:dark:text-error-300={result.success_rate < 0.7}
		>
			{pct(result.success_rate)} Success Rate
		</div>

		<div class="card bg-surface-100 dark:bg-surface-800 p-4">
			<h3 class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-3">Final Balance Percentiles</h3>
			<div class="flex gap-6 flex-wrap">
				{#each [
					['5th', result.percentile_5],
					['25th', result.percentile_25],
					['Median', result.median_final_balance],
					['75th', result.percentile_75],
					['95th', result.percentile_95],
				] as [label, value]}
					<div class="flex flex-col gap-0.5">
						<span class="text-xs text-surface-500">{label}</span>
						<span class="text-base font-bold text-surface-900 dark:text-surface-50">{currency(value as number)}</span>
					</div>
				{/each}
			</div>
		</div>

		{#if result.yearly_percentiles.length > 0}
			<FanChart percentiles={result.yearly_percentiles} />
		{/if}

		<div class="card bg-surface-100 dark:bg-surface-800 p-4">
			<h3 class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-3">Portfolio Depletion</h3>
			{#if result.depletion_ages.length === 0}
				<p class="text-success-600 dark:text-success-400 text-sm">No simulations resulted in portfolio depletion.</p>
			{:else}
				<div class="flex gap-6 flex-wrap">
					<div class="flex flex-col gap-0.5">
						<span class="text-xs text-surface-500">Earliest</span>
						<span class="text-base font-bold">Age {Math.min(...result.depletion_ages)}</span>
					</div>
					<div class="flex flex-col gap-0.5">
						<span class="text-xs text-surface-500">Median</span>
						<span class="text-base font-bold">Age {medianDepletion(result.depletion_ages)}</span>
					</div>
					<div class="flex flex-col gap-0.5">
						<span class="text-xs text-surface-500">Latest</span>
						<span class="text-base font-bold">Age {Math.max(...result.depletion_ages)}</span>
					</div>
					<div class="flex flex-col gap-0.5">
						<span class="text-xs text-surface-500">Depleted</span>
						<span class="text-base font-bold">{result.depletion_ages.length} of {result.num_simulations}</span>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
