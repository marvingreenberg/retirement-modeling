<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import type { YearlyResultPercentiles } from '$lib/types';

	let { percentiles }: { percentiles: YearlyResultPercentiles[] } = $props();
	let canvas: HTMLCanvasElement;
	let chart: Chart | undefined;

	Chart.register(...registerables);

	function buildChart() {
		chart?.destroy();
		const labels = percentiles.map((p) => `Age ${p.age}`);
		chart = new Chart(canvas, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: '95th percentile',
						data: percentiles.map((p) => p.balance_p95),
						borderColor: 'rgba(30,64,175,0.2)',
						backgroundColor: 'rgba(30,64,175,0.08)',
						fill: '+4',
						borderWidth: 1,
						pointRadius: 0,
					},
					{
						label: '75th percentile',
						data: percentiles.map((p) => p.balance_p75),
						borderColor: 'rgba(30,64,175,0.3)',
						backgroundColor: 'rgba(30,64,175,0.12)',
						fill: '+2',
						borderWidth: 1,
						pointRadius: 0,
					},
					{
						label: 'Median',
						data: percentiles.map((p) => p.balance_median),
						borderColor: '#1e40af',
						borderWidth: 2.5,
						fill: false,
						pointRadius: 0,
					},
					{
						label: '25th percentile',
						data: percentiles.map((p) => p.balance_p25),
						borderColor: 'rgba(30,64,175,0.3)',
						borderWidth: 1,
						fill: false,
						pointRadius: 0,
					},
					{
						label: '5th percentile',
						data: percentiles.map((p) => p.balance_p5),
						borderColor: 'rgba(30,64,175,0.2)',
						borderWidth: 1,
						fill: false,
						pointRadius: 0,
					},
				],
			},
			options: {
				responsive: true,
				plugins: {
					tooltip: {
						callbacks: {
							label: (ctx) => `${ctx.dataset.label}: $${Math.round(ctx.parsed.y ?? 0).toLocaleString()}`,
						},
					},
				},
				scales: {
					y: {
						ticks: {
							callback: (v) => `$${(Number(v) / 1000).toFixed(0)}K`,
						},
					},
				},
			},
		});
	}

	onMount(() => buildChart());

	$effect(() => {
		if (canvas && percentiles) buildChart();
	});
</script>

<div class="relative w-full max-h-[400px]">
	<canvas bind:this={canvas}></canvas>
</div>
