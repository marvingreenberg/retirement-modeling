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
		mcLoading = false,
		error = '',
	}: {
		singleResult: SimulationResponse | null;
		mcResult: MonteCarloResponse | null;
		mcLoading: boolean;
		error: string;
	} = $props();

	let activeTab = $state<'single' | 'monte_carlo'>('single');

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

	function addToComparison(mode: 'single' | 'monte_carlo') {
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
		};

		if (mode === 'single' && singleResult) {
			comparisonSnapshots.update((snaps) => [...snaps, {
				...base,
				runType: 'single' as const,
				finalBalance: singleResult!.summary.final_balance,
				totalTaxes: singleResult!.summary.total_taxes_paid,
				totalIrmaa: singleResult!.summary.total_irmaa_paid,
				totalRothConversions: singleResult!.summary.total_roth_conversions,
			}]);
		} else if (mode === 'monte_carlo' && mcResult) {
			comparisonSnapshots.update((snaps) => [...snaps, {
				...base,
				runType: 'monte_carlo' as const,
				numSimulations: mcResult!.num_simulations,
				finalBalance: mcResult!.median_simulation.years.at(-1)?.total_balance ?? 0,
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

	<!-- Tab bar -->
	<div class="flex gap-1 border-b border-surface-300 dark:border-surface-700">
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
			{#if mcLoading}
				<span class="inline-block ml-1 animate-spin h-3 w-3 border-2 border-primary-500 border-t-transparent rounded-full align-middle"></span>
			{/if}
		</button>
	</div>

	<!-- Single run tab -->
	{#if activeTab === 'single'}
		{#if singleResult}
			<div class="card bg-surface-100 dark:bg-surface-800 p-4">
				<h3 class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-2"><BarChart3 size={18} class="text-primary-500" /> Summary</h3>
				<div class="flex gap-6 flex-wrap">
					{#if singleResult.summary.initial_monthly_spend}
						<div class="flex flex-col gap-0.5">
							<span class="text-xs text-surface-500">Initial Spending</span>
							<span class="text-base font-bold text-surface-900 dark:text-surface-50">{currency(Math.round(singleResult.summary.initial_monthly_spend))}/mo <span class="text-sm font-normal text-surface-500">({currency(singleResult.summary.initial_annual_spend ?? 0)}/yr)</span></span>
						</div>
					{/if}
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
				<button class="btn preset-tonal flex items-center gap-2" onclick={() => addToComparison('single')}>
					<PlusCircle size={16} />
					{addedFeedback ? 'Added!' : 'Add to Comparison'}
				</button>
				<a href="/details" class="text-sm text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">View year-by-year details &rarr;</a>
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center py-16 gap-3">
				<div class="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
				<span class="text-surface-500">Running simulation...</span>
			</div>
		{/if}
	{/if}

	<!-- Monte Carlo tab -->
	{#if activeTab === 'monte_carlo'}
		{#if mcLoading}
			<div class="flex flex-col items-center justify-center py-16 gap-3">
				<div class="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
				<span class="text-surface-500">Running Monte Carlo simulation...</span>
			</div>
		{:else if mcResult}
			<p class="text-xs text-warning-600 dark:text-warning-400">Monte Carlo uses historically-sampled inflation and growth, not the configured values above.</p>

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
				<h3 class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-2"><TrendingUp size={18} class="text-tertiary-500" /> Final Balance Range</h3>
				<div class="flex gap-6 flex-wrap">
					{#each [
						['5th', mcResult.final_balance_p5],
						['Median', mcResult.median_simulation.years.at(-1)?.total_balance ?? 0],
						['95th', mcResult.final_balance_p95],
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
				{#if Math.round((1 - mcResult.success_rate) * mcResult.num_simulations) === 0}
					<p class="text-success-600 dark:text-success-400 text-sm">No simulations resulted in portfolio depletion.</p>
				{:else}
					<div class="flex gap-6 flex-wrap">
						<div class="flex flex-col gap-0.5">
							<span class="text-xs text-surface-500">Depleted</span>
							<span class="text-base font-bold">{Math.round((1 - mcResult.success_rate) * mcResult.num_simulations)} of {mcResult.num_simulations}</span>
						</div>
					</div>
				{/if}
			</div>

			<div class="flex items-center gap-4">
				<button class="btn preset-tonal flex items-center gap-2" onclick={() => addToComparison('monte_carlo')}>
					<PlusCircle size={16} />
					{addedFeedback ? 'Added!' : 'Add to Comparison (median)'}
				</button>
				<a href="/details" class="text-sm text-primary-500 hover:text-primary-600 dark:hover:text-primary-400">View yearly percentiles &rarr;</a>
			</div>
		{/if}
	{/if}
</div>
