<script lang="ts">
	import { Accordion } from '@skeletonlabs/skeleton-svelte';

	let { title, open = $bindable(false), children } = $props<{
		title: string;
		open?: boolean;
		children: any;
	}>();

	let value = $derived(open ? ['item'] : []);
</script>

<Accordion {value} onValueChange={(detail) => (open = detail.value.includes('item'))}>
	<Accordion.Item value="item">
		<Accordion.ItemTrigger>
			{title}
			<Accordion.ItemIndicator />
		</Accordion.ItemTrigger>
		<Accordion.ItemContent>
			{@render children()}
		</Accordion.ItemContent>
	</Accordion.Item>
</Accordion>
