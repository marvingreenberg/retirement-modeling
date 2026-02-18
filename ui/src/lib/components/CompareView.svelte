<script lang="ts">
	import { comparisonSnapshots } from '$lib/stores';
	import { currency, pct } from '$lib/format';
	import type { ComparisonSnapshot } from '$lib/types';

	let snapshots = $derived($comparisonSnapshots);

	let bestBalance = $derived(
		snapshots.length > 0 ? Math.max(...snapshots.map((s) => s.finalBalance)) : 0
	);
	let bestTax = $derived(
		snapshots.length > 0 ? Math.min(...snapshots.filter((s) => s.totalTaxes > 0).map((s) => s.totalTaxes)) : 0
	);
	let bestIrmaa = $derived(
		snapshots.length > 0 ? Math.min(...snapshots.filter((s) => s.totalIrmaa >= 0).map((s) => s.totalIrmaa)) : 0
	);
	let bestSuccess = $derived(
		snapshots.length > 0 ? Math.max(...snapshots.filter((s) => s.successRate != null).map((s) => s.successRate!)) : 0
	);

	function removeSnapshot(id: string) {
		comparisonSnapshots.update((snaps) => snaps.filter((s) => s.id !== id));
	}
</script>

<div class="space-y-4">
	{#if snapshots.length === 0}
		<div class="text-center py-12 text-surface-500">
			<p class="text-lg font-medium mb-2">No comparisons yet</p>
			<p class="text-sm">Run a simulation from Overview — each run is automatically added here.</p>
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="table table-sm">
				<thead>
					<tr>
						<th>Type</th>
						<th>Inflation</th>
						<th>Growth</th>
						<th class="text-left">Withdrawal</th>
						<th class="text-left">Conversion</th>
						<th>Final Balance</th>
						<th>Total Taxes</th>
						<th>Total IRMAA</th>
						<th>Success Rate</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each snapshots as snap}
						<tr>
							<td class="text-xs">
								{#if snap.runType === 'monte_carlo'}
									MC ({snap.numSimulations})
								{:else}
									Single
								{/if}
							</td>
							<td>{pct(snap.inflationRate)}</td>
							<td>{pct(snap.growthRate)}</td>
							<td class="text-left">{snap.spendingStrategy}</td>
							<td class="text-left">{snap.conversionStrategy}</td>
							<td
								class:font-bold={snap.finalBalance === bestBalance}
								class:text-success-600={snap.finalBalance === bestBalance}
							>{currency(snap.finalBalance)}</td>
							<td
								class:font-bold={snap.totalTaxes > 0 && snap.totalTaxes === bestTax}
								class:text-success-600={snap.totalTaxes > 0 && snap.totalTaxes === bestTax}
							>{snap.totalTaxes > 0 ? currency(snap.totalTaxes) : '—'}</td>
							<td
								class:font-bold={snap.totalIrmaa === bestIrmaa}
								class:text-success-600={snap.totalIrmaa === bestIrmaa}
							>{snap.totalIrmaa >= 0 ? currency(snap.totalIrmaa) : '—'}</td>
							<td
								class:font-bold={snap.successRate != null && snap.successRate === bestSuccess}
								class:text-success-600={snap.successRate != null && snap.successRate === bestSuccess}
							>{snap.successRate != null ? pct(snap.successRate) : '—'}</td>
							<td>
								<button class="btn preset-outlined btn-sm" onclick={() => removeSnapshot(snap.id)}>✕</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
