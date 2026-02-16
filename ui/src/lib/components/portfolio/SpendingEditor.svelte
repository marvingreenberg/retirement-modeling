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

	function handleTypeChange(expense: PlannedExpense, newType: 'one_time' | 'recurring') {
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
				min="0" step="1000" />
		</label>
		<span class="text-xs text-surface-500 self-center">{currency(Math.round(config.annual_spend_net / 12))}/mo</span>
	</div>

	{#if plannedExpenses.length > 0}
		<table class="w-full text-sm mt-2">
			<thead>
				<tr class="text-left text-surface-500 dark:text-surface-400 font-medium">
					<th class="pb-1">Name</th>
					<th class="pb-1">Amount ($)</th>
					<th class="pb-1">Type</th>
					<th class="pb-1">When</th>
					<th class="pb-1 text-center">Infl.</th>
					<th class="pb-1"></th>
				</tr>
			</thead>
			<tbody>
				{#each plannedExpenses as expense, i}
					{@const amountError = hasError(`config.planned_expenses.${i}.amount`)}
					{@const yearError = hasError(`config.planned_expenses.${i}.year`)}
					<tr class="border-t border-surface-200 dark:border-surface-700">
						<td class="py-1 pr-2">
							<input type="text" class="input w-28 no-spinner" bind:value={expense.name} placeholder="Expense name" aria-label="Name" />
						</td>
						<td class="py-1 pr-2">
							<input type="number" class="input w-24 no-spinner {amountError ? 'ring-2 ring-error-500 border-error-500' : ''}" bind:value={expense.amount} min="1" step="100" aria-label="Amount" />
						</td>
						<td class="py-1 pr-2">
							<select class="select w-28" value={expense.expense_type} aria-label="Type"
								onchange={(e) => handleTypeChange(expense, (e.target as HTMLSelectElement).value as 'one_time' | 'recurring')}>
								<option value="one_time">One-time</option>
								<option value="recurring">Recurring</option>
							</select>
						</td>
						<td class="py-1 pr-2">
							{#if expense.expense_type === 'one_time'}
								<input type="number" class="input w-20 no-spinner {yearError ? 'ring-2 ring-error-500 border-error-500' : ''}" bind:value={expense.year} min="2000" aria-label="Year" />
							{:else}
								<span class="flex items-center gap-1">
									<input type="number" class="input w-20 no-spinner" bind:value={expense.start_year} min="2000" aria-label="Start Year" />
									<span class="text-surface-400">&ndash;</span>
									<input type="number" class="input w-20 no-spinner" bind:value={expense.end_year} min="2000" aria-label="End Year" />
								</span>
							{/if}
						</td>
						<td class="py-1 text-center">
							<input type="checkbox" class="checkbox" bind:checked={expense.inflation_adjusted} aria-label="Inflation adjusted" />
						</td>
						<td class="py-1">
							<button class="btn preset-outlined btn-sm" onclick={() => removeExpense(i)} aria-label="Remove expense">✕</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
	<button class="btn preset-tonal self-start" onclick={addExpense}>+ Add Expense</button>
</div>
