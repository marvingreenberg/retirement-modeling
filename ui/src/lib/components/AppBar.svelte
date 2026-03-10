<script lang="ts">
   import { page } from '$app/state';
   import { AppBar as SkAppBar } from '@skeletonlabs/skeleton-svelte';
   import AvatarButton from './AvatarButton.svelte';
   import AvatarDropdown from './AvatarDropdown.svelte';
   import HelpPanel from './HelpPanel.svelte';
   import { openHelp } from '$lib/helpState.svelte';
   import { getDefaultTopicId } from '$lib/helpTopics';
   import {
      LayoutDashboard,
      GitCompareArrows,
      Table,
      CircleHelp,
      LineChart,
      History,
   } from 'lucide-svelte';
   import { onMount } from 'svelte';

   const navItems = [
      { href: '/', label: 'Overview', icon: LayoutDashboard },
      { href: '/details', label: 'Details', icon: Table },
      { href: '/compare', label: 'Compare', icon: GitCompareArrows },
   ] as const;

   function isActive(href: string): boolean {
      if (href === '/') return page.url.pathname === '/';
      return page.url.pathname.startsWith(href);
   }

   let dropdownOpen = $state(false);
   let appVersion = $state('');
   let previousVersionUrl = $state('');
   let previousVersion = $state('');

   onMount(async () => {
      try {
         const res = await fetch('/api/v1/status');
         if (res.ok) {
            const data = await res.json();
            appVersion = data.version ?? '';
            previousVersionUrl = data.previous_version_url ?? '';
            previousVersion = data.previous_version ?? '';
         }
      } catch {
         /* dev mode without backend */
      }
   });
</script>

<SkAppBar>
   <SkAppBar.Toolbar class="grid-cols-[auto_1fr_auto]">
      <SkAppBar.Lead>
         <a href="/" class="flex items-center gap-2 text-lg font-bold"
            ><LineChart size={22} />
            <span
               >Retirement Planner{#if appVersion}<span
                     class="block text-[9px] font-normal text-surface-400 leading-none"
                     >v{appVersion}</span
                  >{/if}</span
            ></a
         >
         {#if previousVersionUrl && previousVersion}
            <a
               href={previousVersionUrl}
               target="_blank"
               rel="noopener noreferrer"
               class="btn btn-sm preset-tonal flex items-center gap-1 ml-2"
               title="Run previous version {previousVersion}"
            >
               <History size={14} />
               <span class="text-xs">v{previousVersion}</span>
            </a>
         {/if}
      </SkAppBar.Lead>
      <SkAppBar.Headline>
         <nav class="flex items-center justify-center gap-1">
            {#each navItems as { href, label, icon: Icon } (href)}
               <a
                  {href}
                  class="btn btn-md flex items-center gap-1.5 {isActive(href)
                     ? 'preset-filled'
                     : 'preset-ghost'}"
                  aria-current={isActive(href) ? 'page' : undefined}
               >
                  <Icon size={18} />
                  {label}
               </a>
            {/each}
         </nav>
      </SkAppBar.Headline>
      <SkAppBar.Trail>
         <button
            class="btn btn-sm preset-ghost"
            color="dark cyan"
            onclick={() => openHelp(getDefaultTopicId(page.url.pathname))}
            aria-label="Open help"
         >
            <CircleHelp color="DarkCyan" size={36} />
         </button>
         <AvatarButton onclick={() => (dropdownOpen = !dropdownOpen)} />
      </SkAppBar.Trail>
   </SkAppBar.Toolbar>
</SkAppBar>

<AvatarDropdown bind:open={dropdownOpen} />
<HelpPanel />
