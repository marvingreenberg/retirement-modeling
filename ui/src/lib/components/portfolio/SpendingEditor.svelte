<script lang="ts">
	import type { SimulationConfig, PlannedExpense } from '$lib/types';
	import { currency } from '$lib/format';
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

	function handleTypeChange(i: number, newType: 'one_time' | 'recurring') {
		const expense = { ...plannedExpenses[i] };
		if (newType === 'recurring') {
			expense.start_year = expense.year;
			expense.end_year = undefined;
			expense.year = undefined;
		} else {
			expense.year = expense.start_year;
			expense.start_year = undefined;
			expense.end_year = undefined;
		}
		expense.expense_type = newType;
		plannedExpenses[i] = expense;
		plannedExpenses = [...plannedExpenses];
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
			<input type="number" class="input w-36"
				bind:value={config.annual_spend_net}
				onfocus={(e) => e.currentTarget.select()}
				min="0" step="1000" />
		</label>
		<span class="text-xs text-surface-500 self-center">{currency(Math.round(config.annual_spend_net / 12))}/mo</span>
	</div>

	{#if plannedExpenses.length > 0}
		<div class="flex gap-3 items-end px-3 text-xs font-medium text-surface-500 dark:text-surface-400">
			<span class="w-28">Name</span>
			<span class="w-24">Amount ($)</span>
			<span class="w-32">Type</span>
			<span class="w-44">When</span>
			<span class="w-10 text-center">Infl.</span>
		</div>
	{/if}
	{#each plannedExpenses as expense, i}
		{@const amountError = hasError(`config.planned_expenses.${i}.amount`)}
		{@const yearError = hasError(`config.planned_expenses.${i}.year`)}
		<div class="flex gap-3 items-center p-3 bg-surface-100 dark:bg-surface-800 rounded flex-wrap">
			<input type="text" class="input w-28 no-spinner" bind:value={plannedExpenses[i].name} onfocus={(e) => e.currentTarget.select()} placeholder="Expense name" aria-label="Name" />
			<input type="number" class="input w-24 no-spinner {amountError ? 'ring-2 ring-error-500 border-error-500' : ''}" bind:value={plannedExpenses[i].amount} onfocus={(e) => e.currentTarget.select()} min="1" step="100" aria-label="Amount" />
			<select class="select w-32" value={expense.expense_type} aria-label="Type"
				onchange={(e) => handleTypeChange(i, (e.target as HTMLSelectElement).value as 'one_time' | 'recurring')}>
				<option value="one_time">One-time</option>
				<option value="recurring">Recurring</option>
			</select>
			<div class="w-44">
				{#if expense.expense_type === 'one_time'}
					<input type="number" class="input w-20 no-spinner {yearError ? 'ring-2 ring-error-500 border-error-500' : ''}" bind:value={plannedExpenses[i].year} onfocus={(e) => e.currentTarget.select()} min="2000" aria-label="Year" />
				{:else}
					<span class="flex items-center gap-1">
						<input type="number" class="input w-20 no-spinner" bind:value={plannedExpenses[i].start_year} onfocus={(e) => e.currentTarget.select()} min="2000" aria-label="Start Year" />
						<span class="text-surface-400">&ndash;</span>
						<input type="number" class="input w-20 no-spinner" bind:value={plannedExpenses[i].end_year} onfocus={(e) => e.currentTarget.select()} min="2000" aria-label="End Year" />
					</span>
				{/if}
			</div>
			<div class="w-10 flex justify-center">
				<input type="checkbox" class="checkbox" bind:checked={plannedExpenses[i].inflation_adjusted} aria-label="Inflation adjusted" />
			</div>
			<button class="btn preset-outlined btn-sm" onclick={() => removeExpense(i)} aria-label="Remove expense">✕</button>
		</div>
	{/each}
	<button class="btn preset-tonal self-start" onclick={addExpense}>+ Add Expense</button>
</div>
