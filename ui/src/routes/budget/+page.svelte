<script lang="ts">
	import { portfolio } from '$lib/stores';
	import SpendingEditor from '$lib/components/portfolio/SpendingEditor.svelte';
</script>

<div class="space-y-6">
	<h2 class="text-xl font-semibold text-surface-900 dark:text-surface-50">Budget</h2>

	<SpendingEditor bind:config={$portfolio.config} bind:plannedExpenses={$portfolio.config.planned_expenses} />
</div>
