<script lang="ts">
	import { profile } from '$lib/stores';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import { User } from 'lucide-svelte';

	let { onclick }: { onclick: () => void } = $props();

	let initials = $derived.by(() => {
		const p = $profile;
		if (!p.primaryName) return '';
		const first = p.primaryName[0].toUpperCase();
		if (p.spouseName) return `${first},${p.spouseName[0].toUpperCase()}`;
		return first;
	});
</script>

<button class="cursor-pointer" {onclick} aria-label="Open profile">
	<Avatar>
		<Avatar.Fallback>
			{#if initials}
				<span class="text-sm font-semibold">{initials}</span>
			{:else}
				<User size={20} />
			{/if}
		</Avatar.Fallback>
	</Avatar>
</button>
