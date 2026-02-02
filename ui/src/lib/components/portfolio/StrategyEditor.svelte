<script lang="ts">
	import type { SimulationConfig } from '$lib/types';

	let { config = $bindable() }: { config: SimulationConfig } = $props();
</script>

<div class="fields">
	<label>
		Conversion Strategy
		<select bind:value={config.strategy_target}>
			<option value="standard">Standard (no conversions)</option>
			<option value="irmaa_tier_1">IRMAA Tier 1 (cap at ~$206K)</option>
			<option value="22_percent_bracket">22% Bracket (fill to ~$201K)</option>
			<option value="24_percent_bracket">24% Bracket (fill to ~$383K)</option>
		</select>
	</label>
</div>

<style>
	.fields {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.85rem;
		font-weight: 500;
		color: #475569;
	}
	select {
		padding: 0.4rem 0.5rem;
		border: 1px solid #cbd5e1;
		border-radius: 4px;
		font-size: 0.9rem;
		width: 280px;
	}
</style>
