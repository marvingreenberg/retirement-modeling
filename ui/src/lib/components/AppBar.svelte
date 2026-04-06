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
      Table,
      CircleHelp,
      LineChart,
   } from 'lucide-svelte';
   import { onMount } from 'svelte';

   const navItems = [
      { href: '/', label: 'Overview', icon: LayoutDashboard },
      { href: '/settings', label: 'Settings', icon: Table },
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
         <div class="flex flex-col">
            <a href="/" class="flex items-center gap-2 text-lg font-bold"
               ><LineChart size={22} />
               <span>Retirement Planner</span></a
            >
            {#if appVersion}
               <div class="flex items-center gap-2 text-sm">
                  <span class="font-medium text-surface-600">v{appVersion}</span
                  >
                  {#if previousVersionUrl && previousVersion}
                     <a
                        href={previousVersionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn btn-sm preset-tonal px-2 py-0.5 text-xs"
                        aria-label="Previous version {previousVersion}"
                     >
                        &#x1F551; v{previousVersion}
                     </a>
                  {/if}
               </div>
            {/if}
         </div>
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
