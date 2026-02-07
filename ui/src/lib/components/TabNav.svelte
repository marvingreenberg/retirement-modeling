<script lang="ts" module>
	export const tabs = ['Portfolio', 'Simulate', 'Compare'] as const;
	export type Tab = (typeof tabs)[number];
</script>

<script lang="ts">
	import { Tabs } from '@skeletonlabs/skeleton-svelte';

	let { active = $bindable<Tab>('Portfolio') }: { active: Tab } = $props();
</script>

<Tabs value={active} onValueChange={(detail) => (active = detail.value as Tab)}>
	<Tabs.List>
		{#each tabs as tab}
			<Tabs.Trigger value={tab}>{tab}</Tabs.Trigger>
		{/each}
		<Tabs.Indicator />
	</Tabs.List>
</Tabs>
