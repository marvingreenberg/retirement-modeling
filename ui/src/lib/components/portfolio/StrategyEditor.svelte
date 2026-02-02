<script lang="ts">
	import type { SimulationConfig } from '$lib/types';

	let { config = $bindable() }: { config: SimulationConfig } = $props();
</script>

<div class="flex flex-col gap-3">
	<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
		Conversion Strategy
		<select class="select w-72" bind:value={config.strategy_target}>
			<option value="standard">Standard (no conversions)</option>
			<option value="irmaa_tier_1">IRMAA Tier 1 (cap at ~$206K)</option>
			<option value="22_percent_bracket">22% Bracket (fill to ~$201K)</option>
			<option value="24_percent_bracket">24% Bracket (fill to ~$383K)</option>
		</select>
	</label>
</div>
