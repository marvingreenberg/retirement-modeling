<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { portfolio, profile, numSimulations, samplePortfolio, sampleProfile, markFormTouched, randomizeForDemo } from '$lib/stores';
	import { saveFileSchema } from '$lib/schema';
	import type { Portfolio } from '$lib/types';
	import { initDarkMode } from '$lib/darkMode.svelte';
	import { isAutoSave, initAutoSave } from '$lib/autoSave.svelte';
	import { avatarSrc, fetchAvatarSvg } from '$lib/avatar.svelte';
	import { saveJsonFile, loadJsonFile, generateFilename } from '$lib/fileIO';
	import InfoPopover from '$lib/components/InfoPopover.svelte';
	import { User, FolderOpen, Sliders, Shuffle } from 'lucide-svelte';
	import { onMount } from 'svelte';

	type Section = 'basic' | 'loadsave' | 'advanced';
	const validSections: Section[] = ['basic', 'loadsave', 'advanced'];

	function sectionFromUrl(): Section {
		const s = page.url.searchParams.get('section');
		return validSections.includes(s as Section) ? (s as Section) : 'basic';
	}

	let activeSection = $state<Section>(sectionFromUrl());
	let showRandomizeConfirm = $state(false);

	// Re-read query param when URL changes (e.g. navigating from dropdown)
	$effect(() => {
		activeSection = sectionFromUrl();
	});

	// Track initial setup state at mount time, not reactively (so button doesn't vanish as user types age)
	let initialNeedsSetup = $state(false);
	let needsSetup = $derived($portfolio.config.current_age_primary === 0);
	onMount(() => {
		initialNeedsSetup = $portfolio.config.current_age_primary === 0;
		initDarkMode();
		initAutoSave();
	});

	let src = $derived(avatarSrc($profile.primaryName || 'user', $profile.avatarSvg));
	let avatarError = $state(false);
	$effect(() => { src; avatarError = false; });

	// Cache avatar SVG when name changes (debounced)
	$effect(() => {
		const name = $profile.primaryName;
		fetchAvatarSvg(name, (dataUri) => {
			profile.update((p) => ({ ...p, avatarSvg: dataUri }));
		});
	});

	let displayName = $derived.by(() => {
		const p = $profile;
		if (!p.primaryName) return 'Settings';
		if (p.spouseName) return `${p.primaryName} & ${p.spouseName}`;
		return p.primaryName;
	});

	// Basic Info
	let hasSpouse = $derived($portfolio.config.current_age_spouse > 0);
	function addSpouse() {
		$portfolio.config.current_age_spouse = 62;
		$profile.spouseName = '';
	}
	function removeSpouse() {
		$portfolio.config.current_age_spouse = 0;
		$profile.spouseName = '';
		$portfolio.config.social_security.spouse_benefit = 0;
		$portfolio.config.social_security.spouse_start_age = 67;
		if ($portfolio.config.ss_auto) {
			$portfolio.config.ss_auto.spouse_fra_amount = null;
			$portfolio.config.ss_auto.spouse_start_age = null;
		}
	}

	let setupError = $state('');
	function handleGetStarted() {
		if (!$profile.primaryName.trim()) {
			setupError = 'Please enter your name.';
			return;
		}
		if ($portfolio.config.current_age_primary < 20 || $portfolio.config.current_age_primary > 120) {
			setupError = 'Please enter a valid age between 20 and 120.';
			return;
		}
		setupError = '';
		const simYears = Math.max(1, 95 - $portfolio.config.current_age_primary);
		$portfolio.config.simulation_years = simYears;
		goto('/');
	}

	function loadSample() {
		profile.set(structuredClone(sampleProfile));
		portfolio.set(structuredClone(samplePortfolio));
		goto('/');
	}

	// Load/Save
	let fileInput = $state<HTMLInputElement>(undefined!);
	let loadError = $state('');

	async function loadFile() {
		const text = await loadJsonFile();
		if (text !== null) {
			parseAndLoad(text);
		} else {
			fileInput.click();
		}
	}
	function handleFile(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e) => parseAndLoad(e.target?.result as string);
		reader.readAsText(file);
		input.value = '';
	}
	function parseAndLoad(text: string) {
		loadError = '';
		try {
			const json = JSON.parse(text);
			const result = saveFileSchema.safeParse(json);
			if (!result.success) {
				loadError = 'Invalid portfolio file — may be pre-version 0.10.0 data.';
				return;
			}
			const { profile: loadedProfile, ...portfolioData } = result.data;
			portfolio.set(portfolioData as Portfolio);
			if (loadedProfile) profile.set(loadedProfile);
		} catch {
			loadError = 'Invalid JSON file';
		}
	}

	async function saveFile() {
		const p = structuredClone($portfolio);
		const profileData = structuredClone($profile);
		const saveData = { ...p, profile: profileData };
		const filename = generateFilename($profile.primaryName, $profile.spouseName);
		await saveJsonFile(saveData, filename);
	}

	// Auto-save effect — uses shared module state
	$effect(() => {
		if (isAutoSave()) {
			const data = { portfolio: $portfolio, profile: $profile, numSimulations: $numSimulations };
			localStorage.setItem('retirement-sim-state', JSON.stringify(data));
		}
	});

	// Advanced
	function toPct(v: number): number { return Math.round(v * 10000) / 100; }
	function setPct(e: Event, setter: (v: number) => void) {
		setter(+(e.target as HTMLInputElement).value / 100);
	}

	// Enter key handler
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			markFormTouched();
			portfolio.update((p) => ({ ...p }));
		}
	}

	function handleDone() {
		goto('/');
	}

	const sections: { id: Section; label: string; icon: typeof User }[] = [
		{ id: 'basic', label: 'Basic Info', icon: User },
		{ id: 'loadsave', label: 'Load / Save', icon: FolderOpen },
		{ id: 'advanced', label: 'Advanced Settings', icon: Sliders },
	];
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="flex min-h-[calc(100vh-6rem)]" onkeydown={handleKeydown} role="main">
	<!-- Left Nav -->
	<nav class="w-64 bg-surface-100 dark:bg-surface-800 flex flex-col border-r border-surface-300 dark:border-surface-700">
		<!-- Header: Avatar + Name -->
		<div class="p-5 text-center border-b border-surface-300 dark:border-surface-700">
			{#if !avatarError && $profile.primaryName}
				<img
					src={src}
					alt="Avatar"
					class="w-16 h-16 rounded-full mx-auto mb-2 bg-surface-200 dark:bg-surface-700"
					onerror={() => avatarError = true}
				/>
			{:else}
				<div class="w-16 h-16 rounded-full mx-auto mb-2 bg-surface-200 dark:bg-surface-700 flex items-center justify-center">
					<User size={28} class="text-surface-500" />
				</div>
			{/if}
			<p class="text-sm font-semibold text-surface-900 dark:text-surface-50 truncate">{displayName}</p>
		</div>

		<!-- Section Links -->
		<div class="flex-1 py-3">
			{#each sections as { id, label, icon: Icon }}
				<button
					class="w-full text-left px-5 py-2.5 flex items-center gap-3 text-sm transition-colors
						{activeSection === id
							? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold border-r-2 border-primary-500'
							: 'text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'}"
					onclick={() => activeSection = id}
				>
					<Icon size={18} />
					{label}
				</button>
			{/each}
		</div>

		<!-- Footer: Done -->
		<div class="p-4 border-t border-surface-300 dark:border-surface-700">
			<button class="btn preset-filled w-full" onclick={handleDone}>Done</button>
		</div>
	</nav>

	<!-- Content Panel -->
	<div class="flex-1 p-8 overflow-y-auto">
		{#if activeSection === 'basic'}
			<h2 class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-6">Basic Info</h2>

			{#if initialNeedsSetup}
				<div class="bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800 rounded p-4 mb-6">
					<p class="text-sm text-primary-700 dark:text-primary-300">Enter your info to get started, or use Load/Save to load saved data.</p>
				</div>
			{/if}

			<div class="space-y-4 max-w-md">
				<label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
					Your Name
					<input type="text" class="input text-sm" bind:value={$profile.primaryName} placeholder="e.g. Mike" />
				</label>

				<label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
					Your Age
					<input type="number" class="input text-sm" bind:value={$portfolio.config.current_age_primary} min="20" max="120" placeholder="e.g. 55" />
				</label>

				<label class="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300 cursor-pointer">
					<input type="checkbox" class="checkbox" checked={hasSpouse} onchange={() => hasSpouse ? removeSpouse() : addSpouse()} />
					I have a spouse/partner
				</label>

				{#if hasSpouse}
					<label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
						Spouse Name
						<input type="text" class="input text-sm" bind:value={$profile.spouseName} placeholder="e.g. Karen" />
					</label>

					<label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
						Spouse Age
						<input type="number" class="input text-sm" bind:value={$portfolio.config.current_age_spouse} min="20" max="120" />
					</label>
				{/if}

				<label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
					Simulation Years
					<input type="number" class="input text-sm" bind:value={$portfolio.config.simulation_years} min="1" max="60" />
				</label>

				<label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
					Start Year
					<input type="number" class="input text-sm" bind:value={$portfolio.config.start_year} min="2000" max="2100" />
				</label>

				{#if setupError}
					<p class="text-sm text-error-500">{setupError}</p>
				{/if}

				<div class="flex gap-3 pt-2">
					{#if initialNeedsSetup}
						<button class="btn preset-filled" onclick={handleGetStarted}>Get Started</button>
					{/if}
					<button class="btn preset-tonal" onclick={loadSample}>Load Sample Data</button>
				</div>
			</div>

		{:else if activeSection === 'loadsave'}
			<h2 class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-6">Load / Save</h2>

			<input type="file" accept=".json" bind:this={fileInput} onchange={handleFile} hidden />

			<div class="space-y-6 max-w-md">
				<div class="space-y-2">
					<h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300">Load Portfolio</h3>
					<p class="text-xs text-surface-500">Load a previously saved portfolio JSON file.</p>
					<button class="btn preset-tonal" onclick={loadFile}>Choose File...</button>
				</div>

				{#if loadError}
					<pre class="text-sm text-error-500 bg-error-50 dark:bg-error-950 p-3 rounded whitespace-pre-wrap">{loadError}</pre>
				{/if}

				<div class="space-y-2">
					<h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300">Save Portfolio</h3>
					<p class="text-xs text-surface-500">Download your portfolio and profile as a JSON file.</p>
					<button class="btn preset-tonal" onclick={saveFile}>Download JSON</button>
				</div>

			</div>

		{:else if activeSection === 'advanced'}
			<h2 class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-6">Advanced Settings</h2>

			<div class="space-y-4 max-w-md">
				<label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
					State/Local Tax %
					<input type="number" class="input text-sm" value={toPct($portfolio.config.tax_rate_state)} oninput={(e) => setPct(e, (v) => $portfolio.config.tax_rate_state = v)} min="0" max="20" step="0.25" />
				</label>

				<label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
					<span class="flex items-center gap-1">RMD Age <InfoPopover text="Age at which Required Minimum Distributions from pre-tax accounts begin. Currently 73 under the SECURE 2.0 Act." /></span>
					<input type="number" class="input text-sm" bind:value={$portfolio.config.rmd_start_age} min="70" max="80" />
				</label>

				<label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
					<span class="flex items-center gap-1">IRMAA Limit ($) <InfoPopover text="Income threshold above which Medicare Part B/D premiums increase. Roth conversions that push income above this trigger surcharges." /></span>
					<input type="number" class="input text-sm" bind:value={$portfolio.config.irmaa_limit_tier_1} min="0" step="1000" />
				</label>

				<label class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300">
					<span class="flex items-center gap-1">MC Iterations <InfoPopover text="Number of Monte Carlo simulations to run. More iterations give more stable results but take longer." /></span>
					<input type="number" class="input text-sm" bind:value={$numSimulations} min="1" max="10000" />
				</label>

				<div class="pt-4 border-t border-surface-300 dark:border-surface-700">
					<h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-2">Demo</h3>
					{#if showRandomizeConfirm}
						<p class="text-xs text-surface-500 mb-2">This will randomize all account balances and replace names. Continue?</p>
						<div class="flex gap-2">
							<button class="btn btn-sm preset-filled-warning" onclick={() => { randomizeForDemo(); showRandomizeConfirm = false; }}>
								Yes, Randomize
							</button>
							<button class="btn btn-sm preset-tonal" onclick={() => showRandomizeConfirm = false}>
								Cancel
							</button>
						</div>
					{:else}
						<button class="btn btn-sm preset-tonal" onclick={() => showRandomizeConfirm = true}>
							<Shuffle size={14} />
							Randomize for Demo
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
