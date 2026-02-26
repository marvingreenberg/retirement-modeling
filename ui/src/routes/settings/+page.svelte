<script lang="ts">
   import { goto } from '$app/navigation';
   import { page } from '$app/state';
   import {
      portfolio,
      profile,
      numSimulations,
      markFormTouched,
   } from '$lib/stores';
   import { initDarkMode } from '$lib/darkMode.svelte';
   import { isAutoSave, initAutoSave } from '$lib/autoSave.svelte';
   import { avatarSrc, fetchAvatarSvg } from '$lib/avatar.svelte';
   import LoadSaveSection from '$lib/components/settings/LoadSaveSection.svelte';
   import AdvancedSettings from '$lib/components/settings/AdvancedSettings.svelte';
   import { User, FolderOpen, Sliders, LayoutDashboard } from 'lucide-svelte';
   import { onMount } from 'svelte';

   type Section = 'basic' | 'loadsave' | 'advanced';
   const validSections: Section[] = ['basic', 'loadsave', 'advanced'];

   function sectionFromUrl(): Section {
      const s = page.url.searchParams.get('section');
      return validSections.includes(s as Section) ? (s as Section) : 'basic';
   }

   // eslint-disable-next-line svelte/prefer-writable-derived -- also written directly by sidebar clicks
   let activeSection = $state<Section>(sectionFromUrl());

   // Re-read query param when URL changes (e.g. navigating from dropdown)
   $effect(() => {
      activeSection = sectionFromUrl();
   });

   // Track initial setup state at mount time, not reactively (so button doesn't vanish as user types age)
   let initialNeedsSetup = $state(false);
   onMount(() => {
      initialNeedsSetup = $portfolio.config.current_age_primary === 0;
      initDarkMode();
      initAutoSave();
   });

   let src = $derived(
      avatarSrc($profile.primaryName || 'user', $profile.avatarSvg),
   );
   let avatarError = $state(false);
   $effect(() => {
      src;
      avatarError = false;
   });

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
      if (
         $portfolio.config.current_age_primary < 20 ||
         $portfolio.config.current_age_primary > 120
      ) {
         setupError = 'Please enter a valid age between 20 and 120.';
         return;
      }
      setupError = '';
      const simYears = Math.max(1, 95 - $portfolio.config.current_age_primary);
      $portfolio.config.simulation_years = simYears;
      goto('/');
   }

   // Auto-save effect — uses shared module state
   $effect(() => {
      if (isAutoSave()) {
         const data = {
            portfolio: $portfolio,
            profile: $profile,
            numSimulations: $numSimulations,
         };
         localStorage.setItem('retirement-sim-state', JSON.stringify(data));
      }
   });

   // Enter key handler
   function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
         markFormTouched();
         portfolio.update((p) => ({ ...p }));
      }
   }

   const sections: { id: Section; label: string; icon: typeof User }[] = [
      { id: 'basic', label: 'Basic Info', icon: User },
      { id: 'loadsave', label: 'Load / Save', icon: FolderOpen },
      { id: 'advanced', label: 'Advanced Settings', icon: Sliders },
   ];
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
   class="flex min-h-[calc(100vh-6rem)]"
   onkeydown={handleKeydown}
   role="main"
>
   <!-- Left Nav -->
   <nav
      class="w-64 bg-surface-100 dark:bg-surface-800 flex flex-col border-r border-surface-300 dark:border-surface-700"
   >
      <!-- Header: Avatar + Name -->
      <div
         class="p-5 text-center border-b border-surface-300 dark:border-surface-700"
      >
         {#if !avatarError && $profile.primaryName}
            <img
               {src}
               alt="Avatar"
               class="w-16 h-16 rounded-full mx-auto mb-2 bg-surface-200 dark:bg-surface-700"
               onerror={() => (avatarError = true)}
            />
         {:else}
            <div
               class="w-16 h-16 rounded-full mx-auto mb-2 bg-surface-200 dark:bg-surface-700 flex items-center justify-center"
            >
               <User size={28} class="text-surface-500" />
            </div>
         {/if}
         <p
            class="text-sm font-semibold text-surface-900 dark:text-surface-50 truncate"
         >
            {displayName}
         </p>
      </div>

      <!-- Section Links -->
      <div class="flex-1 py-3">
         {#each sections as { id, label, icon: Icon } (id)}
            <button
               class="w-full text-left px-5 py-2.5 flex items-center gap-3 text-sm transition-colors
						{activeSection === id
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold border-r-2 border-primary-500'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'}"
               onclick={() => (activeSection = id)}
            >
               <Icon size={18} />
               {label}
            </button>
         {/each}
      </div>

      <!-- Footer: Back to Overview -->
      <div class="p-4 border-t border-surface-300 dark:border-surface-700">
         <a
            href="/"
            class="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-300 transition-colors"
         >
            <LayoutDashboard size={18} />
            Overview
         </a>
      </div>
   </nav>

   <!-- Content Panel -->
   <div class="flex-1 p-8 overflow-y-auto">
      {#if activeSection === 'basic'}
         <h2
            class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-6"
         >
            Basic Info
         </h2>

         {#if initialNeedsSetup}
            <div
               class="bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800 rounded p-4 mb-6"
            >
               <p class="text-sm text-primary-700 dark:text-primary-300">
                  Enter your info to get started, or use Load / Save to load
                  previously saved data or sample data.
               </p>
            </div>
         {/if}

         <div class="space-y-4 max-w-md">
            <label
               class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300"
            >
               Your Name
               <input
                  type="text"
                  class="input text-sm"
                  bind:value={$profile.primaryName}
                  placeholder="e.g. Mike"
               />
            </label>

            <label
               class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300"
            >
               Your Age
               <input
                  type="number"
                  class="input text-sm"
                  bind:value={$portfolio.config.current_age_primary}
                  min="20"
                  max="120"
                  placeholder="e.g. 55"
               />
            </label>

            <label
               class="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-300 cursor-pointer"
            >
               <input
                  type="checkbox"
                  class="checkbox"
                  checked={hasSpouse}
                  onchange={() => (hasSpouse ? removeSpouse() : addSpouse())}
               />
               I have a spouse/partner
            </label>

            {#if hasSpouse}
               <label
                  class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300"
               >
                  Spouse Name
                  <input
                     type="text"
                     class="input text-sm"
                     bind:value={$profile.spouseName}
                     placeholder="e.g. Karen"
                  />
               </label>

               <label
                  class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300"
               >
                  Spouse Age
                  <input
                     type="number"
                     class="input text-sm"
                     bind:value={$portfolio.config.current_age_spouse}
                     min="20"
                     max="120"
                  />
               </label>
            {/if}

            <label
               class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300"
            >
               Simulation Years
               <input
                  type="number"
                  class="input text-sm"
                  bind:value={$portfolio.config.simulation_years}
                  min="1"
                  max="60"
               />
            </label>

            <label
               class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300"
            >
               Start Year
               <input
                  type="number"
                  class="input text-sm"
                  bind:value={$portfolio.config.start_year}
                  min="2000"
                  max="2100"
               />
            </label>

            <label
               class="flex flex-col gap-1 text-sm font-medium text-surface-700 dark:text-surface-300"
            >
               Retirement Age
               <input
                  type="number"
                  class="input text-sm"
                  value={$portfolio.config.retirement_age ?? ''}
                  onchange={(e) => {
                     const v = e.currentTarget.value;
                     $portfolio.config.retirement_age = v ? Number(v) : null;
                  }}
                  min="0"
                  max="120"
                  placeholder="Not set"
               />
               <span class="text-xs text-surface-400"
                  >Shown as marker on charts</span
               >
            </label>

            {#if setupError}
               <p class="text-sm text-error-500">{setupError}</p>
            {/if}

            {#if initialNeedsSetup}
               <div class="pt-2">
                  <button class="btn preset-filled" onclick={handleGetStarted}
                     >Get Started</button
                  >
               </div>
            {/if}
         </div>
      {:else if activeSection === 'loadsave'}
         <LoadSaveSection />
      {:else if activeSection === 'advanced'}
         <AdvancedSettings />
      {/if}
   </div>
</div>
