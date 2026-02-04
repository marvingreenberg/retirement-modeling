<script lang="ts">
	import { onMount } from 'svelte';

	let dark = $state(false);

	onMount(() => {
		const saved = localStorage.getItem('color-scheme');
		if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
			dark = true;
		}
		applyMode();
	});

	function applyMode() {
		document.documentElement.classList.toggle('dark', dark);
		localStorage.setItem('color-scheme', dark ? 'dark' : 'light');
	}

	function toggle() {
		dark = !dark;
		applyMode();
	}
</script>

<button
	onclick={toggle}
	class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors"
	aria-label="Toggle dark mode"
>
	<span class="text-sm text-surface-700 dark:text-surface-200">{dark ? '🌙 Dark' : '☀️ Light'}</span>
</button>
