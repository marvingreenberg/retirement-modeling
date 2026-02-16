<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import AppBar from '$lib/components/AppBar.svelte';
	import { portfolio, profile, numSimulations } from '$lib/stores';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		if (localStorage.getItem('retirement-sim-autosave') === 'true') {
			try {
				const raw = localStorage.getItem('retirement-sim-state');
				if (raw) {
					const data = JSON.parse(raw);
					if (data.portfolio) portfolio.set(data.portfolio);
					if (data.profile) profile.set(data.profile);
					if (data.numSimulations) numSimulations.set(data.numSimulations);
				}
			} catch { /* ignore corrupt data */ }
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<AppBar />
<div class="h-1 bg-gradient-to-r from-primary-500 via-tertiary-500 to-success-500"></div>

<main class="max-w-6xl mx-auto p-4 sm:p-8">
	{@render children()}
</main>
