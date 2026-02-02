<script lang="ts">
	import TabNav from '$lib/components/TabNav.svelte';
	import type { Tab } from '$lib/components/TabNav.svelte';
	import PortfolioEditor from '$lib/components/portfolio/PortfolioEditor.svelte';
	import SimulateView from '$lib/components/SimulateView.svelte';
	import MonteCarloView from '$lib/components/MonteCarloView.svelte';
	import CompareView from '$lib/components/CompareView.svelte';

	let activeTab: Tab = $state('Portfolio');
</script>

<div class="app">
	<header>
		<h1>Retirement Simulator</h1>
	</header>

	<TabNav bind:active={activeTab} />

	<main>
		{#if activeTab === 'Portfolio'}
			<PortfolioEditor />
		{:else if activeTab === 'Simulate'}
			<SimulateView />
		{:else if activeTab === 'Monte Carlo'}
			<MonteCarloView />
		{:else if activeTab === 'Compare'}
			<CompareView />
		{/if}
	</main>
</div>

<style>
	.app {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem 2rem;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	header h1 {
		font-size: 1.5rem;
		font-weight: 600;
		color: #1e293b;
		margin-bottom: 1rem;
	}
</style>
