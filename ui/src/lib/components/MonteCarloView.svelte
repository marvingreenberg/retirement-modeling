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

<div class="mc-view">
	<div class="controls">
		<label>
			Simulations
			<input type="number" bind:value={numSimulations} min="1" max="10000" />
		</label>
		<label>
			Seed (optional)
			<input type="number" bind:value={seed} placeholder="random" />
		</label>
		<button onclick={handleRun} disabled={loading}>
			{loading ? 'Running...' : 'Run Monte Carlo'}
		</button>
	</div>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	{#if result}
		<div class="success-rate" class:good={result.success_rate >= 0.9} class:warn={result.success_rate >= 0.7 && result.success_rate < 0.9} class:bad={result.success_rate < 0.7}>
			{pct(result.success_rate)} Success Rate
		</div>

		<div class="summary">
			<h3>Final Balance Percentiles</h3>
			<div class="stats">
				<div class="stat">
					<span class="label">5th</span>
					<span class="value">{currency(result.percentile_5)}</span>
				</div>
				<div class="stat">
					<span class="label">25th</span>
					<span class="value">{currency(result.percentile_25)}</span>
				</div>
				<div class="stat">
					<span class="label">Median</span>
					<span class="value">{currency(result.median_final_balance)}</span>
				</div>
				<div class="stat">
					<span class="label">75th</span>
					<span class="value">{currency(result.percentile_75)}</span>
				</div>
				<div class="stat">
					<span class="label">95th</span>
					<span class="value">{currency(result.percentile_95)}</span>
				</div>
			</div>
		</div>

		{#if result.yearly_percentiles.length > 0}
			<FanChart percentiles={result.yearly_percentiles} />
		{/if}

		<div class="depletion">
			<h3>Portfolio Depletion</h3>
			{#if result.depletion_ages.length === 0}
				<p class="no-depletion">No simulations resulted in portfolio depletion.</p>
			{:else}
				<div class="stats">
					<div class="stat">
						<span class="label">Earliest</span>
						<span class="value">Age {Math.min(...result.depletion_ages)}</span>
					</div>
					<div class="stat">
						<span class="label">Median</span>
						<span class="value">Age {medianDepletion(result.depletion_ages)}</span>
					</div>
					<div class="stat">
						<span class="label">Latest</span>
						<span class="value">Age {Math.max(...result.depletion_ages)}</span>
					</div>
					<div class="stat">
						<span class="label">Depleted</span>
						<span class="value">{result.depletion_ages.length} of {result.num_simulations}</span>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.controls {
		display: flex;
		gap: 1rem;
		align-items: flex-end;
		margin-bottom: 1rem;
	}
	.controls label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.85rem;
		font-weight: 500;
		color: #475569;
	}
	.controls input {
		padding: 0.4rem 0.5rem;
		border: 1px solid #cbd5e1;
		border-radius: 4px;
		font-size: 0.9rem;
		width: 100px;
	}
	button {
		padding: 0.6rem 1.5rem;
		background: #1e40af;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
	}
	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.error {
		color: #dc2626;
		background: #fef2f2;
		padding: 0.5rem 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}
	.success-rate {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 1rem;
		padding: 0.75rem 1rem;
		border-radius: 6px;
		text-align: center;
	}
	.success-rate.good { background: #f0fdf4; color: #166534; }
	.success-rate.warn { background: #fefce8; color: #854d0e; }
	.success-rate.bad { background: #fef2f2; color: #991b1b; }
	.summary, .depletion {
		margin-bottom: 1.5rem;
	}
	h3 {
		margin: 0 0 0.75rem;
		font-size: 1rem;
		color: #334155;
	}
	.stats {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
	}
	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.stat .label {
		font-size: 0.8rem;
		color: #64748b;
	}
	.stat .value {
		font-size: 1rem;
		font-weight: 600;
		color: #1e293b;
	}
	.no-depletion {
		color: #166534;
		font-size: 0.9rem;
	}
</style>
