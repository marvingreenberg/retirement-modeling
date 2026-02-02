<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import type { ComparisonResult } from '$lib/types';

	let { comparisons }: { comparisons: ComparisonResult[] } = $props();
	let canvas: HTMLCanvasElement;
	let chart: Chart | undefined;

	Chart.register(...registerables);

	function buildChart() {
		chart?.destroy();
		const labels = comparisons.map(
			(c) => `${c.conversion_strategy} / ${c.spending_strategy}`
		);
		chart = new Chart(canvas, {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						label: 'Final Balance',
						data: comparisons.map((c) => c.final_balance),
						backgroundColor: '#1e40af',
					},
					{
						label: 'Total Taxes',
						data: comparisons.map((c) => c.total_taxes_paid),
						backgroundColor: '#dc2626',
					},
					{
						label: 'Total IRMAA',
						data: comparisons.map((c) => c.total_irmaa_paid),
						backgroundColor: '#ca8a04',
					},
					{
						label: 'Roth Conversions',
						data: comparisons.map((c) => c.total_roth_conversions),
						backgroundColor: '#16a34a',
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
					x: {
						ticks: { maxRotation: 45 },
					},
				},
			},
		});
	}

	onMount(() => buildChart());

	$effect(() => {
		if (canvas && comparisons) buildChart();
	});
</script>

<div class="relative w-full max-h-[400px]">
	<canvas bind:this={canvas}></canvas>
</div>
