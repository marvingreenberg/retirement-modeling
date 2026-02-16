<script lang="ts">
	import { profile } from '$lib/stores';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import { User } from 'lucide-svelte';

	let { onclick }: { onclick: () => void } = $props();

	let avatarUrl = $derived.by(() => {
		const seed = $profile.primaryName || '';
		if (!seed) return '';
		return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;
	});

	let imgFailed = $state(false);
	$effect(() => {
		avatarUrl;
		imgFailed = false;
	});

	let showImage = $derived(avatarUrl && !imgFailed);
</script>

<button class="cursor-pointer" {onclick} aria-label="Open profile">
	<Avatar>
		{#if showImage}
			<Avatar.Image src={avatarUrl} alt="User avatar" onerror={() => imgFailed = true} />
		{/if}
		<Avatar.Fallback>
			<User size={20} />
		</Avatar.Fallback>
	</Avatar>
</button>
