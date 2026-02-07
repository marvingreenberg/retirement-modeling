<script lang="ts">
	import { Accordion } from '@skeletonlabs/skeleton-svelte';
	import type { Snippet } from 'svelte';

	let { title, open = $bindable(false), icon, children } = $props<{
		title: string;
		open?: boolean;
		icon?: Snippet;
		children: any;
	}>();

	let value = $derived(open ? ['item'] : []);
</script>

<Accordion collapsible {value} onValueChange={(d) => (open = d.value.includes('item'))}>
	<Accordion.Item value="item">
		<Accordion.ItemTrigger class="flex items-center justify-between w-full">
			<span class="flex items-center gap-2">
				{#if icon}{@render icon()}{/if}
				{title}
			</span>
			<span class="text-surface-500 transition-transform duration-200" class:rotate-90={open}>▶</span>
		</Accordion.ItemTrigger>
		<Accordion.ItemContent>
			{@render children()}
		</Accordion.ItemContent>
	</Accordion.Item>
</Accordion>
