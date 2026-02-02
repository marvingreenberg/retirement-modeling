<script lang="ts">
	import type { SocialSecurityConfig } from '$lib/types';

	let { socialSecurity = $bindable() }: { socialSecurity: SocialSecurityConfig } = $props();
</script>

<div class="fields">
	<h4>Social Security</h4>
	<div class="field-row">
		<label>
			Primary Benefit ($/yr)
			<input type="number" bind:value={socialSecurity.primary_benefit} min="0" step="1000" />
		</label>
		<label>
			Primary Start Age
			<input type="number" bind:value={socialSecurity.primary_start_age} min="62" max="70" />
		</label>
	</div>
	<div class="field-row">
		<label>
			Spouse Benefit ($/yr)
			<input type="number" bind:value={socialSecurity.spouse_benefit} min="0" step="1000" />
		</label>
		<label>
			Spouse Start Age
			<input type="number" bind:value={socialSecurity.spouse_start_age} min="62" max="70" />
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
	h4 {
		margin: 0;
		font-size: 0.9rem;
		color: #64748b;
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
