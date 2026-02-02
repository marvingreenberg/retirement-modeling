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

<div class="simulate-view">
	<div class="controls">
		<button onclick={handleRun} disabled={loading}>
			{loading ? 'Running...' : 'Run Simulation'}
		</button>
	</div>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	{#if result}
		<div class="summary">
			<h3>Summary</h3>
			<div class="stats">
				<div class="stat">
					<span class="label">Final Balance</span>
					<span class="value">{currency(result.summary.final_balance)}</span>
				</div>
				<div class="stat">
					<span class="label">Total Taxes</span>
					<span class="value">{currency(result.summary.total_taxes_paid)}</span>
				</div>
				<div class="stat">
					<span class="label">Total IRMAA</span>
					<span class="value">{currency(result.summary.total_irmaa_paid)}</span>
				</div>
				<div class="stat">
					<span class="label">Roth Conversions</span>
					<span class="value">{currency(result.summary.total_roth_conversions)}</span>
				</div>
				<div class="stat">
					<span class="label">Years</span>
					<span class="value">{result.summary.simulation_years}</span>
				</div>
				<div class="stat">
					<span class="label">Strategy</span>
					<span class="value">{result.summary.strategy}</span>
				</div>
			</div>
		</div>

		<BalanceChart years={result.result.years} />

		<CollapsibleSection title="Year-by-Year Detail" bind:open={tableOpen}>
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th>Year</th>
							<th>Age</th>
							<th>AGI</th>
							<th>Bracket</th>
							<th>RMD</th>
							<th>Spending</th>
							<th>Pre-tax WD</th>
							<th>Roth WD</th>
							<th>Brokerage WD</th>
							<th>Roth Conv</th>
							<th>Total Tax</th>
							<th>IRMAA</th>
							<th>Total Balance</th>
						</tr>
					</thead>
					<tbody>
						{#each result.result.years as yr}
							<tr>
								<td>{yr.year}</td>
								<td>{yr.age_primary}</td>
								<td>{currency(yr.agi)}</td>
								<td>{yr.bracket}</td>
								<td>{currency(yr.rmd)}</td>
								<td>{currency(yr.spending_target)}</td>
								<td>{currency(yr.pretax_withdrawal)}</td>
								<td>{currency(yr.roth_withdrawal)}</td>
								<td>{currency(yr.brokerage_withdrawal)}</td>
								<td>{currency(yr.roth_conversion)}</td>
								<td>{currency(yr.total_tax)}</td>
								<td>{currency(yr.irmaa_cost)}</td>
								<td>{currency(yr.total_balance)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</CollapsibleSection>
	{/if}
</div>

<style>
	.controls {
		margin-bottom: 1rem;
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
	.summary {
		margin-bottom: 1.5rem;
	}
	.summary h3 {
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
	.table-wrap {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8rem;
	}
	th, td {
		padding: 0.4rem 0.6rem;
		text-align: right;
		border-bottom: 1px solid #e2e8f0;
		white-space: nowrap;
	}
	th {
		background: #f8fafc;
		font-weight: 600;
		color: #475569;
		position: sticky;
		top: 0;
	}
</style>
