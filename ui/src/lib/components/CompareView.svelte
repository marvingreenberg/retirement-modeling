<script lang="ts">
	import { onMount } from 'svelte';
	import { portfolio, validationErrors } from '$lib/stores';
	import { validatePortfolio } from '$lib/validation';
	import { fetchStrategies, runCompare } from '$lib/api';
	import { currency } from '$lib/format';
	import CompareChart from './charts/CompareChart.svelte';
	import type { CompareResponse, StrategyOption, ConversionStrategy, SpendingStrategy } from '$lib/types';

	let loading = $state(false);
	let error = $state('');
	let result = $state<CompareResponse | null>(null);

	let conversionOptions = $state<StrategyOption[]>([]);
	let spendingOptions = $state<StrategyOption[]>([]);
	let selectedConversion = $state<Record<string, boolean>>({});
	let selectedSpending = $state<Record<string, boolean>>({});

	onMount(async () => {
		try {
			const strats = await fetchStrategies();
			conversionOptions = strats.conversion_strategies;
			spendingOptions = strats.spending_strategies;
			for (const s of conversionOptions) selectedConversion[s.value] = true;
			for (const s of spendingOptions) selectedSpending[s.value] = s.value === 'fixed_dollar';
		} catch (e: any) {
			error = `Failed to load strategies: ${e.message}`;
		}
	});

	function getSelectedConversion(): ConversionStrategy[] {
		return Object.entries(selectedConversion)
			.filter(([, v]) => v)
			.map(([k]) => k as ConversionStrategy);
	}

	function getSelectedSpending(): SpendingStrategy[] {
		return Object.entries(selectedSpending)
			.filter(([, v]) => v)
			.map(([k]) => k as SpendingStrategy);
	}

	let canRun = $derived(getSelectedConversion().length > 0 && getSelectedSpending().length > 0);

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
			result = await runCompare(p, getSelectedConversion(), getSelectedSpending());
		} catch (e: any) {
			error = e.message || 'Comparison failed';
		} finally {
			loading = false;
		}
	}

	let bestBalance = $derived(result ? Math.max(...result.comparisons.map((c) => c.final_balance)) : 0);
	let bestTax = $derived(result ? Math.min(...result.comparisons.map((c) => c.total_taxes_paid)) : 0);
	let bestIrmaa = $derived(result ? Math.min(...result.comparisons.map((c) => c.total_irmaa_paid)) : 0);
</script>

<div class="compare-view">
	<div class="strategy-select">
		<div class="group">
			<h4>Conversion Strategies</h4>
			{#each conversionOptions as opt}
				<label>
					<input type="checkbox" bind:checked={selectedConversion[opt.value]} />
					{opt.description}
				</label>
			{/each}
		</div>
		<div class="group">
			<h4>Spending Strategies</h4>
			{#each spendingOptions as opt}
				<label>
					<input type="checkbox" bind:checked={selectedSpending[opt.value]} />
					{opt.description}
				</label>
			{/each}
		</div>
	</div>

	<div class="controls">
		<button onclick={handleRun} disabled={loading || !canRun}>
			{loading ? 'Comparing...' : 'Run Comparison'}
		</button>
		{#if !canRun}
			<span class="hint">Select at least one of each strategy type.</span>
		{/if}
	</div>

	{#if error}
		<div class="error">{error}</div>
	{/if}

	{#if result}
		<CompareChart comparisons={result.comparisons} />

		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Conversion</th>
						<th>Spending</th>
						<th>Final Balance</th>
						<th>Total Taxes</th>
						<th>Total IRMAA</th>
						<th>Roth Conversions</th>
						<th>Pre-tax</th>
						<th>Roth</th>
						<th>Brokerage</th>
					</tr>
				</thead>
				<tbody>
					{#each result.comparisons as row}
						<tr>
							<td>{row.conversion_strategy}</td>
							<td>{row.spending_strategy}</td>
							<td class:best={row.final_balance === bestBalance}>{currency(row.final_balance)}</td>
							<td class:best={row.total_taxes_paid === bestTax}>{currency(row.total_taxes_paid)}</td>
							<td class:best={row.total_irmaa_paid === bestIrmaa}>{currency(row.total_irmaa_paid)}</td>
							<td>{currency(row.total_roth_conversions)}</td>
							<td>{currency(row.final_pretax_balance)}</td>
							<td>{currency(row.final_roth_balance)}</td>
							<td>{currency(row.final_brokerage_balance)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.strategy-select {
		display: flex;
		gap: 2rem;
		margin-bottom: 1rem;
	}
	.group h4 {
		margin: 0 0 0.5rem;
		font-size: 0.9rem;
		color: #334155;
	}
	.group label {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.85rem;
		color: #475569;
		margin-bottom: 0.3rem;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.hint {
		font-size: 0.8rem;
		color: #94a3b8;
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
	.table-wrap {
		overflow-x: auto;
		margin-top: 1.5rem;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.85rem;
	}
	th, td {
		padding: 0.5rem 0.75rem;
		text-align: right;
		border-bottom: 1px solid #e2e8f0;
		white-space: nowrap;
	}
	th {
		background: #f8fafc;
		font-weight: 600;
		color: #475569;
	}
	td:first-child, td:nth-child(2) {
		text-align: left;
	}
	th:first-child, th:nth-child(2) {
		text-align: left;
	}
	.best {
		font-weight: 700;
		color: #166534;
		background: #f0fdf4;
	}
</style>
