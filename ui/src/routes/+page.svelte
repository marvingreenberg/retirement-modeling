<script lang="ts">
	import TabNav from '$lib/components/TabNav.svelte';
	import type { Tab } from '$lib/components/TabNav.svelte';
	import DarkModeToggle from '$lib/components/DarkModeToggle.svelte';
	import PortfolioEditor from '$lib/components/portfolio/PortfolioEditor.svelte';
	import SimulateView from '$lib/components/SimulateView.svelte';
	import CompareView from '$lib/components/CompareView.svelte';

	let activeTab: Tab = $state('Portfolio');
</script>

<div class="max-w-6xl mx-auto p-4 sm:p-8">
	<header class="flex items-center justify-between mb-4">
		<h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Retirement Simulator</h1>
		<DarkModeToggle />
	</header>

	<TabNav bind:active={activeTab} />

	<main class="mt-6">
		{#if activeTab === 'Portfolio'}
			<PortfolioEditor />
		{:else if activeTab === 'Simulate'}
			<SimulateView />
		{:else if activeTab === 'Compare'}
			<CompareView />
		{/if}
	</main>
</div>
