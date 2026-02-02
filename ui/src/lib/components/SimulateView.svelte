<script lang="ts">
	import { portfolio, validationErrors } from '$lib/stores';
	import { validatePortfolio } from '$lib/validation';
	import { runSimulation } from '$lib/api';
	import { currency } from '$lib/format';
	import BalanceChart from './charts/BalanceChart.svelte';
	import CollapsibleSection from './CollapsibleSection.svelte';
	import type { SimulationResponse } from '$lib/types';

	let loading = $state(false);
	let error = $state('');
	let result = $state<SimulationResponse | null>(null);
	let tableOpen = $state(false);

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
			result = await runSimulation(p);
		} catch (e: any) {
			error = e.message || 'Simulation failed';
		} finally {
			loading = false;
		}
	}
</script>

<div class="space-y-4">
	<button class="btn preset-filled" onclick={handleRun} disabled={loading}>
		{loading ? 'Running...' : 'Run Simulation'}
	</button>

	{#if error}
		<div class="text-error-500 bg-error-50 dark:bg-error-950 p-3 rounded text-sm">{error}</div>
	{/if}

	{#if result}
		<div class="card bg-surface-100 dark:bg-surface-800 p-4">
			<h3 class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-3">Summary</h3>
			<div class="flex gap-6 flex-wrap">
				<div class="flex flex-col gap-0.5">
					<span class="text-xs text-surface-500">Final Balance</span>
					<span class="text-base font-bold text-surface-900 dark:text-surface-50">{currency(result.summary.final_balance)}</span>
				</div>
				<div class="flex flex-col gap-0.5">
					<span class="text-xs text-surface-500">Total Taxes</span>
					<span class="text-base font-bold text-surface-900 dark:text-surface-50">{currency(result.summary.total_taxes_paid)}</span>
				</div>
				<div class="flex flex-col gap-0.5">
					<span class="text-xs text-surface-500">Total IRMAA</span>
					<span class="text-base font-bold text-surface-900 dark:text-surface-50">{currency(result.summary.total_irmaa_paid)}</span>
				</div>
				<div class="flex flex-col gap-0.5">
					<span class="text-xs text-surface-500">Roth Conversions</span>
					<span class="text-base font-bold text-surface-900 dark:text-surface-50">{currency(result.summary.total_roth_conversions)}</span>
				</div>
				<div class="flex flex-col gap-0.5">
					<span class="text-xs text-surface-500">Years</span>
					<span class="text-base font-bold text-surface-900 dark:text-surface-50">{result.summary.simulation_years}</span>
				</div>
				<div class="flex flex-col gap-0.5">
					<span class="text-xs text-surface-500">Strategy</span>
					<span class="text-base font-bold text-surface-900 dark:text-surface-50">{result.summary.strategy}</span>
				</div>
			</div>
		</div>

		<BalanceChart years={result.result.years} />

		<CollapsibleSection title="Year-by-Year Detail" bind:open={tableOpen}>
			<div class="overflow-x-auto">
				<table class="table table-sm">
					<thead>
						<tr>
							<th>Year</th><th>Age</th><th>AGI</th><th>Bracket</th><th>RMD</th>
							<th>Spending</th><th>Pre-tax WD</th><th>Roth WD</th><th>Brokerage WD</th>
							<th>Roth Conv</th><th>Total Tax</th><th>IRMAA</th><th>Total Balance</th>
						</tr>
					</thead>
					<tbody>
						{#each result.result.years as yr}
							<tr>
								<td>{yr.year}</td><td>{yr.age_primary}</td><td>{currency(yr.agi)}</td>
								<td>{yr.bracket}</td><td>{currency(yr.rmd)}</td><td>{currency(yr.spending_target)}</td>
								<td>{currency(yr.pretax_withdrawal)}</td><td>{currency(yr.roth_withdrawal)}</td>
								<td>{currency(yr.brokerage_withdrawal)}</td><td>{currency(yr.roth_conversion)}</td>
								<td>{currency(yr.total_tax)}</td><td>{currency(yr.irmaa_cost)}</td>
								<td>{currency(yr.total_balance)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</CollapsibleSection>
	{/if}
</div>
