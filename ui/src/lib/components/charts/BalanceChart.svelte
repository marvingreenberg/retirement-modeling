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
						label: 'Pre-tax',
						data: years.map((y) => y.pretax_balance),
						borderColor: '#dc2626',
						backgroundColor: 'rgba(220,38,38,0.3)',
						borderWidth: 1.5,
						pointRadius: 0,
						fill: true,
					},
					{
						label: 'Roth',
						data: years.map((y) => y.roth_balance),
						borderColor: '#16a34a',
						backgroundColor: 'rgba(22,163,74,0.3)',
						borderWidth: 1.5,
						pointRadius: 0,
						fill: true,
					},
					{
						label: 'Brokerage',
						data: years.map((y) => y.brokerage_balance),
						borderColor: '#ca8a04',
						backgroundColor: 'rgba(202,138,4,0.3)',
						borderWidth: 1.5,
						pointRadius: 0,
						fill: true,
					},
				],
			},
			options: {
				responsive: true,
				interaction: { mode: 'index', intersect: false },
				plugins: {
					tooltip: {
						callbacks: {
							label: (ctx) => `${ctx.dataset.label}: $${Math.round(ctx.parsed.y ?? 0).toLocaleString()}`,
							footer: (items) => {
								const total = items.reduce((sum, item) => sum + (item.parsed.y ?? 0), 0);
								return `Total: $${Math.round(total).toLocaleString()}`;
							},
						},
					},
				},
				scales: {
					x: { stacked: true },
					y: {
						stacked: true,
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

<div class="relative w-full max-h-[400px]">
	<canvas bind:this={canvas}></canvas>
</div>
