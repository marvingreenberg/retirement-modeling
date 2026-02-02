<script lang="ts">
	import { Switch } from '@skeletonlabs/skeleton-svelte';
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

	$effect(() => {
		applyMode();
	});
</script>

<div class="flex items-center gap-2">
	<span class="text-sm text-surface-600 dark:text-surface-400">{dark ? 'Dark' : 'Light'}</span>
	<Switch bind:checked={dark}>
		<Switch.Control>
			<Switch.Thumb />
		</Switch.Control>
	</Switch>
</div>
