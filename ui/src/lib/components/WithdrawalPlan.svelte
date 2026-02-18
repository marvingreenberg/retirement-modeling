<script lang="ts">
	import type { YearResult, AccountWithdrawal } from '$lib/types';
	import { currency } from '$lib/format';
	import { ClipboardList } from 'lucide-svelte';

	let { years }: { years: YearResult[] } = $props();

	let planYears = $derived(years.slice(0, 2));

	function byPurpose(details: AccountWithdrawal[] | undefined, purpose: string): AccountWithdrawal[] {
		return (details ?? []).filter((d) => d.purpose === purpose);
	}

	function totalForPurpose(details: AccountWithdrawal[] | undefined, purpose: string): number {
		return byPurpose(details, purpose).reduce((sum, d) => sum + d.amount, 0);
	}
</script>

<div class="card bg-surface-100 dark:bg-surface-800 p-4 mb-4">
	<h3
		class="text-base font-semibold text-surface-900 dark:text-surface-50 mb-3 flex items-center gap-2"
	>
		<ClipboardList size={18} class="text-primary-500" /> Withdrawal Plan
	</h3>
	<div class="grid gap-4 {planYears.length > 1 ? 'md:grid-cols-2' : ''}">
		{#each planYears as yr}
			<div class="rounded-lg bg-surface-50 dark:bg-surface-700 p-3 space-y-2">
				<div class="font-medium text-surface-900 dark:text-surface-100">
					{yr.year} &middot; Age {yr.age_primary}
				</div>

				<div class="text-sm space-y-1">
					<div class="flex justify-between">
						<span class="text-surface-600 dark:text-surface-300">Spending Target</span>
						<span class="font-medium">{currency(yr.spending_target)}</span>
					</div>

					{#if yr.surplus > 0}
						<div class="flex justify-between">
							<span class="text-surface-600 dark:text-surface-300">Income Surplus</span>
							<span class="text-success-600 dark:text-success-400">{currency(yr.surplus)}</span>
						</div>
					{/if}

					{#if byPurpose(yr.withdrawal_details, 'rmd').length > 0}
						<div class="pt-1 border-t border-surface-200 dark:border-surface-600">
							<div class="flex justify-between font-medium">
								<span>RMD</span>
								<span>{currency(yr.rmd)}</span>
							</div>
							{#each byPurpose(yr.withdrawal_details, 'rmd') as d}
								<div class="flex justify-between pl-3 text-surface-500 dark:text-surface-400">
									<span>{d.account_name}</span>
									<span>{currency(d.amount)}</span>
								</div>
							{/each}
						</div>
					{/if}

					{#if byPurpose(yr.withdrawal_details, 'spending').length > 0}
						<div class="pt-1 border-t border-surface-200 dark:border-surface-600">
							<div class="flex justify-between font-medium">
								<span>Withdrawals</span>
								<span>{currency(totalForPurpose(yr.withdrawal_details, 'spending'))}</span>
							</div>
							{#each byPurpose(yr.withdrawal_details, 'spending') as d}
								<div class="flex justify-between pl-3 text-surface-500 dark:text-surface-400">
									<span>{d.account_name}</span>
									<span>{currency(d.amount)}</span>
								</div>
							{/each}
						</div>
					{/if}

					{#if yr.roth_conversion > 0}
						<div class="pt-1 border-t border-surface-200 dark:border-surface-600">
							<div class="flex justify-between font-medium">
								<span>Roth Conversion</span>
								<span>{currency(yr.roth_conversion)}</span>
							</div>
							{#each byPurpose(yr.withdrawal_details, 'conversion') as d}
								<div class="flex justify-between pl-3 text-surface-500 dark:text-surface-400">
									<span>{d.account_name}</span>
									<span>{currency(d.amount)}</span>
								</div>
							{/each}
						</div>
					{/if}

					<div class="pt-1 border-t border-surface-200 dark:border-surface-600">
						<div class="flex justify-between font-medium">
							<span>Taxes</span>
							<span>{currency(yr.total_tax)}</span>
						</div>
						{#if yr.irmaa_cost > 0}
							<div class="flex justify-between pl-3 text-surface-500 dark:text-surface-400">
								<span>IRMAA Surcharge</span>
								<span>{currency(yr.irmaa_cost)}</span>
							</div>
						{/if}
						{#if yr.conversion_tax > 0}
							<div class="flex justify-between pl-3 text-surface-500 dark:text-surface-400">
								<span>Conversion Tax</span>
								<span>{currency(yr.conversion_tax)}</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
