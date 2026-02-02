<script lang="ts">
	import type { SocialSecurityConfig } from '$lib/types';

	let { socialSecurity = $bindable() }: { socialSecurity: SocialSecurityConfig } = $props();
</script>

<div class="flex flex-col gap-3">
	<h4 class="text-sm text-surface-500 dark:text-surface-400 font-medium">Social Security</h4>
	<div class="flex gap-6">
		<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
			Primary Benefit ($/yr)
			<input type="number" class="input w-36" bind:value={socialSecurity.primary_benefit} min="0" step="1000" />
		</label>
		<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
			Primary Start Age
			<input type="number" class="input w-30" bind:value={socialSecurity.primary_start_age} min="62" max="70" />
		</label>
	</div>
	<div class="flex gap-6">
		<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
			Spouse Benefit ($/yr)
			<input type="number" class="input w-36" bind:value={socialSecurity.spouse_benefit} min="0" step="1000" />
		</label>
		<label class="flex flex-col gap-1 text-sm font-medium text-surface-600 dark:text-surface-400">
			Spouse Start Age
			<input type="number" class="input w-30" bind:value={socialSecurity.spouse_start_age} min="62" max="70" />
		</label>
	</div>
</div>
