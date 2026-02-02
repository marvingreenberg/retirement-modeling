<script lang="ts">
	const tabs = ['Portfolio', 'Simulate', 'Monte Carlo', 'Compare'] as const;
	export type Tab = (typeof tabs)[number];

	let { active = $bindable<Tab>('Portfolio') }: { active: Tab } = $props();
</script>

<nav class="tab-nav">
	{#each tabs as tab}
		<button
			class="tab"
			class:active={active === tab}
			onclick={() => (active = tab)}
		>
			{tab}
		</button>
	{/each}
</nav>

<style>
	.tab-nav {
		display: flex;
		gap: 0;
		border-bottom: 2px solid #e2e8f0;
		margin-bottom: 1.5rem;
	}
	.tab {
		padding: 0.75rem 1.5rem;
		border: none;
		background: none;
		cursor: pointer;
		font-size: 0.95rem;
		font-weight: 500;
		color: #64748b;
		border-bottom: 2px solid transparent;
		margin-bottom: -2px;
		transition: color 0.15s, border-color 0.15s;
	}
	.tab:hover {
		color: #334155;
	}
	.tab.active {
		color: #1e40af;
		border-bottom-color: #1e40af;
	}
</style>
