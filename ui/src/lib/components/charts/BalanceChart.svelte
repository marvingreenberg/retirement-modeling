<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import type { YearResult } from '$lib/types';

	let { years }: { years: YearResult[] } = $props();
	let canvas: HTMLCanvasElement;
	let chart: Chart | undefined;

	Chart.register(...registerables);

	function hasNonZero(data: number[]): boolean {
		return data.some((v) => v > 0);
	}

	function buildChart() {
		chart?.destroy();
		const labels = years.map((y) => `Age ${y.age_primary}`);

		const balanceDatasets = [
			{
				label: 'Pre-tax',
				data: years.map((y) => y.pretax_balance),
				borderColor: '#dc2626',
				backgroundColor: 'rgba(220,38,38,0.55)',
				borderWidth: 1.5,
				pointRadius: 0,
				pointStyle: 'rectRounded' as const,
				fill: true,
				yAxisID: 'y',
			},
			{
				label: 'Roth Conversions',
				data: years.map((y) => y.roth_conversion_balance ?? 0),
				borderColor: '#7c3aed',
				backgroundColor: 'rgba(124,58,237,0.3)',
				borderWidth: 1.5,
				pointRadius: 0,
				pointStyle: 'rectRounded' as const,
				fill: true,
				yAxisID: 'y',
			},
			{
				label: 'Roth',
				data: years.map((y) => y.roth_balance),
				borderColor: '#16a34a',
				backgroundColor: 'rgba(22,163,74,0.3)',
				borderWidth: 1.5,
				pointRadius: 0,
				pointStyle: 'rectRounded' as const,
				fill: true,
				yAxisID: 'y',
			},
			{
				label: 'Brokerage',
				data: years.map((y) => y.brokerage_balance),
				borderColor: '#ca8a04',
				backgroundColor: 'rgba(202,138,4,0.3)',
				borderWidth: 1.5,
				pointRadius: 0,
				pointStyle: 'rectRounded' as const,
				fill: true,
				yAxisID: 'y',
			},
		];

		const lineStyle = { borderWidth: 2, pointRadius: 0, pointStyle: 'line' as const, fill: false, yAxisID: 'y2' };
		const cashFlowDatasets = [
			{
				label: 'Available to Spend',
				data: years.map((y) => {
					const gross = y.total_income + y.rmd + y.pretax_withdrawal + y.roth_withdrawal
						+ y.brokerage_withdrawal - (y.conversion_tax_from_brokerage ?? 0);
					const spendingTax = y.total_tax - y.conversion_tax;
					return gross - Math.max(0, spendingTax);
				}),
				borderColor: '#0891b2',
				borderDash: [] as number[],
				...lineStyle,
			},
			{
				label: 'Planned Budget',
				data: years.map((y) => y.spending_target),
				borderColor: '#6366f1',
				borderDash: [6, 3],
				...lineStyle,
			},
			{
				label: 'Est. Taxes (excl. conversions)',
				data: years.map((y) => Math.max(0, y.total_tax - y.conversion_tax)),
				borderColor: '#eab308',
				borderDash: [4, 4],
				...lineStyle,
			},
		];

		const datasets = [
			...balanceDatasets.filter((ds) => hasNonZero(ds.data)),
			...cashFlowDatasets.filter((ds) => hasNonZero(ds.data)),
		];

		chart = new Chart(canvas, {
			type: 'line',
			data: { labels, datasets },
			options: {
				responsive: true,
				interaction: { mode: 'index', intersect: false },
				plugins: {
					tooltip: {
						callbacks: {
							label: (ctx) => `${ctx.dataset.label}: $${Math.round(ctx.parsed.y ?? 0).toLocaleString()}`,
							footer: (items) => {
								const balanceItems = items.filter((i) => (i.dataset as any).yAxisID === 'y');
								if (balanceItems.length === 0) return '';
								const total = balanceItems.reduce((sum, item) => sum + (item.parsed.y ?? 0), 0);
								return `Total Balance: $${Math.round(total).toLocaleString()}`;
							},
						},
					},
					legend: {
						labels: {
							usePointStyle: true,
						},
					},
				},
				scales: {
					x: { stacked: true },
					y: {
						stacked: true,
						position: 'left',
						ticks: {
							callback: (v) => `$${(Number(v) / 1000).toFixed(0)}K`,
						},
					},
					y2: {
						position: 'right',
						title: { display: true, text: 'Spending & Budget' },
						grid: { drawOnChartArea: false },
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
