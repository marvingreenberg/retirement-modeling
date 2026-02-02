<script lang="ts">
	import type { SimulationConfig } from '$lib/types';

	let { config = $bindable() }: { config: SimulationConfig } = $props();
</script>

<div class="fields">
	<div class="field-row">
		<label>
			State Tax Rate
			<input type="number" bind:value={config.tax_rate_state} min="0" max="0.2" step="0.0025" />
		</label>
		<label>
			Capital Gains Rate
			<input type="number" bind:value={config.tax_rate_capital_gains} min="0" max="0.3" step="0.005" />
		</label>
	</div>
	<div class="field-row">
		<label>
			RMD Start Age
			<input type="number" bind:value={config.rmd_start_age} min="70" max="80" />
		</label>
		<label>
			IRMAA Tier 1 Limit ($)
			<input type="number" bind:value={config.irmaa_limit_tier_1} min="0" step="1000" />
		</label>
	</div>
</div>

<style>
	.fields {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.field-row {
		display: flex;
		gap: 1.5rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.85rem;
		font-weight: 500;
		color: #475569;
	}
	input {
		padding: 0.4rem 0.5rem;
		border: 1px solid #cbd5e1;
		border-radius: 4px;
		font-size: 0.9rem;
		width: 140px;
	}
</style>
