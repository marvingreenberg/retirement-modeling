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

	let bestBalance = $derived(result ? Math.max(...result.comparisons.map((c) => c.final_balance)) : 0);
	let bestTax = $derived(result ? Math.min(...result.comparisons.map((c) => c.total_taxes_paid)) : 0);
	let bestIrmaa = $derived(result ? Math.min(...result.comparisons.map((c) => c.total_irmaa_paid)) : 0);

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
</script>

<div class="space-y-4">
	<div class="flex gap-8">
		<div>
			<h4 class="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-2">Conversion Strategies</h4>
			{#each conversionOptions as opt}
				<label class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 mb-1">
					<input type="checkbox" class="checkbox" bind:checked={selectedConversion[opt.value]} />
					{opt.description}
				</label>
			{/each}
		</div>
		<div>
			<h4 class="text-sm font-semibold text-surface-900 dark:text-surface-50 mb-2">Spending Strategies</h4>
			{#each spendingOptions as opt}
				<label class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 mb-1">
					<input type="checkbox" class="checkbox" bind:checked={selectedSpending[opt.value]} />
					{opt.description}
				</label>
			{/each}
		</div>
	</div>

	<div class="flex items-center gap-4">
		<button class="btn preset-filled" onclick={handleRun} disabled={loading || !canRun}>
			{loading ? 'Comparing...' : 'Run Comparison'}
		</button>
		{#if !canRun}
			<span class="text-xs text-surface-400">Select at least one of each strategy type.</span>
		{/if}
	</div>

	{#if error}
		<div class="text-error-500 bg-error-50 dark:bg-error-950 p-3 rounded text-sm">{error}</div>
	{/if}

	{#if result}
		<CompareChart comparisons={result.comparisons} />

		<div class="overflow-x-auto">
			<table class="table table-sm">
				<thead>
					<tr>
						<th class="text-left">Conversion</th><th class="text-left">Spending</th>
						<th>Final Balance</th><th>Total Taxes</th><th>Total IRMAA</th>
						<th>Roth Conv.</th><th>Pre-tax</th><th>Roth</th><th>Brokerage</th>
					</tr>
				</thead>
				<tbody>
					{#each result.comparisons as row}
						<tr>
							<td class="text-left">{row.conversion_strategy}</td>
							<td class="text-left">{row.spending_strategy}</td>
							<td class:font-bold={row.final_balance === bestBalance} class:text-success-600={row.final_balance === bestBalance}>{currency(row.final_balance)}</td>
							<td class:font-bold={row.total_taxes_paid === bestTax} class:text-success-600={row.total_taxes_paid === bestTax}>{currency(row.total_taxes_paid)}</td>
							<td class:font-bold={row.total_irmaa_paid === bestIrmaa} class:text-success-600={row.total_irmaa_paid === bestIrmaa}>{currency(row.total_irmaa_paid)}</td>
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
