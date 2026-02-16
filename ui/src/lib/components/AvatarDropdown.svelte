<script lang="ts">
	import { profile } from '$lib/stores';
	import { User, Settings } from 'lucide-svelte';

	let { open = $bindable(false) }: { open: boolean } = $props();

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

	let displayName = $derived.by(() => {
		const p = $profile;
		if (!p.primaryName) return '';
		if (p.spouseName) return `${p.primaryName} & ${p.spouseName}`;
		return p.primaryName;
	});

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50" onclick={handleBackdrop} onkeydown={handleKeydown}>
		<div class="absolute right-4 top-14 w-56 bg-surface-50 dark:bg-surface-800 rounded-lg shadow-xl border border-surface-200 dark:border-surface-700 p-4">
			<!-- Avatar + Name -->
			<div class="text-center mb-3">
				{#if avatarUrl && !imgFailed}
					<img
						src={avatarUrl}
						alt="Avatar"
						class="w-14 h-14 rounded-full mx-auto mb-2 bg-surface-200 dark:bg-surface-700"
						onerror={() => imgFailed = true}
					/>
				{:else}
					<div class="w-14 h-14 rounded-full mx-auto mb-2 bg-surface-200 dark:bg-surface-700 flex items-center justify-center">
						<User size={24} class="text-surface-500" />
					</div>
				{/if}
				{#if displayName}
					<p class="text-sm font-semibold text-surface-900 dark:text-surface-50 truncate">{displayName}</p>
				{/if}
			</div>

			<hr class="border-surface-300 dark:border-surface-700 mb-2" />

			<a
				href="/settings"
				class="flex items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 rounded hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
				onclick={() => open = false}
			>
				<Settings size={16} />
				Settings
			</a>
		</div>
	</div>
{/if}
