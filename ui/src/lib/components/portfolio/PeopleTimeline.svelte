<script lang="ts">
	import type { SimulationConfig } from '$lib/types';

	let { config = $bindable() }: { config: SimulationConfig } = $props();
</script>

<div class="flex flex-col gap-3">
	<div class="flex gap-6">
		<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
			Primary Age
			<input type="number" class="input w-30" bind:value={config.current_age_primary} min="0" max="120" />
		</label>
		<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
			Spouse Age
			<input type="number" class="input w-30" bind:value={config.current_age_spouse} min="0" max="120" />
		</label>
	</div>
	<div class="flex gap-6">
		<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
			Simulation Years
			<input type="number" class="input w-30" bind:value={config.simulation_years} min="1" max="100" />
		</label>
		<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
			Start Year
			<input type="number" class="input w-30" bind:value={config.start_year} min="2000" max="2100" />
		</label>
	</div>
</div>
