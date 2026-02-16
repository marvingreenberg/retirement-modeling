<script lang="ts">
	import { tourActive } from '$lib/stores';
	import TourTooltip from './TourTooltip.svelte';
	import { onMount } from 'svelte';
	import { tick } from 'svelte';

	const steps = [
		{ target: 'overview', text: 'Overview — Control simulations and view results' },
		{ target: 'spending', text: 'Spending — Plan your expenses and spending goals' },
		{ target: 'compare', text: 'Compare — Save and compare simulation snapshots' },
		{ target: 'details', text: 'Details — View year-by-year simulation breakdown' },
		{ target: 'profile', text: 'Profile — Edit names, ages, and preferences' },
	];

	let currentStep = $state(-1);
	let targetEl = $state<HTMLElement | null>(null);
	let timer: ReturnType<typeof setTimeout> | null = null;
	let hasRun = false;

	function advance() {
		if (timer) clearTimeout(timer);
		const next = currentStep + 1;
		if (next >= steps.length) {
			currentStep = -1;
			targetEl = null;
			tourActive.set(false);
			return;
		}
		currentStep = next;
		targetEl = document.querySelector(`[data-tour="${steps[next].target}"]`);
		timer = setTimeout(advance, 3000);
	}

	function handleClick() {
		if (currentStep >= 0) advance();
	}

	$effect(() => {
		if ($tourActive && !hasRun) {
			hasRun = true;
			tick().then(() => {
				currentStep = -1;
				advance();
			});
		}
	});

	onMount(() => {
		return () => { if (timer) clearTimeout(timer); };
	});
</script>

{#if currentStep >= 0}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-[99]" onclick={handleClick} onkeydown={(e) => { if (e.key === 'Escape' || e.key === ' ') handleClick(); }}>
	</div>
	<TourTooltip text={steps[currentStep].text} {targetEl} />
{/if}
