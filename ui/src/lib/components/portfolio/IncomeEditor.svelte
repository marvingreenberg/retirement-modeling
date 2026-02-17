<script lang="ts">
	import type { SimulationConfig, IncomeStream } from '$lib/types';
	import { Trash2 } from 'lucide-svelte';

	let {
		config = $bindable(),
		incomeStreams = $bindable(),
	}: {
		config: SimulationConfig;
		incomeStreams: IncomeStream[];
	} = $props();

	let hasSpouse = $derived(config.current_age_spouse > 0);

	function ensureSSAuto() {
		if (!config.ss_auto) {
			config.ss_auto = {
				primary_fra_amount: 0,
				primary_start_age: 67,
				spouse_fra_amount: null,
				spouse_start_age: null,
				fra_age: 67,
			};
		}
	}

	function addStream() {
		incomeStreams = [...incomeStreams, {
			name: '',
			amount: 0,
			start_age: 65,
			end_age: null,
			taxable_pct: 1.0,
			cola_rate: null,
		}];
	}

	function removeStream(idx: number) {
		incomeStreams = incomeStreams.filter((_, i) => i !== idx);
	}

	$effect(() => {
		if (config.ss_auto) {
			config.social_security.primary_benefit = config.ss_auto.primary_fra_amount;
			config.social_security.primary_start_age = config.ss_auto.primary_start_age;
			config.social_security.spouse_benefit = config.ss_auto.spouse_fra_amount ?? 0;
			config.social_security.spouse_start_age = config.ss_auto.spouse_start_age ?? 67;
		}
	});

	ensureSSAuto();
</script>

<div class="flex flex-col gap-4">
	<div class="p-3 bg-surface-100 dark:bg-surface-800 rounded">
		<h4 class="text-sm text-surface-500 dark:text-surface-400 font-medium mb-2">Social Security</h4>
		{#if config.ss_auto}
			<div class="flex gap-4 flex-wrap">
				<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
					Primary FRA Benefit ($/yr)
					<input type="number" class="input w-36" bind:value={config.ss_auto.primary_fra_amount} onfocus={(e) => e.currentTarget.select()} min="0" step="1000" />
				</label>
				<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
					Primary Start Age
					<input type="number" class="input w-24" bind:value={config.ss_auto.primary_start_age} onfocus={(e) => e.currentTarget.select()} min="62" max="70" />
				</label>
			</div>
			{#if hasSpouse}
				<div class="flex gap-4 flex-wrap mt-2">
					<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
						Spouse FRA Benefit ($/yr)
						<input type="number" class="input w-36" bind:value={config.ss_auto.spouse_fra_amount} onfocus={(e) => e.currentTarget.select()} min="0" step="1000" />
					</label>
					<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
						Spouse Start Age
						<input type="number" class="input w-24" bind:value={config.ss_auto.spouse_start_age} onfocus={(e) => e.currentTarget.select()} min="62" max="70" />
					</label>
				</div>
			{/if}
		{/if}
	</div>

	<div>
		<h4 class="text-sm text-surface-500 dark:text-surface-400 font-medium mb-2">Other Income</h4>
		{#if incomeStreams.length > 0}
			<div class="flex gap-3 items-end px-3 mb-1 text-xs font-medium text-surface-500 dark:text-surface-400">
				<span class="w-32">Name</span>
				<span class="w-28">Amount ($/yr)</span>
				<span class="w-20">Start Age</span>
				<span class="w-20">End Age</span>
				<span class="w-20">COLA %</span>
				<span class="w-20">Taxable</span>
			</div>
		{/if}
		{#each incomeStreams as stream, idx}
			<div class="flex gap-3 items-center p-3 bg-surface-100 dark:bg-surface-800 rounded flex-wrap mb-2">
				<input type="text" class="input w-32 text-sm" bind:value={stream.name} onfocus={(e) => e.currentTarget.select()} placeholder="e.g. Pension" aria-label="Name" />
				<input type="number" class="input w-28 text-sm" bind:value={stream.amount} onfocus={(e) => e.currentTarget.select()} min="0" step="1000" aria-label="Amount" />
				<input type="number" class="input w-20 text-sm" bind:value={stream.start_age} onfocus={(e) => e.currentTarget.select()} min="0" aria-label="Start Age" />
				<input type="number" class="input w-20 text-sm" bind:value={stream.end_age} onfocus={(e) => e.currentTarget.select()} min="0" aria-label="End Age" />
				<input type="number" class="input w-20 text-sm" bind:value={stream.cola_rate} onfocus={(e) => e.currentTarget.select()} min="0" max="0.2" step="0.005" aria-label="COLA %" />
				<input type="number" class="input w-20 text-sm" bind:value={stream.taxable_pct} onfocus={(e) => e.currentTarget.select()} min="0" max="1" step="0.05" aria-label="Taxable" />
				<button class="btn btn-sm preset-tonal p-1" onclick={() => removeStream(idx)} aria-label="Remove income stream">
					<Trash2 size={14} />
				</button>
			</div>
		{/each}
		<button class="btn btn-sm preset-tonal mt-1" onclick={addStream}>Add Income</button>
	</div>
</div>
