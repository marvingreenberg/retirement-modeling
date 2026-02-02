<script lang="ts">
	import type { SimulationConfig, PlannedExpense } from '$lib/types';

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

<div class="fields">
	<div class="field-row">
		<label>
			Annual Spending ($/yr)
			<input type="number" bind:value={config.annual_spend_net} min="0" step="1000" />
		</label>
		<label>
			Spending Strategy
			<select bind:value={config.spending_strategy}>
				<option value="fixed_dollar">Fixed Dollar</option>
				<option value="percent_of_portfolio">Percent of Portfolio</option>
				<option value="guardrails">Guardrails</option>
				<option value="rmd_based">RMD-Based</option>
			</select>
		</label>
	</div>

	{#if config.spending_strategy === 'percent_of_portfolio'}
		<div class="field-row">
			<label>
				Withdrawal Rate
				<input type="number" bind:value={config.withdrawal_rate} min="0.01" max="0.15" step="0.005" />
			</label>
		</div>
	{/if}

	{#if config.spending_strategy === 'guardrails'}
		<div class="field-row">
			<label>
				Initial Withdrawal Rate
				<input type="number" bind:value={config.guardrails_config.initial_withdrawal_rate} min="0.01" max="0.15" step="0.005" />
			</label>
			<label>
				Floor %
				<input type="number" bind:value={config.guardrails_config.floor_percent} min="0.5" max="1.0" step="0.05" />
			</label>
			<label>
				Ceiling %
				<input type="number" bind:value={config.guardrails_config.ceiling_percent} min="1.0" max="2.0" step="0.05" />
			</label>
			<label>
				Adjustment %
				<input type="number" bind:value={config.guardrails_config.adjustment_percent} min="0.01" max="0.25" step="0.01" />
			</label>
		</div>
	{/if}

	<div class="field-row">
		<label>
			Inflation Rate
			<input type="number" bind:value={config.inflation_rate} min="0" max="0.5" step="0.005" />
		</label>
		<label>
			Investment Growth Rate
			<input type="number" bind:value={config.investment_growth_rate} min="-0.5" max="0.5" step="0.005" />
		</label>
	</div>

	<h4>Planned Expenses</h4>
	{#each config.planned_expenses as expense, i}
		<div class="expense-row">
			<label>
				Name
				<input type="text" bind:value={expense.name} placeholder="Expense name" />
			</label>
			<label>
				Amount ($)
				<input type="number" bind:value={expense.amount} min="0" step="100" />
			</label>
			<label>
				Type
				<select bind:value={expense.expense_type}>
					<option value="one_time">One-time</option>
					<option value="recurring">Recurring</option>
				</select>
			</label>
			{#if expense.expense_type === 'one_time'}
				<label>
					Year
					<input type="number" bind:value={expense.year} min="2000" />
				</label>
			{:else}
				<label>
					Start Age
					<input type="number" bind:value={expense.start_age} min="0" />
				</label>
				<label>
					End Age
					<input type="number" bind:value={expense.end_age} min="0" />
				</label>
			{/if}
			<label class="checkbox-label">
				<input type="checkbox" bind:checked={expense.inflation_adjusted} />
				Inflation Adjusted
			</label>
			<button class="remove-btn" onclick={() => removeExpense(i)}>✕</button>
		</div>
	{/each}
	<button class="add-btn" onclick={addExpense}>+ Add Expense</button>
</div>

<style>
	.fields {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.field-row, .expense-row {
		display: flex;
		gap: 0.75rem;
		align-items: flex-end;
		flex-wrap: wrap;
	}
	.expense-row {
		padding: 0.75rem;
		background: #f8fafc;
		border-radius: 4px;
	}
	h4 {
		margin: 0.5rem 0 0;
		font-size: 0.9rem;
		color: #64748b;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.85rem;
		font-weight: 500;
		color: #475569;
	}
	.checkbox-label {
		flex-direction: row;
		align-items: center;
		gap: 0.4rem;
	}
	input, select {
		padding: 0.4rem 0.5rem;
		border: 1px solid #cbd5e1;
		border-radius: 4px;
		font-size: 0.9rem;
	}
	input[type="text"] { width: 140px; }
	input[type="number"] { width: 120px; }
	select { width: 140px; }
	.remove-btn {
		padding: 0.4rem 0.6rem;
		border: 1px solid #fca5a5;
		background: #fff;
		color: #dc2626;
		border-radius: 4px;
		cursor: pointer;
	}
	.add-btn {
		padding: 0.5rem 1rem;
		border: 1px dashed #94a3b8;
		background: none;
		color: #475569;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.85rem;
		align-self: flex-start;
	}
	.add-btn:hover { background: #f1f5f9; }
</style>
