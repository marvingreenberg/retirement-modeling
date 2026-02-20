<script lang="ts">
   import { profile } from '$lib/stores';
   import { avatarSrc } from '$lib/avatar.svelte';
   import { isDark, initDarkMode, toggleDarkMode } from '$lib/darkMode.svelte';
   import {
      isAutoSave,
      initAutoSave,
      toggleAutoSave,
   } from '$lib/autoSave.svelte';
   import { User, FolderOpen, Sliders, Sun, Moon, Save } from 'lucide-svelte';
   import { onMount } from 'svelte';

   let { open = $bindable(false) }: { open: boolean } = $props();

   onMount(() => {
      initDarkMode();
      initAutoSave();
   });

   let src = $derived(avatarSrc($profile.primaryName, $profile.avatarSvg));
   let imgFailed = $state(false);
   $effect(() => {
      src;
      imgFailed = false;
   });

   let displayName = $derived.by(() => {
      const p = $profile;
      if (!p.primaryName) return '';
      if (p.spouseName) return `${p.primaryName} & ${p.spouseName}`;
      return p.primaryName;
   });

   const sectionLinks = [
      { href: '/settings?section=basic', label: 'Basic Info', icon: User },
      {
         href: '/settings?section=loadsave',
         label: 'Load / Save',
         icon: FolderOpen,
      },
      {
         href: '/settings?section=advanced',
         label: 'Advanced Settings',
         icon: Sliders,
      },
   ] as const;

   function handleBackdrop(e: MouseEvent) {
      if (e.target === e.currentTarget) open = false;
   }

   function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') open = false;
   }
</script>

{#if open}
   <!-- svelte-ignore a11y_no_static_element_interactions -->
   <div
      class="fixed inset-0 z-50"
      onclick={handleBackdrop}
      onkeydown={handleKeydown}
   >
      <div
         class="absolute right-4 top-14 w-56 bg-surface-50 dark:bg-surface-800 rounded-lg shadow-xl border border-surface-200 dark:border-surface-700 p-4"
      >
         <!-- Avatar + Name -->
         <div class="text-center mb-3">
            {#if src && !imgFailed}
               <img
                  {src}
                  alt="Avatar"
                  class="w-14 h-14 rounded-full mx-auto mb-2 bg-surface-200 dark:bg-surface-700"
                  onerror={() => (imgFailed = true)}
               />
            {:else}
               <div
                  class="w-14 h-14 rounded-full mx-auto mb-2 bg-surface-200 dark:bg-surface-700 flex items-center justify-center"
               >
                  <User size={24} class="text-surface-500" />
               </div>
            {/if}
            {#if displayName}
               <p
                  class="text-sm font-semibold text-surface-900 dark:text-surface-50 truncate"
               >
                  {displayName}
               </p>
            {/if}
         </div>

         <hr class="border-surface-300 dark:border-surface-700 mb-2" />

         <!-- Section navigation links -->
         {#each sectionLinks as { href, label, icon: Icon } (href)}
            <a
               {href}
               class="flex items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 rounded hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
               onclick={() => (open = false)}
            >
               <Icon size={16} />
               {label}
            </a>
         {/each}

         <hr class="border-surface-300 dark:border-surface-700 my-2" />

         <!-- Toggle checkboxes -->
         <label
            class="flex items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 rounded hover:bg-surface-200 dark:hover:bg-surface-700 cursor-pointer"
         >
            {#if isDark()}
               <Moon size={16} />
            {:else}
               <Sun size={16} />
            {/if}
            <input
               type="checkbox"
               class="checkbox"
               checked={isDark()}
               onchange={toggleDarkMode}
               aria-label="Toggle dark mode"
            />
            Dark Mode
         </label>

         <label
            class="flex items-center gap-2 px-3 py-2 text-sm text-surface-700 dark:text-surface-300 rounded hover:bg-surface-200 dark:hover:bg-surface-700 cursor-pointer"
         >
            <Save size={16} />
            <input
               type="checkbox"
               class="checkbox"
               checked={isAutoSave()}
               onchange={toggleAutoSave}
               aria-label="Toggle auto-save"
            />
            Auto-save
         </label>
      </div>
   </div>
{/if}
