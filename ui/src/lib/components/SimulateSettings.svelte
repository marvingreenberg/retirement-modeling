<script lang="ts">
	import { portfolio, validationErrors, formTouched } from '$lib/stores';
	import type { ConversionStrategy, SpendingStrategy } from '$lib/types';
	import InfoPopover from './InfoPopover.svelte';

	let inflError = $derived($formTouched ? ($validationErrors['config.inflation_rate'] ?? '') : '');
	let growthError = $derived($formTouched ? ($validationErrors['config.investment_growth_rate'] ?? '') : '');

	let {
		collapsed = $bindable(false),
		onrun,
		loading = false,
	}: {
		collapsed: boolean;
		onrun: () => void;
		loading: boolean;
	} = $props();

	const conversionLabels: Record<ConversionStrategy, string> = {
		standard: 'No Conversion',
		irmaa_tier_1: 'IRMAA Tier 1',
		'22_percent_bracket': '22% Bracket',
		'24_percent_bracket': '24% Bracket',
	};

	function toPct(v: number): number { return Math.round(v * 10000) / 100; }
	function setPct(e: Event, setter: (v: number) => void) {
		setter(+(e.target as HTMLInputElement).value / 100);
	}

	function strategySummary(): string {
		const c = $portfolio.config;
		const s = c.spending_strategy ?? 'fixed_dollar';
		if (s === 'fixed_dollar') {
			const spend = c.annual_spend_net >= 1000 ? `$${Math.round(c.annual_spend_net / 1000)}K` : `$${c.annual_spend_net}`;
			return `Fixed ${spend}`;
		}
		if (s === 'percent_of_portfolio') return `${toPct(c.withdrawal_rate ?? 0.04).toFixed(1)}% of Portfolio`;
		if (s === 'guardrails' && c.guardrails_config) {
			const g = c.guardrails_config;
			return `Guardrails ${toPct(g.initial_withdrawal_rate).toFixed(1)}%, (${Math.round(g.floor_percent * 100)}/${Math.round(g.ceiling_percent * 100)})`;
		}
		return 'RMD-Based';
	}

	let summaryText = $derived.by(() => {
		const c = $portfolio.config;
		const infl = (c.inflation_rate * 100).toFixed(1);
		const growth = (c.investment_growth_rate * 100).toFixed(1);
		const conv = conversionLabels[c.strategy_target];
		return `${infl}% infl, ${growth}% growth, ${conv}, ${strategySummary()}`;
	});

	let strategyOpen = $state(false);

	function toggleCollapsed() {
		collapsed = !collapsed;
	}
</script>

{#if collapsed}
	<div class="flex items-center gap-3 bg-surface-100 dark:bg-surface-800 rounded cursor-pointer" role="button" tabindex="0" onclick={toggleCollapsed} onkeydown={(e) => e.key === 'Enter' && toggleCollapsed()}>
		<button class="flex flex-col items-center justify-center gap-0.5 h-12 w-14 flex-shrink-0 rounded bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white shadow-sm cursor-pointer" onclick={(e) => { e.stopPropagation(); onrun(); }} disabled={loading} aria-label="Run simulation">
			{#if loading}<span class="inline-block animate-spin text-lg">⏳</span>{:else}<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg><span class="text-[10px] font-bold leading-none">Go</span>{/if}
		</button>
		<span class="text-sm text-surface-600 dark:text-surface-400 flex-1 py-2">{summaryText}</span>
		<span class="text-xs text-surface-500 pr-3">&#9656;</span>
	</div>
{:else}
	<div class="flex gap-3 bg-surface-100 dark:bg-surface-800 rounded p-2">
		<!-- Settings: to the right of button -->
		<div class="flex-1 space-y-1.5">
			<!-- Primary row: inflation, growth, conversion -->
			 		<!-- Simulate button: left-justified, full height of both rows -->
			<button class="flex flex-col items-center justify-center gap-0.5 w-16 flex-shrink-0 self-stretch rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white shadow-md cursor-pointer" onclick={onrun} disabled={loading} aria-label="Run simulation">
				{#if loading}<span class="inline-block animate-spin text-xl">⏳</span>{:else}<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg><span class="text-xs font-bold leading-none">Go</span>{/if}
			</button>
			<div class="flex gap-4 flex-wrap items-end">
				<label class="flex flex-col gap-0.5 text-xs font-medium {inflError ? 'text-error-600 dark:text-error-400' : 'text-surface-600 dark:text-surface-400'}">
					<span class="flex items-center gap-1">Inflation % <InfoPopover text="Assumed annual rate at which prices increase, reducing the purchasing power of fixed withdrawals over time." /></span>
					<input type="number" class="input w-20 text-sm {inflError ? 'ring-2 ring-error-500 border-error-500' : ''}" value={toPct($portfolio.config.inflation_rate)} oninput={(e) => setPct(e, (v) => $portfolio.config.inflation_rate = v)} min="0" max="50" step="0.5" />
					{#if inflError}<span class="text-[10px] text-error-500">{inflError}</span>{/if}
				</label>
				<label class="flex flex-col gap-0.5 text-xs font-medium {growthError ? 'text-error-600 dark:text-error-400' : 'text-surface-600 dark:text-surface-400'}">
					<span class="flex items-center gap-1">Growth % <InfoPopover text="Assumed annual return on investments before inflation. Monte Carlo uses historically-sampled returns instead." /></span>
					<input type="number" class="input w-20 text-sm {growthError ? 'ring-2 ring-error-500 border-error-500' : ''}" value={toPct($portfolio.config.investment_growth_rate)} oninput={(e) => setPct(e, (v) => $portfolio.config.investment_growth_rate = v)} min="-50" max="50" step="0.5" />
					{#if growthError}<span class="text-[10px] text-error-500">{growthError}</span>{/if}
				</label>
				<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
					<span class="flex items-center gap-1">Conversion <InfoPopover text="Controls Roth conversion aggressiveness. No Conversion skips conversions. Other strategies convert pre-tax to Roth up to a tax bracket or IRMAA threshold to reduce future taxes." /></span>
					<select class="select w-40 text-sm" bind:value={$portfolio.config.strategy_target}>
						<option value="standard">No Conversion</option>
						<option value="irmaa_tier_1">IRMAA Tier 1</option>
						<option value="22_percent_bracket">22% Bracket</option>
						<option value="24_percent_bracket">24% Bracket</option>
					</select>
				</label>
			</div>

			<!-- Withdrawal Strategy: collapsible -->
			<button class="text-sm text-surface-700 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100 cursor-pointer w-full text-left font-medium" onclick={() => { strategyOpen = !strategyOpen; }}>
				{strategyOpen ? '▾' : '▸'} Withdrawal Strategy{#if !strategyOpen} <span class="text-surface-500 font-normal">— {strategySummary()}</span>{/if}
			</button>

			{#if strategyOpen}
				<div class="pl-3 space-y-2">
					{#if $portfolio.config.spending_strategy === 'percent_of_portfolio'}
						<div class="flex gap-4 flex-wrap items-end">
							<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
								<span class="flex items-center gap-1">Strategy <InfoPopover text="How annual withdrawals are calculated. Fixed Dollar adjusts for inflation. % of Portfolio takes a fixed percentage each year. Guardrails adjusts spending when withdrawal rate drifts. RMD-Based uses IRS Required Minimum Distribution tables." /></span>
								<select class="select w-44 text-sm" bind:value={$portfolio.config.spending_strategy}>
									<option value="fixed_dollar">Fixed Dollar</option>
									<option value="percent_of_portfolio">% of Portfolio</option>
									<option value="guardrails">Guardrails</option>
									<option value="rmd_based">RMD-Based</option>
								</select>
							</label>
							<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
								Withdrawal Rate
								<input type="number" class="input w-24 text-sm" value={toPct($portfolio.config.withdrawal_rate ?? 0.04)} oninput={(e) => setPct(e, (v) => $portfolio.config.withdrawal_rate = v)} min="1" max="15" step="0.5" />
							</label>
						</div>
					{:else if $portfolio.config.spending_strategy === 'guardrails' && $portfolio.config.guardrails_config}
						<div class="flex gap-4 flex-wrap items-end">
							<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
								<span class="flex items-center gap-1">Strategy <InfoPopover text="How annual withdrawals are calculated. Fixed Dollar adjusts for inflation. % of Portfolio takes a fixed percentage each year. Guardrails adjusts spending when withdrawal rate drifts. RMD-Based uses IRS Required Minimum Distribution tables." /></span>
								<select class="select w-44 text-sm" bind:value={$portfolio.config.spending_strategy}>
									<option value="fixed_dollar">Fixed Dollar</option>
									<option value="percent_of_portfolio">% of Portfolio</option>
									<option value="guardrails">Guardrails</option>
									<option value="rmd_based">RMD-Based</option>
								</select>
							</label>
							<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
								Init. WD Rate
								<input type="number" class="input w-24 text-sm" value={toPct($portfolio.config.guardrails_config.initial_withdrawal_rate)} oninput={(e) => setPct(e, (v) => $portfolio.config.guardrails_config!.initial_withdrawal_rate = v)} min="1" max="15" step="0.5" />
							</label>
						</div>
						<div class="flex gap-4 flex-wrap items-end">
							<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
								Floor %
								<input type="number" class="input w-20 text-sm" value={toPct($portfolio.config.guardrails_config.floor_percent)} oninput={(e) => setPct(e, (v) => $portfolio.config.guardrails_config!.floor_percent = v)} min="50" max="100" step="5" />
							</label>
							<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
								Ceiling %
								<input type="number" class="input w-20 text-sm" value={toPct($portfolio.config.guardrails_config.ceiling_percent)} oninput={(e) => setPct(e, (v) => $portfolio.config.guardrails_config!.ceiling_percent = v)} min="100" max="200" step="5" />
							</label>
							<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
								Adjust %
								<input type="number" class="input w-20 text-sm" value={toPct($portfolio.config.guardrails_config.adjustment_percent)} oninput={(e) => setPct(e, (v) => $portfolio.config.guardrails_config!.adjustment_percent = v)} min="1" max="25" step="1" />
							</label>
						</div>
					{:else}
						<div class="flex gap-4 flex-wrap items-end">
							<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
								<span class="flex items-center gap-1">Strategy <InfoPopover text="How annual withdrawals are calculated. Fixed Dollar adjusts for inflation. % of Portfolio takes a fixed percentage each year. Guardrails adjusts spending when withdrawal rate drifts. RMD-Based uses IRS Required Minimum Distribution tables." /></span>
								<select class="select w-44 text-sm" bind:value={$portfolio.config.spending_strategy}>
									<option value="fixed_dollar">Fixed Dollar</option>
									<option value="percent_of_portfolio">% of Portfolio</option>
									<option value="guardrails">Guardrails</option>
									<option value="rmd_based">RMD-Based</option>
								</select>
							</label>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
