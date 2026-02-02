<script lang="ts">
	import type { SimulationConfig } from '$lib/types';

	let { config = $bindable() }: { config: SimulationConfig } = $props();

	function addExpense() {
		config.planned_expenses = [...config.planned_expenses, {
			name: '',
			amount: 0,
			expense_type: 'one_time',
			inflation_adjusted: true,
		}];
	}

	function removeExpense(index: number) {
		config.planned_expenses = config.planned_expenses.filter((_, i) => i !== index);
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex gap-3 items-end">
		<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
			Annual Spending ($/yr)
			<input type="number" class="input w-36" bind:value={config.annual_spend_net} min="0" step="1000" />
		</label>
		<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
			Spending Strategy
			<select class="select w-44" bind:value={config.spending_strategy}>
				<option value="fixed_dollar">Fixed Dollar</option>
				<option value="percent_of_portfolio">Percent of Portfolio</option>
				<option value="guardrails">Guardrails</option>
				<option value="rmd_based">RMD-Based</option>
			</select>
		</label>
	</div>

	{#if config.spending_strategy === 'percent_of_portfolio'}
		<div class="flex gap-3">
			<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
				Withdrawal Rate
				<input type="number" class="input w-30" bind:value={config.withdrawal_rate} min="0.01" max="0.15" step="0.005" />
			</label>
		</div>
	{/if}

	{#if config.spending_strategy === 'guardrails'}
		<div class="flex gap-3 flex-wrap">
			<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
				Initial Withdrawal Rate
				<input type="number" class="input w-30" bind:value={config.guardrails_config.initial_withdrawal_rate} min="0.01" max="0.15" step="0.005" />
			</label>
			<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
				Floor %
				<input type="number" class="input w-24" bind:value={config.guardrails_config.floor_percent} min="0.5" max="1.0" step="0.05" />
			</label>
			<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
				Ceiling %
				<input type="number" class="input w-24" bind:value={config.guardrails_config.ceiling_percent} min="1.0" max="2.0" step="0.05" />
			</label>
			<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
				Adjustment %
				<input type="number" class="input w-24" bind:value={config.guardrails_config.adjustment_percent} min="0.01" max="0.25" step="0.01" />
			</label>
		</div>
	{/if}

	<div class="flex gap-6">
		<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
			Inflation Rate
			<input type="number" class="input w-30" bind:value={config.inflation_rate} min="0" max="0.5" step="0.005" />
		</label>
		<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
			Investment Growth Rate
			<input type="number" class="input w-30" bind:value={config.investment_growth_rate} min="-0.5" max="0.5" step="0.005" />
		</label>
	</div>

	<h4 class="text-sm text-surface-500 dark:text-surface-400 font-medium mt-2">Planned Expenses</h4>
	{#each config.planned_expenses as expense, i}
		<div class="flex gap-3 items-end p-3 bg-surface-100 dark:bg-surface-800 rounded flex-wrap">
			<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
				Name
				<input type="text" class="input w-36" bind:value={expense.name} placeholder="Expense name" />
			</label>
			<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
				Amount ($)
				<input type="number" class="input w-28" bind:value={expense.amount} min="0" step="100" />
			</label>
			<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
				Type
				<select class="select w-30" bind:value={expense.expense_type}>
					<option value="one_time">One-time</option>
					<option value="recurring">Recurring</option>
				</select>
			</label>
			{#if expense.expense_type === 'one_time'}
				<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
					Year
					<input type="number" class="input w-24" bind:value={expense.year} min="2000" />
				</label>
			{:else}
				<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
					Start Age
					<input type="number" class="input w-20" bind:value={expense.start_age} min="0" />
				</label>
				<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
					End Age
					<input type="number" class="input w-20" bind:value={expense.end_age} min="0" />
				</label>
			{/if}
			<label class="flex items-center gap-2 text-sm font-medium text-surface-600 dark:text-surface-400">
				<input type="checkbox" class="checkbox" bind:checked={expense.inflation_adjusted} />
				Inflation Adj.
			</label>
			<button class="btn preset-outlined-error-500 btn-sm" onclick={() => removeExpense(i)}>✕</button>
		</div>
	{/each}
	<button class="btn preset-tonal self-start" onclick={addExpense}>+ Add Expense</button>
</div>
