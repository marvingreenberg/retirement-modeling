<script lang="ts">
	import { simulationResults } from '$lib/stores';
	import { currency } from '$lib/format';
	import { TableProperties, TrendingUp } from 'lucide-svelte';

	let activeTab = $state<'single' | 'monte_carlo'>('single');
	let hasAny = $derived($simulationResults.singleResult !== null || $simulationResults.mcResult !== null);
</script>

<h2 class="text-xl font-semibold text-surface-900 dark:text-surface-50 mb-4">Detailed Results</h2>

{#if hasAny}
	<div class="flex gap-1 border-b border-surface-300 dark:border-surface-700 mb-4">
		<button
			class="px-4 py-2 text-sm font-medium transition-colors {activeTab === 'single'
				? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
				: 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}"
			onclick={() => activeTab = 'single'}
		>
			Simulation
		</button>
		<button
			class="px-4 py-2 text-sm font-medium transition-colors {activeTab === 'monte_carlo'
				? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
				: 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}"
			onclick={() => activeTab = 'monte_carlo'}
		>
			Monte Carlo
		</button>
	</div>

	{#if activeTab === 'single'}
		{#if $simulationResults.singleResult}
			{@const allYears = $simulationResults.singleResult.result.years}
			{@const depletionIdx = allYears.findIndex((yr, i) => yr.total_balance <= 0 && i > 0)}
			{@const years = depletionIdx >= 0 ? allYears.slice(0, depletionIdx + 1) : allYears}
			<div class="card bg-surface-100 dark:bg-surface-800 p-4">
				<h3 class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-2">
					<TableProperties size={18} class="text-primary-500" /> Year-by-Year Detail
				</h3>
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
							{#each years as yr}
								<tr class={yr.total_balance <= 0 ? 'text-error-500 dark:text-error-400' : ''}>
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
				{#if depletionIdx >= 0}
					<p class="text-error-600 dark:text-error-400 font-semibold text-sm mt-3 text-center">
						Portfolio depleted at age {allYears[depletionIdx].age_primary} — remaining years omitted
					</p>
				{/if}
			</div>
		{:else}
			<p class="text-surface-500">Single simulation results not yet available.</p>
		{/if}
	{:else if activeTab === 'monte_carlo'}
		{#if $simulationResults.mcResult}
			{@const percentiles = $simulationResults.mcResult.yearly_percentiles}
			<div class="card bg-surface-100 dark:bg-surface-800 p-4">
				<h3 class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-2">
					<TrendingUp size={18} class="text-tertiary-500" /> Yearly Balance Percentiles
				</h3>
				{#if percentiles.length > 0}
					<div class="overflow-x-auto">
						<table class="table table-sm">
							<thead>
								<tr>
									<th>Age</th><th>5th</th><th>25th</th><th>Median</th><th>75th</th><th>95th</th>
								</tr>
							</thead>
							<tbody>
								{#each percentiles as p}
									<tr>
										<td>{p.age}</td>
										<td>{currency(p.balance_p5)}</td>
										<td>{currency(p.balance_p25)}</td>
										<td>{currency(p.balance_median)}</td>
										<td>{currency(p.balance_p75)}</td>
										<td>{currency(p.balance_p95)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<p class="text-surface-500 text-sm">No yearly percentile data available.</p>
				{/if}
			</div>
		{:else}
			<p class="text-surface-500">Monte Carlo results not yet available.</p>
		{/if}
	{/if}
{:else}
	<p class="text-surface-500">Run a simulation to see detailed results.</p>
{/if}
