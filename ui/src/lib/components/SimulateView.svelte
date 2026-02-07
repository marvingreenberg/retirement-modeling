<script lang="ts">
	import { portfolio, validationErrors, comparisonSnapshots } from '$lib/stores';
	import { validatePortfolio } from '$lib/validation';
	import { runSimulation, runMonteCarlo } from '$lib/api';
	import { currency, pct } from '$lib/format';
	import BalanceChart from './charts/BalanceChart.svelte';
	import FanChart from './charts/FanChart.svelte';
	import CollapsibleSection from './CollapsibleSection.svelte';
	import SimulateSettings from './SimulateSettings.svelte';
	import type { SimulationResponse, MonteCarloResponse, SpendingStrategy, ConversionStrategy } from '$lib/types';

	let loading = $state(false);
	let error = $state('');
	let runMode = $state<'single' | 'monte_carlo'>('single');
	let numSimulations = $state(1000);
	let settingsCollapsed = $state(false);

	let singleResult = $state<SimulationResponse | null>(null);
	let mcResult = $state<MonteCarloResponse | null>(null);
	let lastRunMode = $state<'single' | 'monte_carlo' | null>(null);
	let tableOpen = $state(false);
	let addedFeedback = $state(false);

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

	function generateSnapshotName(): string {
		const c = $portfolio.config;
		const infl = (c.inflation_rate * 100).toFixed(1);
		const growth = (c.investment_growth_rate * 100).toFixed(1);
		const spend = spendingLabels[c.spending_strategy ?? 'fixed_dollar'];
		const conv = conversionLabels[c.strategy_target];
		return `${infl}% infl, ${growth}% growth, ${spend}, ${conv}`;
	}

	async function handleRun() {
		const p = $portfolio;
		const errors = validatePortfolio(p);
		validationErrors.set(errors);
		if (Object.keys(errors).length > 0) {
			error = 'Portfolio has validation errors. Check the Portfolio tab.';
			return;
		}

		loading = true;
		error = '';
		singleResult = null;
		mcResult = null;

		try {
			if (runMode === 'single') {
				singleResult = await runSimulation(p);
			} else {
				mcResult = await runMonteCarlo(p, numSimulations);
			}
			lastRunMode = runMode;
			settingsCollapsed = true;
		} catch (e: any) {
			error = e.message || 'Simulation failed';
		} finally {
			loading = false;
		}
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
	<SimulateSettings
		bind:runMode
		bind:numSimulations
		bind:collapsed={settingsCollapsed}
		onrun={handleRun}
		{loading}
	/>

	{#if error}
		<div class="text-error-500 bg-error-50 dark:bg-error-950 p-3 rounded text-sm">{error}</div>
	{/if}

	{#if lastRunMode === 'single' && singleResult}
		<div class="card bg-surface-100 dark:bg-surface-800 p-4">
			<h3 class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-3">Summary</h3>
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
						{#each singleResult.result.years as yr}
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

		<button class="btn preset-tonal" onclick={addToComparison}>
			{addedFeedback ? '✓ Added!' : '+ Add to Comparison'}
		</button>
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
			<h3 class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-3">Final Balance Percentiles</h3>
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
			<h3 class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-3">Portfolio Depletion</h3>
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

		<button class="btn preset-tonal" onclick={addToComparison}>
			{addedFeedback ? '✓ Added!' : '+ Add to Comparison (median)'}
		</button>
	{/if}
</div>
