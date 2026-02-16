<script lang="ts">
	import { portfolio, validationErrors, formTouched, markFormTouched, simulateBlockedSection } from '$lib/stores';

	function handleFocusOut() {
		markFormTouched();
		portfolio.update((p) => ({ ...p }));
	}
	import { validatePortfolio } from '$lib/validation';
	import CollapsibleSection from '$lib/components/CollapsibleSection.svelte';
	import FileControls from '$lib/components/FileControls.svelte';
	import AccountsEditor from './AccountsEditor.svelte';
	import ImportPortfolio from './ImportPortfolio.svelte';
	import IncomeEditor from './IncomeEditor.svelte';
	import { currency } from '$lib/format';
	import { Landmark, Briefcase, Wallet, AlertTriangle, ArrowRight } from 'lucide-svelte';

	let accountsOpen = $state(false);
	let budgetOpen = $state(false);
	let incomeOpen = $state(false);
	let errors = $derived(validatePortfolio($portfolio));
	$effect(() => {
		validationErrors.set(errors);
	});

	let errorList = $derived(
		$formTouched ? Object.entries(errors) : []
	);

	let noAccounts = $derived($portfolio.accounts.length === 0);
	let noBudget = $derived($portfolio.config.annual_spend_net === 0);

	$effect(() => {
		const section = $simulateBlockedSection;
		if (section === 'accounts') accountsOpen = true;
		if (section === 'budget') budgetOpen = true;
	});

	function friendlyPath(path: string): string {
		const fieldLabels: Record<string, string> = {
			balance: 'Balance',
			amount: 'Amount',
			year: 'Year',
			start_age: 'Start Age',
			end_age: 'End Age',
			cost_basis_ratio: 'Cost Basis %',
			available_at_age: 'Available Age',
		};
		const accountMatch = path.match(/^accounts\.(\d+)\.(\w+)$/);
		if (accountMatch) {
			const idx = parseInt(accountMatch[1]);
			const field = accountMatch[2];
			const name = $portfolio.accounts[idx]?.name || `Account ${idx + 1}`;
			const fieldName = fieldLabels[field] || field;
			return `${name} - ${fieldName}`;
		}
		const expenseMatch = path.match(/^config\.planned_expenses\.(\d+)\.(\w+)$/);
		if (expenseMatch) {
			const idx = parseInt(expenseMatch[1]);
			const field = expenseMatch[2];
			const name = $portfolio.config.planned_expenses?.[idx]?.name || `Expense ${idx + 1}`;
			const fieldName = fieldLabels[field] || field;
			return `${name} - ${fieldName}`;
		}
		return path;
	}

	$effect(() => {
		if (!$formTouched) return;
		const keys = Object.keys(errors);
		if (keys.some((k) => k.startsWith('accounts'))) accountsOpen = true;
		if (keys.some((k) => k.startsWith('config.social_security'))) incomeOpen = true;
	});
</script>

<div class="space-y-2" onfocusout={handleFocusOut}>
	<FileControls />

	{#if errorList.length > 0}
		<div class="bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800 rounded p-3">
			<p class="text-error-700 dark:text-error-300 text-sm font-medium mb-2">Validation errors:</p>
			<ul class="text-error-600 dark:text-error-400 text-sm list-disc list-inside space-y-1">
				{#each errorList as [path, message]}
					<li><strong>{friendlyPath(path)}</strong>: {message}</li>
				{/each}
			</ul>
		</div>
	{/if}

	<CollapsibleSection title="Accounts" bind:open={accountsOpen}>
		{#snippet icon()}<Landmark size={16} class="text-tertiary-500" />{/snippet}
		{#if noAccounts}
			<div class="flex items-center gap-2 text-warning-600 dark:text-warning-400 text-sm font-semibold py-2">
				<AlertTriangle size={16} />
				Add an account to allow simulation
			</div>
		{/if}
		<AccountsEditor bind:accounts={$portfolio.accounts} />
		<ImportPortfolio bind:accounts={$portfolio.accounts} />
	</CollapsibleSection>

	<CollapsibleSection title="Budget" bind:open={budgetOpen}>
		{#snippet icon()}<Wallet size={16} class="text-primary-500" />{/snippet}
		{#if noBudget && !noAccounts}
			<div class="flex items-center gap-2 text-warning-600 dark:text-warning-400 text-sm font-semibold py-2">
				<AlertTriangle size={16} />
				Define expected annual spending to allow simulation
			</div>
		{/if}
		<div class="flex gap-4 items-end flex-wrap">
			<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
				Annual Spending ($/yr)
				<input type="number" class="input w-36" bind:value={$portfolio.config.annual_spend_net} min="0" step="1000" />
			</label>
			{#if ($portfolio.config.planned_expenses ?? []).length > 0}
				<span class="text-sm text-surface-500">+ {($portfolio.config.planned_expenses ?? []).length} planned expenses ({currency(($portfolio.config.planned_expenses ?? []).reduce((s, e) => s + (e.amount ?? 0), 0))})</span>
			{/if}
			<a href="/spending" class="btn btn-sm preset-ghost flex items-center gap-1 text-primary-500">
				Full spending plan <ArrowRight size={12} />
			</a>
		</div>
	</CollapsibleSection>

	<CollapsibleSection title="Income" bind:open={incomeOpen}>
		{#snippet icon()}<Briefcase size={16} class="text-success-500" />{/snippet}
		<IncomeEditor bind:config={$portfolio.config} />
	</CollapsibleSection>

</div>
