<script lang="ts">
	import { portfolio, samplePortfolio, profile, sampleProfile } from '$lib/stores';
	import { TreePine } from 'lucide-svelte';

	let primaryName = $state('');
	let primaryAge = $state(0);
	let hasSpouse = $state(false);
	let spouseName = $state('');
	let spouseAge = $state(0);
	let error = $state('');

	function handleStart() {
		if (!primaryName.trim()) {
			error = 'Please enter your name.';
			return;
		}
		if (primaryAge < 20 || primaryAge > 120) {
			error = 'Please enter a valid age between 20 and 120.';
			return;
		}
		if (hasSpouse && (spouseAge < 20 || spouseAge > 120)) {
			error = 'Please enter a valid spouse age between 20 and 120.';
			return;
		}
		error = '';
		profile.set({ primaryName: primaryName.trim(), spouseName: hasSpouse ? spouseName.trim() : '' });
		const simYears = Math.max(1, 95 - primaryAge);
		portfolio.update((p) => ({
			...p,
			config: {
				...p.config,
				current_age_primary: primaryAge,
				current_age_spouse: hasSpouse ? spouseAge : 0,
				simulation_years: simYears,
			},
			accounts: [{
				id: 'account_1',
				name: 'Brokerage',
				balance: 0,
				type: 'brokerage' as const,
				owner: 'primary' as const,
				cost_basis_ratio: 1.0,
				available_at_age: 0,
			}],
		}));
	}

	function loadSample() {
		profile.set(structuredClone(sampleProfile));
		portfolio.set(structuredClone(samplePortfolio));
	}
</script>

<div class="flex items-center justify-center min-h-[60vh]">
	<div class="bg-surface-100 dark:bg-surface-800 rounded-lg p-8 max-w-md w-full space-y-6">
		<div class="text-center space-y-2">
			<div class="text-primary-500"><TreePine size={48} strokeWidth={1.5} class="mx-auto" /></div>
			<h1 class="text-2xl font-bold text-surface-900 dark:text-surface-50">Retirement Simulator</h1>
			<p class="text-sm text-surface-500">Enter your basic info to get started, or load sample data to explore.</p>
		</div>

		<div class="space-y-4">
			<label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
				Your Name
				<input type="text" class="input text-sm" bind:value={primaryName} placeholder="e.g. Mike" />
			</label>

			<label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
				Your Age
				<input type="number" class="input text-sm" bind:value={primaryAge} min="20" max="120" placeholder="e.g. 55" />
			</label>

			<label class="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300 cursor-pointer">
				<input type="checkbox" class="checkbox" bind:checked={hasSpouse} />
				I have a spouse/partner
			</label>

			{#if hasSpouse}
				<label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
					Spouse Name
					<input type="text" class="input text-sm" bind:value={spouseName} placeholder="e.g. Karen" />
				</label>

				<label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
					Spouse Age
					<input type="number" class="input text-sm" bind:value={spouseAge} min="20" max="120" placeholder="e.g. 52" />
				</label>
			{/if}

			{#if error}
				<p class="text-sm text-error-500">{error}</p>
			{/if}

			<div class="flex gap-3 pt-2">
				<button class="btn preset-filled flex-1" onclick={handleStart}>Get Started</button>
				<button class="btn preset-tonal flex-1" onclick={loadSample}>Load Sample Data</button>
			</div>
		</div>
	</div>
</div>
