<script lang="ts">
	import { portfolio, comparisonSnapshots } from '$lib/stores';
	import { currency, pct } from '$lib/format';
	import BalanceChart from './charts/BalanceChart.svelte';
	import FanChart from './charts/FanChart.svelte';
	import type { SimulationResponse, MonteCarloResponse } from '$lib/types';
	import { BarChart3, TrendingUp, ShieldCheck, PlusCircle } from 'lucide-svelte';

	let {
		singleResult = null,
		mcResult = null,
		lastRunMode = null,
		error = '',
	}: {
		singleResult: SimulationResponse | null;
		mcResult: MonteCarloResponse | null;
		lastRunMode: 'single' | 'monte_carlo' | null;
		error: string;
	} = $props();

	const spendingLabels: Record<string, string> = {
		fixed_dollar: 'Fixed Dollar',
		percent_of_portfolio: '% of Portfolio',
		guardrails: 'Guardrails',
		rmd_based: 'RMD-Based',
	};

	const conversionLabels: Record<string, string> = {
		standard: 'Standard',
		irmaa_tier_1: 'IRMAA Tier 1',
		'22_percent_bracket': '22% Bracket',
		'24_percent_bracket': '24% Bracket',
	};

	let addedFeedback = $state(false);

	function generateSnapshotName(): string {
		const c = $portfolio.config;
		const infl = (c.inflation_rate * 100).toFixed(1);
		const growth = (c.investment_growth_rate * 100).toFixed(1);
		const spend = spendingLabels[c.spending_strategy ?? 'fixed_dollar'];
		const conv = conversionLabels[c.strategy_target];
		return `${infl}% infl, ${growth}% growth, ${spend}, ${conv}`;
	}

	function addToComparison() {
		const c = $portfolio.config;
		const id = crypto.randomUUID();
		const base = {
			id,
			name: generateSnapshotName(),
			inflationRate: c.inflation_rate,
			growthRate: c.investment_growth_rate,
			spendingStrategy: spendingLabels[c.spending_strategy ?? 'fixed_dollar'],
			conversionStrategy: conversionLabels[c.strategy_target],
			taxRateState: c.tax_rate_state,
			taxRateCapitalGains: c.tax_rate_capital_gains,
		};

		if (lastRunMode === 'single' && singleResult) {
			comparisonSnapshots.update((snaps) => [...snaps, {
				...base,
				runType: 'single' as const,
				finalBalance: singleResult!.summary.final_balance,
				totalTaxes: singleResult!.summary.total_taxes_paid,
				totalIrmaa: singleResult!.summary.total_irmaa_paid,
				totalRothConversions: singleResult!.summary.total_roth_conversions,
			}]);
		} else if (lastRunMode === 'monte_carlo' && mcResult) {
			comparisonSnapshots.update((snaps) => [...snaps, {
				...base,
				runType: 'monte_carlo' as const,
				numSimulations: mcResult!.num_simulations,
				finalBalance: mcResult!.median_final_balance,
				totalTaxes: 0,
				totalIrmaa: 0,
				totalRothConversions: 0,
				successRate: mcResult!.success_rate,
			}]);
		}
		addedFeedback = true;
		setTimeout(() => { addedFeedback = false; }, 2000);
	}

	function medianDepletion(ages: number[]): number {
		const sorted = [...ages].sort((a, b) => a - b);
		return sorted[Math.floor(sorted.length / 2)];
	}
</script>

<div class="space-y-4">
	{#if error}
		<div class="text-error-500 bg-error-50 dark:bg-error-950 p-3 rounded text-sm">{error}</div>
	{/if}

	{#if lastRunMode === 'single' && singleResult}
		<div class="card bg-surface-100 dark:bg-surface-800 p-4">
			<h3 class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-2"><BarChart3 size={18} class="text-primary-500" /> Summary</h3>
			<div class="flex gap-6 flex-wrap">
				<div class="flex flex-col gap-0.5">
					<span class="text-xs text-surface-500">Final Balance</span>
					<span class="text-base font-bold text-surface-900 dark:text-surface-50">{currency(singleResult.summary.final_balance)}</span>
				</div>
				<div class="flex flex-col gap-0.5">
					<span class="text-xs text-surface-500">Total Taxes</span>
					<span class="text-base font-bold text-surface-900 dark:text-surface-50">{currency(singleResult.summary.total_taxes_paid)}</span>
				</div>
				<div class="flex flex-col gap-0.5">
					<span class="text-xs text-surface-500">Total IRMAA</span>
					<span class="text-base font-bold text-surface-900 dark:text-surface-50">{currency(singleResult.summary.total_irmaa_paid)}</span>
				</div>
				<div class="flex flex-col gap-0.5">
					<span class="text-xs text-surface-500">Roth Conversions</span>
					<span class="text-base font-bold text-surface-900 dark:text-surface-50">{currency(singleResult.summary.total_roth_conversions)}</span>
				</div>
				<div class="flex flex-col gap-0.5">
					<span class="text-xs text-surface-500">Years</span>
					<span class="text-base font-bold text-surface-900 dark:text-surface-50">{singleResult.summary.simulation_years}</span>
				</div>
			</div>
		</div>

		<BalanceChart years={singleResult.result.years} />

		<div class="flex items-center gap-4">
			<button class="btn preset-tonal flex items-center gap-2" onclick={addToComparison}>
				<PlusCircle size={16} />
				{addedFeedback ? 'Added!' : 'Add to Comparison'}
			</button>
			<a href="/details" class="text-sm text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">View year-by-year details &rarr;</a>
		</div>
	{/if}

	{#if lastRunMode === 'monte_carlo' && mcResult}
		<div class="text-center p-4 rounded-lg text-2xl font-bold"
			class:bg-success-100={mcResult.success_rate >= 0.9}
			class:dark:bg-success-900={mcResult.success_rate >= 0.9}
			class:text-success-700={mcResult.success_rate >= 0.9}
			class:dark:text-success-300={mcResult.success_rate >= 0.9}
			class:bg-warning-100={mcResult.success_rate >= 0.7 && mcResult.success_rate < 0.9}
			class:dark:bg-warning-900={mcResult.success_rate >= 0.7 && mcResult.success_rate < 0.9}
			class:text-warning-700={mcResult.success_rate >= 0.7 && mcResult.success_rate < 0.9}
			class:dark:text-warning-300={mcResult.success_rate >= 0.7 && mcResult.success_rate < 0.9}
			class:bg-error-100={mcResult.success_rate < 0.7}
			class:dark:bg-error-900={mcResult.success_rate < 0.7}
			class:text-error-700={mcResult.success_rate < 0.7}
			class:dark:text-error-300={mcResult.success_rate < 0.7}
		>
			{pct(mcResult.success_rate)} Success Rate
		</div>

		<div class="card bg-surface-100 dark:bg-surface-800 p-4">
			<h3 class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-2"><TrendingUp size={18} class="text-tertiary-500" /> Final Balance Percentiles</h3>
			<div class="flex gap-6 flex-wrap">
				{#each [
					['5th', mcResult.percentile_5],
					['25th', mcResult.percentile_25],
					['Median', mcResult.median_final_balance],
					['75th', mcResult.percentile_75],
					['95th', mcResult.percentile_95],
				] as [label, value]}
					<div class="flex flex-col gap-0.5">
						<span class="text-xs text-surface-500">{label}</span>
						<span class="text-base font-bold text-surface-900 dark:text-surface-50">{currency(value as number)}</span>
					</div>
				{/each}
			</div>
		</div>

		{#if mcResult.yearly_percentiles.length > 0}
			<FanChart percentiles={mcResult.yearly_percentiles} />
		{/if}

		<div class="card bg-surface-100 dark:bg-surface-800 p-4">
			<h3 class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-2"><ShieldCheck size={18} class="text-warning-500" /> Portfolio Depletion</h3>
			{#if mcResult.depletion_ages.length === 0}
				<p class="text-success-600 dark:text-success-400 text-sm">No simulations resulted in portfolio depletion.</p>
			{:else}
				<div class="flex gap-6 flex-wrap">
					<div class="flex flex-col gap-0.5">
						<span class="text-xs text-surface-500">Earliest</span>
						<span class="text-base font-bold">Age {Math.min(...mcResult.depletion_ages)}</span>
					</div>
					<div class="flex flex-col gap-0.5">
						<span class="text-xs text-surface-500">Median</span>
						<span class="text-base font-bold">Age {medianDepletion(mcResult.depletion_ages)}</span>
					</div>
					<div class="flex flex-col gap-0.5">
						<span class="text-xs text-surface-500">Latest</span>
						<span class="text-base font-bold">Age {Math.max(...mcResult.depletion_ages)}</span>
					</div>
					<div class="flex flex-col gap-0.5">
						<span class="text-xs text-surface-500">Depleted</span>
						<span class="text-base font-bold">{mcResult.depletion_ages.length} of {mcResult.num_simulations}</span>
					</div>
				</div>
			{/if}
		</div>

		<div class="flex items-center gap-4">
			<button class="btn preset-tonal flex items-center gap-2" onclick={addToComparison}>
				<PlusCircle size={16} />
				{addedFeedback ? 'Added!' : 'Add to Comparison (median)'}
			</button>
			<a href="/details" class="text-sm text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">View yearly percentiles &rarr;</a>
		</div>
	{/if}
</div>
