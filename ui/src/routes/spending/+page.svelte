<script lang="ts">
	import { portfolio, formTouched, markFormTouched, validationErrors } from '$lib/stores';
	import { validatePortfolio } from '$lib/validation';
	import SpendingEditor from '$lib/components/portfolio/SpendingEditor.svelte';
	import { currency } from '$lib/format';
	import { Wallet } from 'lucide-svelte';

	function handleFocusOut() {
		markFormTouched();
		portfolio.update((p) => ({ ...p }));
	}

	let errors = $derived(validatePortfolio($portfolio));
	$effect(() => { validationErrors.set(errors); });

	let expenseErrors = $derived(
		$formTouched
			? Object.entries(errors).filter(([k]) => k.startsWith('config.planned_expenses'))
			: []
	);

	let totalPlanned = $derived(
		($portfolio.config.planned_expenses ?? []).reduce((sum, e) => sum + (e.amount ?? 0), 0)
	);
</script>

<div class="space-y-4" onfocusout={handleFocusOut}>
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2">
			<Wallet size={22} class="text-primary-500" /> Spending Plan
		</h2>
		<div class="text-sm text-surface-500">
			Base: {currency($portfolio.config.annual_spend_net)}/yr ({currency(Math.round($portfolio.config.annual_spend_net / 12))}/mo)
			{#if totalPlanned > 0}
				+ {currency(totalPlanned)} planned
			{/if}
		</div>
	</div>

	{#if expenseErrors.length > 0}
		<div class="bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800 rounded p-3">
			<ul class="text-error-600 dark:text-error-400 text-sm list-disc list-inside space-y-1">
				{#each expenseErrors as [path, message]}
					<li>{message}</li>
				{/each}
			</ul>
		</div>
	{/if}

	<div class="card bg-surface-100 dark:bg-surface-800 p-4">
		<SpendingEditor bind:config={$portfolio.config} bind:plannedExpenses={$portfolio.config.planned_expenses} />
	</div>
</div>
