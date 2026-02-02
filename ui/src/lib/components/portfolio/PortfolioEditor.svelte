<script lang="ts">
	import { portfolio } from '$lib/stores';
	import CollapsibleSection from '$lib/components/CollapsibleSection.svelte';
	import FileControls from '$lib/components/FileControls.svelte';
	import PeopleTimeline from './PeopleTimeline.svelte';
	import AccountsEditor from './AccountsEditor.svelte';
	import IncomeEditor from './IncomeEditor.svelte';
	import SpendingEditor from './SpendingEditor.svelte';
	import TaxEditor from './TaxEditor.svelte';
	import StrategyEditor from './StrategyEditor.svelte';

	let peopleOpen = $state(true);
	let accountsOpen = $state(false);
	let incomeOpen = $state(false);
	let spendingOpen = $state(false);
	let taxOpen = $state(false);
	let strategyOpen = $state(false);
</script>

<div class="editor">
	<FileControls />

	<CollapsibleSection title="People & Timeline" bind:open={peopleOpen}>
		<PeopleTimeline bind:config={$portfolio.config} />
	</CollapsibleSection>

	<CollapsibleSection title="Accounts" bind:open={accountsOpen}>
		<AccountsEditor bind:accounts={$portfolio.accounts} />
	</CollapsibleSection>

	<CollapsibleSection title="Income" bind:open={incomeOpen}>
		<IncomeEditor bind:socialSecurity={$portfolio.config.social_security} />
	</CollapsibleSection>

	<CollapsibleSection title="Spending" bind:open={spendingOpen}>
		<SpendingEditor bind:config={$portfolio.config} />
	</CollapsibleSection>

	<CollapsibleSection title="Taxes" bind:open={taxOpen}>
		<TaxEditor bind:config={$portfolio.config} />
	</CollapsibleSection>

	<CollapsibleSection title="Strategy" bind:open={strategyOpen}>
		<StrategyEditor bind:config={$portfolio.config} />
	</CollapsibleSection>
</div>
