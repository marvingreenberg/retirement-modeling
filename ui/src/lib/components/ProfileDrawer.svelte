<script lang="ts">
	import { portfolio, profile } from '$lib/stores';
	import { X } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let { open = $bindable(false) }: { open: boolean } = $props();

	let dark = $state(false);

	onMount(() => {
		const saved = localStorage.getItem('color-scheme');
		dark = saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
	});

	function toggleDarkMode() {
		dark = !dark;
		document.documentElement.classList.toggle('dark', dark);
		localStorage.setItem('color-scheme', dark ? 'dark' : 'light');
	}

	function handleBackdrop(e: MouseEvent) {
		if (e.target === e.currentTarget) open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}

	let hasSpouse = $derived($portfolio.config.current_age_spouse > 0);
</script>

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/40 z-50"
		onclick={handleBackdrop}
		onkeydown={handleKeydown}
	>
		<aside class="absolute right-0 top-0 h-full w-80 bg-surface-50 dark:bg-surface-900 shadow-xl p-5 space-y-5 overflow-y-auto">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-semibold text-surface-900 dark:text-surface-50">Profile</h2>
				<button class="btn btn-sm preset-ghost" onclick={() => open = false} aria-label="Close profile">
					<X size={18} />
				</button>
			</div>

			<div class="space-y-3">
				<label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
					Your Name
					<input type="text" class="input text-sm" bind:value={$profile.primaryName} />
				</label>

				<label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
					Your Age
					<input type="number" class="input text-sm" bind:value={$portfolio.config.current_age_primary} min="20" max="120" />
				</label>

				{#if hasSpouse}
					<label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
						Spouse Name
						<input type="text" class="input text-sm" bind:value={$profile.spouseName} />
					</label>

					<label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
						Spouse Age
						<input type="number" class="input text-sm" bind:value={$portfolio.config.current_age_spouse} min="20" max="120" />
					</label>
				{/if}

				<label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
					Simulation Years
					<input type="number" class="input text-sm" bind:value={$portfolio.config.simulation_years} min="1" max="60" />
				</label>
			</div>

			<hr class="border-surface-300 dark:border-surface-700" />

			<button
				onclick={toggleDarkMode}
				class="flex items-center gap-2 w-full px-3 py-2 rounded bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors text-sm text-surface-700 dark:text-surface-200"
				aria-label="Toggle dark mode"
			>
				{dark ? '🌙 Dark Mode' : '☀️ Light Mode'}
			</button>
		</aside>
	</div>
{/if}
