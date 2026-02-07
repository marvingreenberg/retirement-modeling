<script lang="ts">
	import type { SimulationConfig, PlannedExpense } from '$lib/types';
	import { validationErrors, formTouched } from '$lib/stores';

	let {
		config = $bindable(),
		plannedExpenses = $bindable(),
	}: {
		config: SimulationConfig;
		plannedExpenses: PlannedExpense[];
	} = $props();

	let nextExpenseId = $state(plannedExpenses.length + 1);

	function addExpense() {
		const num = nextExpenseId++;
		plannedExpenses = [
			...plannedExpenses,
			{
				name: `Expense ${num}`,
				amount: 1000,
				expense_type: 'one_time' as const,
				year: new Date().getFullYear(),
				inflation_adjusted: true,
			},
		];
	}

	function removeExpense(index: number) {
		plannedExpenses = plannedExpenses.filter((_, i) => i !== index);
	}

	function hasError(path: string): boolean {
		if (!$formTouched) return false;
		return Object.keys($validationErrors).some((k) => k.startsWith(path));
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex gap-3 items-end">
		<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
			Annual Spending ($/yr)
			<input type="number" class="input w-36" bind:value={config.annual_spend_net} min="0" step="1000" />
		</label>
	</div>

	<h4 class="text-sm text-surface-500 dark:text-surface-400 font-medium mt-2">Planned Expenses</h4>
	{#each plannedExpenses as expense, i}
		{@const amountError = hasError(`config.planned_expenses.${i}.amount`)}
		{@const yearError = hasError(`config.planned_expenses.${i}.year`)}
		<div class="flex gap-3 items-end p-3 bg-surface-100 dark:bg-surface-800 rounded flex-wrap">
			<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
				Name
				<input type="text" class="input w-36 no-spinner" bind:value={expense.name} placeholder="Expense name" />
			</label>
			<label class="flex flex-col gap-1 text-sm font-medium {amountError ? 'text-error-600 dark:text-error-400' : 'text-surface-600 dark:text-surface-400'}">
				Amount ($)
				<input
					type="number"
					class="input w-28 no-spinner {amountError ? 'ring-2 ring-error-500 border-error-500' : ''}"
					bind:value={expense.amount}
					min="1"
					step="100"
				/>
			</label>
			<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
				Type
				<select class="select w-30" bind:value={expense.expense_type}>
					<option value="one_time">One-time</option>
					<option value="recurring">Recurring</option>
				</select>
			</label>
			{#if expense.expense_type === 'one_time'}
				<label class="flex flex-col gap-1 text-sm font-medium {yearError ? 'text-error-600 dark:text-error-400' : 'text-surface-600 dark:text-surface-400'}">
					Year
					<input type="number" class="input w-24 no-spinner {yearError ? 'ring-2 ring-error-500 border-error-500' : ''}" bind:value={expense.year} min="2000" />
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
			<button class="btn preset-outlined btn-sm" onclick={() => removeExpense(i)}>✕</button>
		</div>
	{/each}
	<button class="btn preset-tonal self-start" onclick={addExpense}>+ Add Expense</button>
</div>
