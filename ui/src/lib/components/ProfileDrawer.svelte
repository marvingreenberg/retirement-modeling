<script lang="ts">
	import { portfolio, profile } from '$lib/stores';
	import { X, UserPlus, UserMinus } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let { open = $bindable(false) }: { open: boolean } = $props();

	let dark = $state(false);

	onMount(() => {
		dark = localStorage.getItem('color-scheme') === 'dark';
		document.documentElement.classList.toggle('dark', dark);
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

	function addSpouse() {
		$portfolio.config.current_age_spouse = 62;
		$profile.spouseName = '';
	}

	function removeSpouse() {
		$portfolio.config.current_age_spouse = 0;
		$profile.spouseName = '';
		$portfolio.config.social_security.spouse_benefit = 0;
		$portfolio.config.social_security.spouse_start_age = 67;
		if ($portfolio.config.ss_auto) {
			$portfolio.config.ss_auto.spouse_fra_amount = null;
			$portfolio.config.ss_auto.spouse_start_age = null;
		}
	}
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

					<button class="btn btn-sm preset-tonal text-error-600 dark:text-error-400" onclick={removeSpouse}>
						<UserMinus size={14} />
						Remove Spouse
					</button>
				{:else}
					<button class="btn btn-sm preset-tonal" onclick={addSpouse}>
						<UserPlus size={14} />
						Add Spouse
					</button>
				{/if}

				<label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
					Simulation Years
					<input type="number" class="input text-sm" bind:value={$portfolio.config.simulation_years} min="1" max="60" />
				</label>

				<label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
					Start Year
					<input type="number" class="input text-sm" bind:value={$portfolio.config.start_year} min="2000" max="2100" />
				</label>
			</div>

			<hr class="border-surface-300 dark:border-surface-700" />

			<label class="flex items-center gap-3 cursor-pointer text-sm text-surface-700 dark:text-surface-300">
				<input type="checkbox" class="checkbox" checked={dark} onchange={toggleDarkMode} aria-label="Toggle dark mode" />
				Dark Mode
			</label>
		</aside>
	</div>
{/if}
