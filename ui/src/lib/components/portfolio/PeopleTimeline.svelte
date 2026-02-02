<script lang="ts">
	import type { SimulationConfig } from '$lib/types';

	let { config = $bindable() }: { config: SimulationConfig } = $props();
</script>

<div class="fields">
	<div class="field-row">
		<label>
			Primary Age
			<input type="number" bind:value={config.current_age_primary} min="0" max="120" />
		</label>
		<label>
			Spouse Age
			<input type="number" bind:value={config.current_age_spouse} min="0" max="120" />
		</label>
	</div>
	<div class="field-row">
		<label>
			Simulation Years
			<input type="number" bind:value={config.simulation_years} min="1" max="100" />
		</label>
		<label>
			Start Year
			<input type="number" bind:value={config.start_year} min="2000" max="2100" />
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
		width: 120px;
	}
</style>
