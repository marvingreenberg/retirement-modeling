<script lang="ts">
	import type { SimulationConfig, IncomeStream } from '$lib/types';
	import { Trash2 } from 'lucide-svelte';

	let { config = $bindable() }: { config: SimulationConfig } = $props();

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
		config.income_streams = [...config.income_streams, {
			name: '',
			amount: 0,
			start_age: 65,
			end_age: null,
			taxable_pct: 1.0,
			cola_rate: null,
		}];
	}

	function removeStream(idx: number) {
		config.income_streams = config.income_streams.filter((_, i) => i !== idx);
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
	<div>
		<h4 class="text-sm text-surface-500 dark:text-surface-400 font-medium mb-2">Social Security</h4>
		{#if config.ss_auto}
			<div class="flex gap-4 flex-wrap">
				<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
					Primary FRA Benefit ($/yr)
					<input type="number" class="input w-36" bind:value={config.ss_auto.primary_fra_amount} min="0" step="1000" />
				</label>
				<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
					Primary Start Age
					<input type="number" class="input w-24" bind:value={config.ss_auto.primary_start_age} min="62" max="70" />
				</label>
			</div>
			{#if hasSpouse}
				<div class="flex gap-4 flex-wrap mt-2">
					<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
						Spouse FRA Benefit ($/yr)
						<input type="number" class="input w-36" bind:value={config.ss_auto.spouse_fra_amount} min="0" step="1000" />
					</label>
					<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
						Spouse Start Age
						<input type="number" class="input w-24" bind:value={config.ss_auto.spouse_start_age} min="62" max="70" />
					</label>
				</div>
			{/if}
		{/if}
	</div>

	<div>
		<h4 class="text-sm text-surface-500 dark:text-surface-400 font-medium mb-2">Other Income</h4>
		{#each config.income_streams as stream, idx}
			<div class="flex gap-2 items-end flex-wrap mb-2">
				<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
					Name
					<input type="text" class="input w-32 text-sm" bind:value={stream.name} placeholder="e.g. Pension" />
				</label>
				<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
					Amount ($/yr)
					<input type="number" class="input w-28 text-sm" bind:value={stream.amount} min="0" step="1000" />
				</label>
				<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
					Start Age
					<input type="number" class="input w-20 text-sm" bind:value={stream.start_age} min="0" />
				</label>
				<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
					End Age
					<input type="number" class="input w-20 text-sm" bind:value={stream.end_age} min="0" />
				</label>
				<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
					COLA %
					<input type="number" class="input w-20 text-sm" bind:value={stream.cola_rate} min="0" max="0.2" step="0.005" />
				</label>
				<label class="flex flex-col gap-0.5 text-xs font-medium text-surface-600 dark:text-surface-400">
					Taxable
					<input type="number" class="input w-20 text-sm" bind:value={stream.taxable_pct} min="0" max="1" step="0.05" />
				</label>
				<button class="btn btn-sm preset-tonal p-1" onclick={() => removeStream(idx)} aria-label="Remove income stream">
					<Trash2 size={14} />
				</button>
			</div>
		{/each}
		<button class="btn btn-sm preset-tonal mt-1" onclick={addStream}>Add Income</button>
	</div>
</div>
