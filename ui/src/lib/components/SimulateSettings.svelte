<script lang="ts">
	import { portfolio } from '$lib/stores';
	import type { ConversionStrategy, SpendingStrategy } from '$lib/types';
	import InfoPopover from './InfoPopover.svelte';
	import { Play, Shuffle } from 'lucide-svelte';

	let {
		runMode = $bindable<'single' | 'monte_carlo'>('single'),
		numSimulations = $bindable(1000),
		collapsed = $bindable(false),
		onrun,
		loading = false,
	}: {
		runMode: 'single' | 'monte_carlo';
		numSimulations: number;
		collapsed: boolean;
		onrun: () => void;
		loading: boolean;
	} = $props();

	const conversionLabels: Record<ConversionStrategy, string> = {
		standard: 'Standard',
		irmaa_tier_1: 'IRMAA Tier 1',
		'22_percent_bracket': '22% Bracket',
		'24_percent_bracket': '24% Bracket',
	};

	const strategyLabels: Record<SpendingStrategy, string> = {
		fixed_dollar: 'Fixed',
		percent_of_portfolio: 'POP',
		guardrails: 'Guardrails',
		rmd_based: 'RMD',
	};

	function strategyShorthand(): string {
		const c = $portfolio.config;
		const label = strategyLabels[c.spending_strategy ?? 'fixed_dollar'];
		if (c.spending_strategy === 'percent_of_portfolio' && c.withdrawal_rate) {
			return `${(c.withdrawal_rate * 100).toFixed(1)}%/${label}`;
		}
		if (c.spending_strategy === 'guardrails' && c.guardrails_config) {
			return `${label}/${(c.guardrails_config.initial_withdrawal_rate * 100).toFixed(1)}%`;
		}
		if (c.spending_strategy === 'fixed_dollar') {
			const spend = c.annual_spend_net >= 1000 ? `$${Math.round(c.annual_spend_net / 1000)}K` : `$${c.annual_spend_net}`;
			return `${label}/${spend}`;
		}
		return label;
	}

	let summaryText = $derived.by(() => {
		const c = $portfolio.config;
		const infl = (c.inflation_rate * 100).toFixed(1);
		const growth = (c.investment_growth_rate * 100).toFixed(1);
		const conv = conversionLabels[c.strategy_target];
		return `${infl}% infl, ${growth}% growth, ${conv}, ${strategyShorthand()}`;
	});

	let advancedOpen = $state(false);

	function toggleCollapsed() {
		collapsed = !collapsed;
	}
</script>

{#if collapsed}
	<div class="flex items-center gap-2 p-2 bg-surface-100 dark:bg-surface-800 rounded cursor-pointer" role="button" tabindex="0" onclick={toggleCollapsed} onkeydown={(e) => e.key === 'Enter' && toggleCollapsed()}>
		<span class="text-xs text-surface-500">▸</span>
		<span class="text-sm text-surface-600 dark:text-surface-400 flex-1">{summaryText}</span>
		<button class="btn preset-filled btn-sm" onclick={(e) => { e.stopPropagation(); onrun(); }} disabled={loading}>
			{loading ? 'Running...' : 'Simulate'}
		</button>
	</div>
{:else}
	<div class="bg-surface-100 dark:bg-surface-800 rounded p-3 space-y-2">
		<div class="flex gap-4 flex-wrap items-end">
			<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
				<span class="flex items-center gap-1">Inflation % <InfoPopover text="Assumed annual rate at which prices increase, reducing the purchasing power of fixed withdrawals over time." /></span>
				<input type="number" class="input w-20 text-sm" bind:value={$portfolio.config.inflation_rate} min="0" max="0.5" step="0.005" />
			</label>
			<label class="flex flex-col gap-0.5 text-xs font-medium {runMode === 'monte_carlo' ? 'text-surface-400 dark:text-surface-500' : 'text-surface-600 dark:text-surface-400'}">
				<span class="flex items-center gap-1">Growth % {#if runMode === 'monte_carlo'}<span class="text-[10px] text-warning-500">(overridden)</span>{/if} <InfoPopover text="Assumed annual return on investments before inflation. In Monte Carlo mode, this is overridden by historically-sampled returns." /></span>
				<input type="number" class="input w-20 text-sm {runMode === 'monte_carlo' ? 'opacity-50' : ''}" bind:value={$portfolio.config.investment_growth_rate} min="-0.5" max="0.5" step="0.005" />
			</label>
			<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
				<span class="flex items-center gap-1">Conversion <InfoPopover text="Controls Roth conversion aggressiveness. Standard does no conversions. Other strategies convert pre-tax to Roth up to a tax bracket or IRMAA threshold to reduce future taxes." /></span>
				<select class="select w-40 text-sm" bind:value={$portfolio.config.strategy_target}>
					<option value="standard">Standard</option>
					<option value="irmaa_tier_1">IRMAA Tier 1</option>
					<option value="22_percent_bracket">22% Bracket</option>
					<option value="24_percent_bracket">24% Bracket</option>
				</select>
			</label>
		</div>

		<div class="flex gap-4 flex-wrap items-end">
			<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
				<span class="flex items-center gap-1">Withdrawal Strategy <InfoPopover text="How annual withdrawals are calculated. Fixed Dollar adjusts for inflation. % of Portfolio takes a fixed percentage each year. Guardrails adjusts spending when withdrawal rate drifts. RMD-Based uses IRS Required Minimum Distribution tables." /></span>
				<select class="select w-44 text-sm" bind:value={$portfolio.config.spending_strategy}>
					<option value="fixed_dollar">Fixed Dollar</option>
					<option value="percent_of_portfolio">% of Portfolio</option>
					<option value="guardrails">Guardrails</option>
					<option value="rmd_based">RMD-Based</option>
				</select>
			</label>
		</div>

		{#if $portfolio.config.spending_strategy === 'percent_of_portfolio'}
			<div class="flex gap-4 items-end">
				<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
					Withdrawal Rate
					<input type="number" class="input w-24 text-sm" bind:value={$portfolio.config.withdrawal_rate} min="0.01" max="0.15" step="0.005" />
				</label>
			</div>
		{/if}

		{#if $portfolio.config.spending_strategy === 'guardrails' && $portfolio.config.guardrails_config}
			<div class="flex gap-4 flex-wrap items-end">
				<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
					Init. WD Rate
					<input type="number" class="input w-24 text-sm" bind:value={$portfolio.config.guardrails_config.initial_withdrawal_rate} min="0.01" max="0.15" step="0.005" />
				</label>
				<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
					Floor %
					<input type="number" class="input w-20 text-sm" bind:value={$portfolio.config.guardrails_config.floor_percent} min="0.5" max="1.0" step="0.05" />
				</label>
				<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
					Ceiling %
					<input type="number" class="input w-20 text-sm" bind:value={$portfolio.config.guardrails_config.ceiling_percent} min="1.0" max="2.0" step="0.05" />
				</label>
				<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
					Adjust %
					<input type="number" class="input w-20 text-sm" bind:value={$portfolio.config.guardrails_config.adjustment_percent} min="0.01" max="0.25" step="0.01" />
				</label>
			</div>
		{/if}

		<button class="text-xs text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer" onclick={() => { advancedOpen = !advancedOpen; }}>
			{advancedOpen ? '▾' : '▸'} Advanced
		</button>

		{#if advancedOpen}
			<div class="flex gap-4 flex-wrap items-end">
				<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
					State Tax %
					<input type="number" class="input w-20 text-sm" bind:value={$portfolio.config.tax_rate_state} min="0" max="0.2" step="0.0025" />
				</label>
				<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
					Cap Gains %
					<input type="number" class="input w-20 text-sm" bind:value={$portfolio.config.tax_rate_capital_gains} min="0" max="0.3" step="0.005" />
				</label>
				<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
					<span class="flex items-center gap-1">RMD Age <InfoPopover text="Age at which Required Minimum Distributions from pre-tax accounts begin. Currently 73 under the SECURE 2.0 Act." /></span>
					<input type="number" class="input w-20 text-sm" bind:value={$portfolio.config.rmd_start_age} min="70" max="80" />
				</label>
				<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
					<span class="flex items-center gap-1">IRMAA Limit ($) <InfoPopover text="Income threshold above which Medicare Part B/D premiums increase. Roth conversions that push income above this trigger surcharges." /></span>
					<input type="number" class="input w-28 text-sm" bind:value={$portfolio.config.irmaa_limit_tier_1} min="0" step="1000" />
				</label>
			</div>
		{/if}

		<div class="flex items-center gap-4 pt-1">
			<label class="flex items-center gap-1.5 text-sm text-surface-600 dark:text-surface-400 cursor-pointer">
				<input type="radio" name="runMode" value="single" bind:group={runMode} class="radio" />
				<Play size={14} /> Single run
			</label>
			<label class="flex items-center gap-1.5 text-sm text-surface-600 dark:text-surface-400 cursor-pointer">
				<input type="radio" name="runMode" value="monte_carlo" bind:group={runMode} class="radio" />
				<Shuffle size={14} /> Monte Carlo
			</label>
			<InfoPopover text="Runs the simulation many times with investment returns sampled from historical market data (1928-2023). Shows how your plan holds up across a range of market conditions, not just the single average return assumed above." />
			{#if runMode === 'monte_carlo'}
				<input type="number" class="input w-20 text-sm" bind:value={numSimulations} min="1" max="10000" />
				<span class="text-xs text-surface-500">iterations</span>
			{/if}
			<div class="flex-1"></div>
			<button class="btn preset-filled btn-sm" onclick={onrun} disabled={loading}>
				{loading ? 'Running...' : 'Simulate'}
			</button>
		</div>
	</div>
{/if}
