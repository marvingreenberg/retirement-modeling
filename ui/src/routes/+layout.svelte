<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import AppBar from '$lib/components/AppBar.svelte';
	import GuidedTour from '$lib/components/GuidedTour.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<AppBar />
<div class="h-1 bg-gradient-to-r from-primary-500 via-tertiary-500 to-success-500"></div>

<main class="max-w-6xl mx-auto p-4 sm:p-8">
	{@render children()}
</main>

<GuidedTour />
