<script lang="ts">
   import { goto } from '$app/navigation';
   import { portfolio, profile, sampleScenarios } from '$lib/stores';
   import { saveFileSchema } from '$lib/schema';
   import type { Portfolio } from '$lib/types';
   import { saveJsonFile, loadJsonFile, generateFilename } from '$lib/fileIO';

   let fileInput = $state<HTMLInputElement>(undefined!);
   let loadError = $state('');

   function loadScenario(name: string) {
      const scenario = sampleScenarios[name];
      if (!scenario) return;
      profile.value = structuredClone(scenario.profile);
      portfolio.value = structuredClone(scenario.portfolio);
      goto('/');
   }

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
            loadError =
               'Invalid portfolio file — may be pre-version 0.10.0 data.';
            return;
         }
         const { profile: loadedProfile, ...portfolioData } = result.data;
         portfolio.value = portfolioData as Portfolio;
         if (loadedProfile) profile.value = loadedProfile;
         goto('/');
      } catch {
         loadError = 'Invalid JSON file';
      }
   }

   async function saveFile() {
      const p = $state.snapshot(portfolio.value);
      const profileData = $state.snapshot(profile.value);
      const saveData = { ...p, profile: profileData };
      const filename = generateFilename(
         profile.value.primaryName,
         profile.value.spouseName,
      );
      await saveJsonFile(saveData, filename);
   }
</script>

<h2 class="text-xl font-bold text-surface-900 dark:text-surface-50 mb-6">
   Load / Save
</h2>

<input
   type="file"
   accept=".json"
   bind:this={fileInput}
   onchange={handleFile}
   hidden
/>

<div class="space-y-6 max-w-md">
   <div class="space-y-2">
      <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300">
         Load Portfolio
      </h3>
      <p class="text-xs text-surface-500">
         Load a previously saved portfolio JSON file.
      </p>
      <button class="btn preset-tonal" onclick={loadFile}>Choose File...</button
      >
   </div>

   {#if loadError}
      <pre
         class="text-sm text-error-500 bg-error-50 dark:bg-error-950 p-3 rounded whitespace-pre-wrap">{loadError}</pre>
   {/if}

   <div class="space-y-2">
      <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300">
         Load Sample Data
      </h3>
      <p class="text-xs text-surface-500">
         Load a pre-built scenario to explore the simulator.
      </p>
      <select
         class="select text-sm w-48"
         aria-label="Load Sample Data"
         onchange={(e) => {
            const val = (e.target as HTMLSelectElement).value;
            if (val) loadScenario(val);
            (e.target as HTMLSelectElement).value = '';
         }}
      >
         <option value="">Select scenario...</option>
         {#each Object.keys(sampleScenarios) as name (name)}
            <option value={name}>{name}</option>
         {/each}
      </select>
   </div>

   <div class="space-y-2">
      <h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300">
         Save Portfolio
      </h3>
      <p class="text-xs text-surface-500">
         Download your portfolio and profile as a JSON file.
      </p>
      <button class="btn preset-tonal" onclick={saveFile}>Download JSON</button>
   </div>
</div>
