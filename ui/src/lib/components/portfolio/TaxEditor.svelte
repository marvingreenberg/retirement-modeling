<script lang="ts">
	import type { SimulationConfig } from '$lib/types';

	let { config = $bindable() }: { config: SimulationConfig } = $props();
</script>

<div class="flex flex-col gap-3">
	<div class="flex gap-6">
		<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
			State Tax Rate
			<input type="number" class="input w-30" bind:value={config.tax_rate_state} min="0" max="0.2" step="0.0025" />
		</label>
		<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
			Capital Gains Rate
			<input type="number" class="input w-30" bind:value={config.tax_rate_capital_gains} min="0" max="0.3" step="0.005" />
		</label>
	</div>
	<div class="flex gap-6">
		<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
			RMD Start Age
			<input type="number" class="input w-30" bind:value={config.rmd_start_age} min="70" max="80" />
		</label>
		<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
			IRMAA Tier 1 Limit ($)
			<input type="number" class="input w-36" bind:value={config.irmaa_limit_tier_1} min="0" step="1000" />
		</label>
	</div>
</div>
