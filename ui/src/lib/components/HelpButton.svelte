<script lang="ts">
	import { CircleHelp } from 'lucide-svelte';
	import { openHelp } from '$lib/helpState.svelte';

	let { topic, anchor }: { topic: string; anchor?: string } = $props();
</script>

<button
	class="inline-flex items-center justify-center w-4 h-4 rounded-full text-surface-500 dark:text-surface-400 hover:text-primary-500 dark:hover:text-primary-400 cursor-pointer"
	onclick={(e) => {
		e.stopPropagation();
		openHelp(topic, anchor);
	}}
	aria-label="Help"
	type="button"
>
	<CircleHelp size={14} />
</button>
