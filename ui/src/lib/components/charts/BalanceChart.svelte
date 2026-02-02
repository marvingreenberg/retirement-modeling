<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import type { YearResult } from '$lib/types';

	let { years }: { years: YearResult[] } = $props();
	let canvas: HTMLCanvasElement;
	let chart: Chart | undefined;

	Chart.register(...registerables);

	function buildChart() {
		chart?.destroy();
		const labels = years.map((y) => `Age ${y.age_primary}`);
		chart = new Chart(canvas, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: 'Total',
						data: years.map((y) => y.total_balance),
						borderColor: '#1e40af',
						backgroundColor: 'rgba(30,64,175,0.1)',
						borderWidth: 2,
						fill: false,
					},
					{
						label: 'Pre-tax',
						data: years.map((y) => y.pretax_balance),
						borderColor: '#dc2626',
						borderWidth: 1.5,
						fill: false,
					},
					{
						label: 'Roth',
						data: years.map((y) => y.roth_balance),
						borderColor: '#16a34a',
						borderWidth: 1.5,
						fill: false,
					},
					{
						label: 'Brokerage',
						data: years.map((y) => y.brokerage_balance),
						borderColor: '#ca8a04',
						borderWidth: 1.5,
						fill: false,
					},
				],
			},
			options: {
				responsive: true,
				plugins: {
					tooltip: {
						callbacks: {
							label: (ctx) => `${ctx.dataset.label}: $${Math.round(ctx.parsed.y).toLocaleString()}`,
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
		if (canvas && years) buildChart();
	});
</script>

<div class="chart-container">
	<canvas bind:this={canvas}></canvas>
</div>

<style>
	.chart-container {
		position: relative;
		width: 100%;
		max-height: 400px;
	}
</style>
