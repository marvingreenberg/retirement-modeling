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
	let simEndAge = $derived(config.current_age_primary + config.simulation_years);

	function ageToYear(age: number, ownerAge: number): number {
		return config.start_year + (age - ownerAge);
	}

	function yearToAge(year: number, ownerAge: number): number {
		return ownerAge + (year - config.start_year);
	}

	function ownerAge(owner: string): number {
		return owner === 'spouse' ? config.current_age_spouse : config.current_age_primary;
	}

	function ageHint(age: number | null): string {
		return age != null ? `age ${age}` : '';
	}

	function streamWarning(stream: IncomeStream): string {
		const oa = ownerAge(stream.owner);
		if (stream.start_age > simEndAge) return 'past sim end';
		if (stream.end_age != null && stream.end_age < stream.start_age) return 'end < start';
		return '';
	}

	function toPct(v: number | null): string {
		return v != null ? String(Math.round(v * 10000) / 100) : '';
	}
	function pctToDecimal(s: string): number | null {
		if (!s) return null;
		return +s / 100;
	}

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
			owner: 'primary' as const,
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
					Primary Start Year
					<div class="flex items-center gap-2">
						<input type="number" class="input w-24"
							value={ageToYear(config.ss_auto.primary_start_age, config.current_age_primary)}
							onfocus={(e) => e.currentTarget.select()}
							onchange={(e) => { config.ss_auto!.primary_start_age = yearToAge(Number(e.currentTarget.value), config.current_age_primary); }}
							min={ageToYear(62, config.current_age_primary)} max={ageToYear(70, config.current_age_primary)} />
						<span class="text-xs text-surface-400">({ageHint(config.ss_auto.primary_start_age)})</span>
					</div>
				</label>
			</div>
			{#if hasSpouse}
				<div class="flex gap-4 flex-wrap mt-2">
					<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
						Spouse FRA Benefit ($/yr)
						<input type="number" class="input w-36" bind:value={config.ss_auto.spouse_fra_amount} onfocus={(e) => e.currentTarget.select()} min="0" step="1000" />
					</label>
					<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
						Spouse Start Year
						<div class="flex items-center gap-2">
							<input type="number" class="input w-24"
								value={ageToYear(config.ss_auto.spouse_start_age ?? 67, config.current_age_spouse)}
								onfocus={(e) => e.currentTarget.select()}
								onchange={(e) => { config.ss_auto!.spouse_start_age = yearToAge(Number(e.currentTarget.value), config.current_age_spouse); }}
								min={ageToYear(62, config.current_age_spouse)} max={ageToYear(70, config.current_age_spouse)} />
							<span class="text-xs text-surface-400">({ageHint(config.ss_auto.spouse_start_age)})</span>
						</div>
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
				<span class="w-28">Start Year</span>
				<span class="w-28">End Year</span>
				<span class="w-20">COLA %</span>
				<span class="w-20">Taxable %</span>
				{#if hasSpouse}<span class="w-24">Owner</span>{/if}
			</div>
		{/if}
		{#each incomeStreams as stream, idx}
			{@const oa = ownerAge(stream.owner)}
			{@const warning = streamWarning(stream)}
			<div class="flex gap-3 items-center p-3 bg-surface-100 dark:bg-surface-800 rounded flex-wrap mb-2">
				<input type="text" class="input w-32 text-sm" bind:value={stream.name} onfocus={(e) => e.currentTarget.select()} placeholder="e.g. Pension" aria-label="Name" />
				<input type="number" class="input w-28 text-sm" bind:value={stream.amount} onfocus={(e) => e.currentTarget.select()} min="0" step="1000" aria-label="Amount" />
				<div class="w-28">
					<input type="number" class="input w-full text-sm"
						value={ageToYear(stream.start_age, oa)}
						onfocus={(e) => e.currentTarget.select()}
						onchange={(e) => { stream.start_age = yearToAge(Number(e.currentTarget.value), oa); }}
						aria-label="Start Year" />
					<span class="text-xs text-surface-400">({ageHint(stream.start_age)})</span>
				</div>
				<div class="w-28">
					{#if stream.end_age != null}
						<input type="number" class="input w-full text-sm"
							value={ageToYear(stream.end_age, oa)}
							onfocus={(e) => e.currentTarget.select()}
							onchange={(e) => { stream.end_age = yearToAge(Number(e.currentTarget.value), oa); }}
							aria-label="End Year" />
						<span class="text-xs text-surface-400">({ageHint(stream.end_age)})</span>
					{:else}
						<input type="number" class="input w-full text-sm"
							value=""
							onfocus={(e) => e.currentTarget.select()}
							onchange={(e) => {
								const v = e.currentTarget.value;
								stream.end_age = v ? yearToAge(Number(v), oa) : null;
							}}
							placeholder="∞"
							aria-label="End Year" />
						<span class="text-xs text-surface-400">lifetime</span>
					{/if}
				</div>
				<input type="number" class="input w-20 text-sm"
				value={toPct(stream.cola_rate)}
				onfocus={(e) => e.currentTarget.select()}
				onchange={(e) => { stream.cola_rate = pctToDecimal(e.currentTarget.value); }}
				min="0" max="20" step="0.5" placeholder="0" aria-label="COLA %" />
				<input type="number" class="input w-20 text-sm"
				value={toPct(stream.taxable_pct)}
				onfocus={(e) => e.currentTarget.select()}
				onchange={(e) => { stream.taxable_pct = +(e.currentTarget.value) / 100; }}
				min="0" max="100" step="5" aria-label="Taxable %" />
				{#if hasSpouse}
					<select class="select w-24 text-sm" bind:value={stream.owner} aria-label="Owner">
						<option value="primary">Primary</option>
						<option value="spouse">Spouse</option>
					</select>
				{/if}
				<button class="btn btn-sm preset-tonal p-1" onclick={() => removeStream(idx)} aria-label="Remove income stream">
					<Trash2 size={14} />
				</button>
				{#if warning}
					<span class="text-xs text-warning-500 w-full">{warning}</span>
				{/if}
			</div>
		{/each}
		<button class="btn btn-sm preset-tonal mt-1" onclick={addStream}>Add Income</button>
	</div>
</div>
