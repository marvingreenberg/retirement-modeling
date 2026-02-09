<script lang="ts">
	import { portfolio } from '$lib/stores';
	import InfoPopover from '$lib/components/InfoPopover.svelte';
	import SpendingEditor from '$lib/components/portfolio/SpendingEditor.svelte';
</script>

<div class="space-y-6">
	<h2 class="text-xl font-semibold text-surface-900 dark:text-surface-50">Spending Configuration</h2>

	<div class="bg-surface-100 dark:bg-surface-800 rounded p-4 space-y-3">
		<h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300">Strategy</h3>
		<div class="flex gap-4 flex-wrap items-end">
			<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
				<span class="flex items-center gap-1">Spending Strategy <InfoPopover text="How annual withdrawals are calculated. Fixed Dollar adjusts for inflation. % of Portfolio takes a fixed percentage each year. Guardrails adjusts spending when withdrawal rate drifts. RMD-Based uses IRS Required Minimum Distribution tables." /></span>
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
	</div>

	<SpendingEditor bind:config={$portfolio.config} bind:plannedExpenses={$portfolio.config.planned_expenses} />
</div>
