<script lang="ts">
	import { portfolio, validationErrors, formTouched, markFormTouched } from '$lib/stores';

	function handleFocusOut() {
		markFormTouched();
		portfolio.update((p) => ({ ...p }));
	}
	import { validatePortfolio } from '$lib/validation';
	import CollapsibleSection from '$lib/components/CollapsibleSection.svelte';
	import FileControls from '$lib/components/FileControls.svelte';
	import PeopleTimeline from './PeopleTimeline.svelte';
	import AccountsEditor from './AccountsEditor.svelte';
	import IncomeEditor from './IncomeEditor.svelte';
	import { Users, Landmark, Briefcase } from 'lucide-svelte';

	let peopleOpen = $state(true);
	let accountsOpen = $state(false);
	let incomeOpen = $state(false);
	let errors = $derived(validatePortfolio($portfolio));
	$effect(() => {
		validationErrors.set(errors);
	});

	let errorList = $derived(
		$formTouched ? Object.entries(errors) : []
	);

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

	<CollapsibleSection title="People & Timeline" bind:open={peopleOpen}>
		{#snippet icon()}<Users size={16} class="text-primary-500" />{/snippet}
		<PeopleTimeline bind:config={$portfolio.config} />
	</CollapsibleSection>

	<CollapsibleSection title="Accounts" bind:open={accountsOpen}>
		{#snippet icon()}<Landmark size={16} class="text-tertiary-500" />{/snippet}
		<AccountsEditor bind:accounts={$portfolio.accounts} />
	</CollapsibleSection>

	<CollapsibleSection title="Income" bind:open={incomeOpen}>
		{#snippet icon()}<Briefcase size={16} class="text-success-500" />{/snippet}
		<IncomeEditor bind:config={$portfolio.config} />
	</CollapsibleSection>

</div>
